import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Market } from "../models/Market.js";
import { getMarketSnapshot, listCachedMarkets, setMarketSnapshot } from "../services/marketCache.js";
import { settleMarket } from "../services/settlementEngine.js";

export const marketsRouter = Router();
marketsRouter.use(requireAuth);

marketsRouter.get("/", async (_req, res) => res.json(await listCachedMarkets()));
marketsRouter.get("/:marketId", async (req, res) => res.json(await getMarketSnapshot(req.params.marketId)));

marketsRouter.post("/", requireAdmin, validateBody(z.object({
  marketId: z.string(), eventName: z.string(), marketName: z.string(), startTime: z.string(),
  runners: z.array(z.object({ selectionId: z.string(), name: z.string() }))
})), async (req, res, next) => {
  try {
    const market = await Market.create(req.body);
    await setMarketSnapshot({ ...req.body, status: "OPEN", version: 1, updatedAt: new Date().toISOString(), runners: req.body.runners.map((runner: any) => ({ selectionId: runner.selectionId, back: [], lay: [], matchedVolume: 0, status: "ACTIVE" })) });
    res.status(201).json(market);
  } catch (err) { next(err); }
});

marketsRouter.post("/:marketId/settle", requireAdmin, validateBody(z.object({ winningSelectionId: z.string() })), async (req, res, next) => {
  try { res.json(await settleMarket(req.params.marketId, req.body.winningSelectionId)); } catch (err) { next(err); }
});
