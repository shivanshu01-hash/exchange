import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { cricketRouter } from "./routes/cricket.js";
import { marketsRouter } from "./routes/markets.js";
import { ordersRouter } from "./routes/orders.js";
import { walletRouter } from "./routes/wallet.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "256kb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: true, legacyHeaders: false }));
  app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
  app.use("/api/auth", authRouter);
  app.use("/api/cricket", cricketRouter);
  app.use("/api/markets", marketsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/admin", adminRouter);
  app.use(errorHandler);
  return app;
}
