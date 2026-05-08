import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { ensureWallet } from "../services/walletEngine.js";
import { signToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

export const authRouter = Router();

const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

authRouter.post("/register", validateBody(credentials), async (req, res, next) => {
  try {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ email: req.body.email, passwordHash });
    await ensureWallet(String(user._id));
    res.status(201).json({ token: signToken({ id: String(user._id), role: user.role as "USER" }), user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

authRouter.post("/login", validateBody(credentials), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email, status: "ACTIVE" });
    if (!user || !await bcrypt.compare(req.body.password, user.passwordHash)) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ token: signToken({ id: String(user._id), role: user.role as "USER" | "ADMIN" }), user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});
