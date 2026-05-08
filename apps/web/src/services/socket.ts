"use client";

import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api-client";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export interface SocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  transports?: ("websocket" | "polling")[];
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export interface SocketEventMap {
  "market:snapshot": (data: any) => void;
  "market:update": (data: any) => void;
  "trade:update": (data: any) => void;
  "wallet:update": (data: any) => void;
  "heartbeat:ack": (data: { sentAt: number; serverAt: number }) => void;
  "connection:state": (state: ConnectionState) => void;
  "connection:quality": (quality: number) => void; // 0-100%
}

export class OptimizedSocketClient {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = "disconnected";
  private listeners = new Map<string, Set<Function>>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeatSent: number = 0;
  private lastHeartbeatReceived: number = 0;
  private connectionQuality: number = 100;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private messageQueue: Array<{ event: string; data: any }> = [];
  private isQueueProcessing = false;
  private options: Required<SocketOptions>;

  constructor(options: SocketOptions = {}) {
    this.options = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      heartbeatInterval: 10000,
      heartbeatTimeout: 5000,
      ...options,
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.updateConnectionState("connecting");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    this.socket = io(API_URL, {
      auth: { token },
      transports: this.options.transports,
      reconnection: this.options.reconnection,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    this.cleanupHeartbeat();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.updateConnectionState("disconnected");
    this.reconnectAttempts = 0;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.updateConnectionState("connected");
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
    });

    this.socket.on("disconnect", (reason) => {
      this.updateConnectionState("disconnected");
      this.cleanupHeartbeat();
      console.log(`Socket disconnected: ${reason}`);
    });

    this.socket.on("connect_error", (error) => {
      this.updateConnectionState("error");
      console.error("Socket connection error:", error);
      
      // Try fallback to polling if websocket fails
      if (this.options.transports[0] === "websocket" && this.reconnectAttempts > 2) {
        console.log("Attempting fallback to polling...");
        this.disconnect();
        this.options.transports = ["polling", "websocket"];
        setTimeout(() => this.connect(), 1000);
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      this.updateConnectionState("connected");
      this.reconnectAttempts = attemptNumber;
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      this.updateConnectionState("reconnecting");
      this.reconnectAttempts = attemptNumber;
      console.log(`Socket reconnect attempt ${attemptNumber}`);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Socket reconnect error:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Socket reconnect failed after all attempts");
      this.updateConnectionState("error");
    });

    // Forward all application events to listeners
    const forwardEvent = (event: string) => (data: any) => {
      this.emitToListeners(event, data);
    };

    // Listen for application events
    this.socket.on("market:snapshot", forwardEvent("market:snapshot"));
    this.socket.on("market:update", forwardEvent("market:update"));
    this.socket.on("trade:update", forwardEvent("trade:update"));
    this.socket.on("wallet:update", forwardEvent("wallet:update"));
    this.socket.on("heartbeat:ack", (data) => {
      this.lastHeartbeatReceived = Date.now();
      const latency = this.lastHeartbeatReceived - data.sentAt;
      this.updateConnectionQuality(latency);
      this.emitToListeners("heartbeat:ack", data);
    });
  }

  private startHeartbeat(): void {
    this.cleanupHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.lastHeartbeatSent = Date.now();
        this.socket.emit("heartbeat", this.lastHeartbeatSent);
        
        // Check for heartbeat timeout
        setTimeout(() => {
          if (this.lastHeartbeatReceived < this.lastHeartbeatSent) {
            this.updateConnectionQuality(-1); // Indicate timeout
          }
        }, this.options.heartbeatTimeout);
      }
    }, this.options.heartbeatInterval);
  }

  private cleanupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private updateConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emitToListeners("connection:state", state);
    }
  }

  private updateConnectionQuality(latency: number): void {
    if (latency < 0) {
      // Heartbeat timeout
      this.connectionQuality = Math.max(0, this.connectionQuality - 20);
    } else if (latency < 100) {
      // Excellent latency
      this.connectionQuality = Math.min(100, this.connectionQuality + 5);
    } else if (latency < 500) {
      // Good latency
      this.connectionQuality = Math.min(100, this.connectionQuality + 2);
    } else if (latency < 1000) {
      // Fair latency
      this.connectionQuality = Math.max(0, this.connectionQuality - 5);
    } else {
      // Poor latency
      this.connectionQuality = Math.max(0, this.connectionQuality - 10);
    }
    
    this.emitToListeners("connection:quality", this.connectionQuality);
  }

  private emitToListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in socket listener for event ${event}:`, error);
        }
      });
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isQueueProcessing || !this.socket?.connected) return;
    
    this.isQueueProcessing = true;
    
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.socket.emit(message.event, message.data);
        } catch (error) {
          console.error(`Failed to send queued message ${message.event}:`, error);
          // Re-queue the message
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
    
    this.isQueueProcessing = false;
  }

  // Public API
  subscribeToMarket(marketId: string): void {
    this.sendOrQueue("market:subscribe", marketId);
  }

  unsubscribeFromMarket(marketId: string): void {
    this.sendOrQueue("market:unsubscribe", marketId);
  }

  private sendOrQueue(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.messageQueue.push({ event, data });
    }
  }

  on<K extends keyof SocketEventMap>(event: K, listener: SocketEventMap[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off<K extends keyof SocketEventMap>(event: K, listener: SocketEventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  getState(): ConnectionState {
    return this.connectionState;
  }

  getConnectionQuality(): number {
    return this.connectionQuality;
  }

  isConnected(): boolean {
    return this.connectionState === "connected" && this.socket?.connected === true;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  // Batch multiple operations
  batch(operations: Array<{ type: "subscribe" | "unsubscribe"; marketId: string }>): void {
    // Group by type for efficiency
    const subscribeIds = operations.filter(op => op.type === "subscribe").map(op => op.marketId);
    const unsubscribeIds = operations.filter(op => op.type === "unsubscribe").map(op => op.marketId);
    
    if (subscribeIds.length > 0) {
      this.sendOrQueue("market:batch-subscribe", subscribeIds);
    }
    
    if (unsubscribeIds.length > 0) {
      this.sendOrQueue("market:batch-unsubscribe", unsubscribeIds);
    }
  }
}

// Singleton instance for global use
let globalSocketInstance: OptimizedSocketClient | null = null;

export function getOptimizedSocket(options?: SocketOptions): OptimizedSocketClient {
  if (!globalSocketInstance) {
    globalSocketInstance = new OptimizedSocketClient(options);
  }
  return globalSocketInstance;
}

// React hook for using the socket (simplified version)
export function useSocket() {
  // In a real implementation, this would be a proper React hook
  // For now, we'll return the global instance
  return getOptimizedSocket();
}