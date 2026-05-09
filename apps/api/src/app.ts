import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { healthCheckService } from "./services/healthCheck.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { cricketRouter } from "./routes/cricket.js";
import { marketsRouter } from "./routes/markets.js";
import { ordersRouter } from "./routes/orders.js";
import { walletRouter } from "./routes/wallet.js";
import { logger, logStream } from "./utils/logger.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  // Enhanced helmet configuration for production security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", env.WEB_ORIGIN],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );
  // HTTP request logging (skip in test environment)
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev", { stream: logStream }));
  }
  
  // Enable compression for all responses
  app.use(compression());
  
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "256kb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: true, legacyHeaders: false }));
  // Health endpoints
  app.get("/health", async (_req, res) => {
    const { statusCode, body } = await healthCheckService.getHealthStatus();
    res.status(statusCode).json(body);
  });
  
  // Simple health check for quick monitoring
  app.get("/health/simple", (_req, res) => res.json({ ok: true, ts: Date.now() }));
  app.use("/api/auth", authRouter);
  app.use("/api/cricket", cricketRouter);
  app.use("/api/markets", marketsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/admin", adminRouter);
  app.use(errorHandler);
  
  // Log app initialization
  logger.info(`Express app initialized with CORS origin: ${env.WEB_ORIGIN}`);
  return app;
}
