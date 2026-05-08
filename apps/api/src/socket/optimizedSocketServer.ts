import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env.js";
import { keys, sub } from "../db/redis.js";
import { getMarketSnapshot } from "../services/marketCache.js";

export interface SocketUser {
  id: string;
  email?: string;
}

export interface ConnectionMetrics {
  connectedAt: number;
  lastActivity: number;
  subscriptionCount: number;
  messageCount: number;
  latency: number;
}

export class OptimizedSocketServer {
  private io: Server;
  private connectionMetrics = new Map<string, ConnectionMetrics>();
  private subscriptionLimits = new Map<string, number>(); // user -> subscription count
  private readonly MAX_SUBSCRIPTIONS_PER_USER = 50;
  private readonly HEARTBEAT_INTERVAL = 10000;
  private readonly CONNECTION_TIMEOUT = 30000;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: env.WEB_ORIGIN, credentials: true },
      transports: ["websocket", "polling"],
      pingInterval: this.HEARTBEAT_INTERVAL,
      pingTimeout: 5000,
      maxHttpBufferSize: 1e6, // 1MB max message size
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
      allowEIO3: true,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscriptions();
    this.startCleanupInterval();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, "");
      
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      try {
        const user = jwt.verify(token, env.JWT_SECRET, { issuer: "odds-exchange" }) as SocketUser;
        socket.data.user = user;
        socket.data.connectedAt = Date.now();
        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Unauthorized"));
      }
    });

    // Rate limiting middleware (simplified)
    this.io.use((socket, next) => {
      const userId = socket.data.user?.id;
      if (!userId) return next();

      const now = Date.now();
      const metrics = this.connectionMetrics.get(socket.id);
      
      if (metrics && now - metrics.lastActivity < 100) {
        // Too many messages too fast
        return next(new Error("Rate limit exceeded"));
      }

      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      const userId = socket.data.user.id;
      const socketId = socket.id;
      
      console.log(`Socket connected: ${socketId} for user ${userId}`);

      // Initialize metrics
      this.connectionMetrics.set(socketId, {
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        subscriptionCount: 0,
        messageCount: 0,
        latency: 0,
      });

      // Join user room for private messages
      socket.join(`user:${userId}`);

      // Market subscription handlers
      socket.on("market:subscribe", async (marketId: string) => {
        this.updateActivity(socketId);
        
        // Check subscription limits
        const currentSubs = this.subscriptionLimits.get(userId) || 0;
        if (currentSubs >= this.MAX_SUBSCRIPTIONS_PER_USER) {
          socket.emit("error", { code: "SUBSCRIPTION_LIMIT", message: "Maximum subscription limit reached" });
          return;
        }

        const room = keys.roomMarket(marketId);
        socket.join(room);
        
        // Update subscription count
        this.subscriptionLimits.set(userId, currentSubs + 1);
        
        // Send current snapshot if available
        const snapshot = await getMarketSnapshot(marketId);
        if (snapshot) {
          socket.emit("market:snapshot", snapshot);
        }

        // Update metrics
        const metrics = this.connectionMetrics.get(socketId);
        if (metrics) {
          metrics.subscriptionCount++;
        }
      });

      socket.on("market:unsubscribe", (marketId: string) => {
        this.updateActivity(socketId);
        socket.leave(keys.roomMarket(marketId));
        
        // Update subscription count
        const currentSubs = this.subscriptionLimits.get(userId) || 0;
        if (currentSubs > 0) {
          this.subscriptionLimits.set(userId, currentSubs - 1);
        }

        // Update metrics
        const metrics = this.connectionMetrics.get(socketId);
        if (metrics && metrics.subscriptionCount > 0) {
          metrics.subscriptionCount--;
        }
      });

      // Batch subscription handler
      socket.on("market:batch-subscribe", async (marketIds: string[]) => {
        this.updateActivity(socketId);
        
        // Limit batch size
        const limitedIds = marketIds.slice(0, 10);
        
        const currentSubs = this.subscriptionLimits.get(userId) || 0;
        const availableSubs = this.MAX_SUBSCRIPTIONS_PER_USER - currentSubs;
        
        if (availableSubs <= 0) {
          socket.emit("error", { code: "SUBSCRIPTION_LIMIT", message: "Maximum subscription limit reached" });
          return;
        }

        const idsToSubscribe = limitedIds.slice(0, availableSubs);
        
        for (const marketId of idsToSubscribe) {
          const room = keys.roomMarket(marketId);
          socket.join(room);
          
          const snapshot = await getMarketSnapshot(marketId);
          if (snapshot) {
            socket.emit("market:snapshot", snapshot);
          }
        }
        
        // Update subscription count
        this.subscriptionLimits.set(userId, currentSubs + idsToSubscribe.length);
        
        // Update metrics
        const metrics = this.connectionMetrics.get(socketId);
        if (metrics) {
          metrics.subscriptionCount += idsToSubscribe.length;
        }

        if (idsToSubscribe.length < limitedIds.length) {
          socket.emit("warning", {
            message: `Subscribed to ${idsToSubscribe.length} of ${limitedIds.length} markets due to limit`,
            subscribed: idsToSubscribe,
            skipped: limitedIds.slice(idsToSubscribe.length),
          });
        }
      });

      socket.on("market:batch-unsubscribe", (marketIds: string[]) => {
        this.updateActivity(socketId);
        
        for (const marketId of marketIds) {
          socket.leave(keys.roomMarket(marketId));
        }
        
        // Update subscription count
        const currentSubs = this.subscriptionLimits.get(userId) || 0;
        const newSubs = Math.max(0, currentSubs - marketIds.length);
        this.subscriptionLimits.set(userId, newSubs);

        // Update metrics
        const metrics = this.connectionMetrics.get(socketId);
        if (metrics) {
          metrics.subscriptionCount = Math.max(0, metrics.subscriptionCount - marketIds.length);
        }
      });

      // Heartbeat handler with latency calculation
      socket.on("heartbeat", (sentAt: number) => {
        this.updateActivity(socketId);
        const latency = Date.now() - sentAt;
        
        // Update latency metrics
        const metrics = this.connectionMetrics.get(socketId);
        if (metrics) {
          metrics.latency = latency;
        }
        
        socket.emit("heartbeat:ack", { sentAt, serverAt: Date.now(), latency });
      });

      // Connection quality request
      socket.on("connection:quality", () => {
        const metrics = this.connectionMetrics.get(socketId);
        if (metrics) {
          const quality = this.calculateConnectionQuality(metrics);
          socket.emit("connection:quality", { quality, latency: metrics.latency });
        }
      });

      // Disconnection handler
      socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${socketId}, reason: ${reason}`);
        
        // Clean up metrics and subscriptions
        this.connectionMetrics.delete(socketId);
        
        const currentSubs = this.subscriptionLimits.get(userId) || 0;
        const metrics = this.connectionMetrics.get(socketId);
        const subsToRemove = metrics?.subscriptionCount || 0;
        
        if (subsToRemove > 0) {
          this.subscriptionLimits.set(userId, Math.max(0, currentSubs - subsToRemove));
        }
      });

      // Error handler
      socket.on("error", (error) => {
        console.error(`Socket error for ${socketId}:`, error);
      });
    });
  }

  private setupRedisSubscriptions(): void {
    sub.subscribe(keys.oddsChannel, keys.tradeChannel, keys.walletChannel);
    
    sub.on("message", (channel: string, payload: string) => {
      try {
        const message = JSON.parse(payload);
        
        switch (channel) {
          case keys.oddsChannel:
            // Batch market updates for efficiency
            this.io.to(keys.roomMarket(message.marketId)).emit("market:update", message);
            break;
            
          case keys.tradeChannel:
            this.io.to(keys.roomMarket(message.marketId)).emit("trade:update", message);
            break;
            
          case keys.walletChannel:
            this.io.to(`user:${message.userId}`).emit("wallet:update", message.wallet);
            break;
        }
      } catch (error) {
        console.error("Error processing Redis message:", error);
      }
    });
  }

  private updateActivity(socketId: string): void {
    const metrics = this.connectionMetrics.get(socketId);
    if (metrics) {
      metrics.lastActivity = Date.now();
      metrics.messageCount++;
    }
  }

  private calculateConnectionQuality(metrics: ConnectionMetrics): number {
    // Simple quality calculation based on latency and activity
    let quality = 100;
    
    // Penalize high latency
    if (metrics.latency > 1000) quality -= 40;
    else if (metrics.latency > 500) quality -= 20;
    else if (metrics.latency > 200) quality -= 10;
    
    // Penalize high message rate (potential spam)
    const timeConnected = Date.now() - metrics.connectedAt;
    const messagesPerSecond = metrics.messageCount / (timeConnected / 1000);
    if (messagesPerSecond > 10) quality -= 20;
    else if (messagesPerSecond > 5) quality -= 10;
    
    return Math.max(0, Math.min(100, quality));
  }

  private startCleanupInterval(): void {
    // Clean up stale connections every minute
    setInterval(() => {
      const now = Date.now();
      
      for (const [socketId, metrics] of this.connectionMetrics.entries()) {
        if (now - metrics.lastActivity > this.CONNECTION_TIMEOUT) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
            console.log(`Disconnected stale socket: ${socketId}`);
          }
          this.connectionMetrics.delete(socketId);
        }
      }
      
      // Clean up subscription limits for disconnected users
      // This would require tracking which sockets belong to which users
      // For simplicity, we'll skip this for now
    }, 60000); // Every minute
  }

  // Public methods for monitoring
  getConnectionStats() {
    const stats = {
      totalConnections: this.io.engine.clientsCount,
      totalRooms: this.io.sockets.adapter.rooms.size,
      connectionMetrics: Array.from(this.connectionMetrics.entries()).map(([socketId, metrics]) => ({
        socketId,
        ...metrics,
        connectedDuration: Date.now() - metrics.connectedAt,
      })),
      subscriptionLimits: Array.from(this.subscriptionLimits.entries()).map(([userId, count]) => ({
        userId,
        count,
      })),
    };
    
    return stats;
  }

  broadcastToMarket(marketId: string, event: string, data: any): void {
    this.io.to(keys.roomMarket(marketId)).emit(event, data);
  }

  sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  getServer() {
    return this.io;
  }
}

// Factory function for backward compatibility
export function createOptimizedSocketServer(httpServer: HttpServer): OptimizedSocketServer {
  return new OptimizedSocketServer(httpServer);
}