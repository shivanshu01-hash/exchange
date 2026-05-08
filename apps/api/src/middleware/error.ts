import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: Error & { status?: number; code?: number }, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || (err.code === 11000 ? 409 : 500);
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
}
