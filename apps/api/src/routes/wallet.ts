import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Transaction } from "../models/Transaction.js";
import { Wallet } from "../models/Wallet.js";
import { creditWallet, debitWallet, ensureWallet } from "../services/walletEngine.js";

export const walletRouter = Router();
walletRouter.use(requireAuth);

walletRouter.get("/", async (req, res) => res.json(await ensureWallet(req.user!.id)));
walletRouter.get("/transactions", async (req, res) => res.json(await Transaction.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(100)));
walletRouter.post("/deposit", validateBody(z.object({ amount: z.number().positive().max(1_000_000) })), async (req, res, next) => {
  try { res.json(await creditWallet(req.user!.id, req.body.amount, "DEPOSIT")); } catch (err) { next(err); }
});
walletRouter.post("/withdraw", validateBody(z.object({ amount: z.number().positive().max(1_000_000) })), async (req, res, next) => {
  try { res.json(await debitWallet(req.user!.id, req.body.amount, "WITHDRAW")); } catch (err) { next(err); }
});
walletRouter.get("/pnl", async (req, res) => res.json(await Wallet.findOne({ userId: req.user!.id }).select("pnl balance exposure available")));
