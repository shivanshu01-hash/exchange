import http from "node:http";
import { env } from "./config/env.js";
import { connectMongo } from "./db/mongo.js";
import { createApp } from "./app.js";
import { createOptimizedSocketServer } from "./socket/optimizedSocketServer.js";
import { BetfairStreamClient } from "./stream/betfairStreamClient.js";

await connectMongo();
const app = createApp();
const server = http.createServer(app);

// Create optimized socket server with monitoring
const socketServer = createOptimizedSocketServer(server);

// Add polling fallback endpoint
app.get("/api/poll/market/:marketId", async (req, res) => {
  try {
    const { marketId } = req.params;
    const { since } = req.query;
    
    // Import market cache
    const { getMarketSnapshot } = await import("./services/marketCache.js");
    
    const snapshot = await getMarketSnapshot(marketId);
    
    if (!snapshot) {
      return res.status(404).json({ error: "Market not found" });
    }
    
    // If since parameter is provided, only return if data is newer
    if (since) {
      const sinceTime = parseInt(since as string);
      const snapshotTime = new Date(snapshot.updatedAt).getTime();
      
      if (snapshotTime > sinceTime) {
        return res.json({
          data: snapshot,
          timestamp: snapshotTime,
          nextPoll: 2000, // Suggest next poll in 2 seconds
        });
      } else {
        return res.json({
          data: null,
          timestamp: snapshotTime,
          nextPoll: 5000, // No updates, poll less frequently
        });
      }
    }
    
    const snapshotTime = new Date(snapshot.updatedAt).getTime();
    res.json({
      data: snapshot,
      timestamp: snapshotTime,
      nextPoll: 2000,
    });
  } catch (error) {
    console.error("Polling error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint for socket server
app.get("/api/health/socket", (req, res) => {
  const stats = socketServer.getConnectionStats();
  res.json({
    status: "healthy",
    connections: stats.totalConnections,
    rooms: stats.totalRooms,
    timestamp: Date.now(),
  });
});

const stream = new BetfairStreamClient({ marketIds: [] });
stream.connect();

server.listen(env.PORT, () => {
  console.log(`API server listening on ${env.PORT}`);
  console.log(`WebSocket server initialized with optimized transport`);
  console.log(`Polling fallback available at /api/poll/market/:marketId`);
});

process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  stream.close();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
