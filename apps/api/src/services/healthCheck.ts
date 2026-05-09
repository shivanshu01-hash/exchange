import mongoose from "mongoose";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    [key: string]: {
      status: "healthy" | "unhealthy";
      duration: number;
      details?: any;
    };
  };
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    loadavg: number[];
    platform: string;
    nodeVersion: string;
  };
}

export class HealthCheckService {
  private redis?: Redis;
  private mongoConnection?: typeof mongoose.connection;

  constructor() {
    // Try to get existing connections
    if (mongoose.connection.readyState === 1) {
      this.mongoConnection = mongoose.connection;
    }

    // Redis connection will be created on demand
  }

  private async checkMongoDB(): Promise<{ status: "healthy" | "unhealthy"; details?: any }> {
    const start = Date.now();
    try {
      if (this.mongoConnection && this.mongoConnection.readyState === 1) {
        // Ping the database
        const db = this.mongoConnection.db;
        if (db) {
          await db.admin().ping();
          return {
            status: "healthy",
            details: {
              readyState: this.mongoConnection.readyState,
              host: this.mongoConnection.host,
              name: this.mongoConnection.name,
            },
          };
        }
      }
      // Try to create a new connection
      const testConnection = await mongoose.createConnection(env.MONGODB_URI);
      const testDb = testConnection.db;
      if (testDb) {
        await testDb.admin().ping();
      }
      await testConnection.close();
      return {
        status: "healthy",
        details: { message: "Test connection successful" },
      };
    } catch (error: any) {
      logger.error("MongoDB health check failed", { error: error.message });
      return {
        status: "unhealthy",
        details: { error: error.message },
      };
    } finally {
      logger.debug(`MongoDB health check took ${Date.now() - start}ms`);
    }
  }

  private async checkRedis(): Promise<{ status: "healthy" | "unhealthy"; details?: any }> {
    const start = Date.now();
    let redis: Redis | undefined;
    try {
      if (!env.REDIS_URL) {
        return {
          status: "healthy",
          details: { message: "Redis not configured, skipping" },
        };
      }

      redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        commandTimeout: 5000,
      });

      // Test connection with PING
      const pong = await redis.ping();
      if (pong !== "PONG") {
        throw new Error(`Unexpected response: ${pong}`);
      }

      return {
        status: "healthy",
        details: { message: "Redis connection successful" },
      };
    } catch (error: any) {
      logger.error("Redis health check failed", { error: error.message });
      return {
        status: "unhealthy",
        details: { error: error.message },
      };
    } finally {
      if (redis) {
        redis.quit().catch(() => {});
      }
      logger.debug(`Redis health check took ${Date.now() - start}ms`);
    }
  }

  private checkSystem(): { status: "healthy"; details: any } {
    return {
      status: "healthy",
      details: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        loadavg: process.platform === "win32" ? [0, 0, 0] : require("os").loadavg(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Run all checks in parallel
    const [mongoResult, redisResult, systemResult] = await Promise.all([
      this.checkMongoDB(),
      this.checkRedis(),
      Promise.resolve(this.checkSystem()),
    ]);

    const checks = {
      mongodb: { ...mongoResult, duration: Date.now() - startTime },
      redis: { ...redisResult, duration: Date.now() - startTime },
      system: { ...systemResult, duration: Date.now() - startTime },
    };

    // Determine overall status
    const unhealthyChecks = Object.values(checks).filter(c => c.status === "unhealthy");
    const overallStatus = unhealthyChecks.length === 0 ? "healthy" : 
                         unhealthyChecks.length === Object.keys(checks).length ? "unhealthy" : "degraded";

    return {
      status: overallStatus,
      timestamp,
      checks,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        loadavg: process.platform === "win32" ? [0, 0, 0] : require("os").loadavg(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };
  }

  async getHealthStatus() {
    const health = await this.performHealthCheck();
    
    // Return appropriate HTTP status code
    const statusCode = health.status === "healthy" ? 200 : 
                      health.status === "degraded" ? 207 : 503;
    
    return {
      statusCode,
      body: health,
    };
  }
}

// Singleton instance
export const healthCheckService = new HealthCheckService();