import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { keys, sub } from "../db/redis.js";
import { getMarketSnapshot } from "../services/marketCache.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.WEB_ORIGIN, credentials: true },
    transports: ["websocket"],
    pingInterval: 10000,
    pingTimeout: 5000
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("Unauthorized"));
    try {
      socket.data.user = jwt.verify(token, env.JWT_SECRET, { issuer: "odds-exchange" });
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);
    socket.on("market:subscribe", async (marketId: string) => {
      socket.join(keys.roomMarket(marketId));
      const snapshot = await getMarketSnapshot(marketId);
      if (snapshot) socket.emit("market:snapshot", snapshot);
    });
    socket.on("market:unsubscribe", (marketId: string) => socket.leave(keys.roomMarket(marketId)));
    socket.on("heartbeat", (sentAt: number) => socket.emit("heartbeat:ack", { sentAt, serverAt: Date.now() }));
  });

  sub.subscribe(keys.oddsChannel, keys.tradeChannel, keys.walletChannel);
  sub.on("message", (channel: string, payload: string) => {
    const message = JSON.parse(payload);
    if (channel === keys.oddsChannel) io.to(keys.roomMarket(message.marketId)).emit("market:update", message);
    if (channel === keys.tradeChannel) io.to(keys.roomMarket(message.marketId)).emit("trade:update", message);
    if (channel === keys.walletChannel) io.to(`user:${message.userId}`).emit("wallet:update", message.wallet);
  });

  return io;
}
