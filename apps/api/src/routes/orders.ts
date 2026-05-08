import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Order } from "../models/Order.js";
import { cancelOrder, placeOrder } from "../services/matchingEngine.js";
import { executeCashout, quoteCashout } from "../services/cashoutEngine.js";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const orderInput = z.object({ marketId: z.string(), selectionId: z.string(), side: z.enum(["BACK", "LAY"]), price: z.number(), stake: z.number(), clientOrderId: z.string().min(6) });

ordersRouter.post("/", validateBody(orderInput), async (req, res, next) => {
  try { res.status(201).json(await placeOrder(req.user!.id, req.body)); } catch (err) { next(err); }
});

ordersRouter.get("/open", async (req, res) => res.json(await Order.find({ userId: req.user!.id, status: { $in: ["OPEN", "PARTIALLY_MATCHED"] } }).sort({ createdAt: -1 })));
ordersRouter.get("/matched", async (req, res) => res.json(await Order.find({ userId: req.user!.id, matchedStake: { $gt: 0 } }).sort({ createdAt: -1 })));
ordersRouter.delete("/:orderId", async (req, res, next) => {
  try { res.json(await cancelOrder(req.user!.id, req.params.orderId)); } catch (err) { next(err); }
});
ordersRouter.post("/cashout/quote", validateBody(z.object({ marketId: z.string(), selectionId: z.string(), currentOdds: z.number() })), async (req, res, next) => {
  try { res.json(await quoteCashout(req.user!.id, req.body.marketId, req.body.selectionId, req.body.currentOdds)); } catch (err) { next(err); }
});
ordersRouter.post("/cashout/execute", validateBody(z.object({ marketId: z.string(), selectionId: z.string(), currentOdds: z.number() })), async (req, res, next) => {
  try { res.json(await executeCashout(req.user!.id, req.body.marketId, req.body.selectionId, req.body.currentOdds)); } catch (err) { next(err); }
});
