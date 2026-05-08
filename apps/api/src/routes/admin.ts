import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { Market } from "../models/Market.js";
import { Order } from "../models/Order.js";
import { Trade } from "../models/Trade.js";
import { User } from "../models/User.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/summary", async (_req, res) => {
  const [users, markets, openOrders, trades] = await Promise.all([User.countDocuments(), Market.countDocuments(), Order.countDocuments({ status: { $in: ["OPEN", "PARTIALLY_MATCHED"] } }), Trade.countDocuments()]);
  res.json({ users, markets, openOrders, trades });
});
