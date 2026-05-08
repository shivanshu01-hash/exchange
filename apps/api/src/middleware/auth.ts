import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthUser { id: string; role: "USER" | "ADMIN" }

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "8h", issuer: "odds-exchange" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing bearer token" });
  try {
    req.user = jwt.verify(token, env.JWT_SECRET, { issuer: "odds-exchange" }) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
  next();
}
