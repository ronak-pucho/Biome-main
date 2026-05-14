import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";

export function attachRequestContext() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header("x-request-id") || nanoid();
    req.ctx = { requestId };
    res.setHeader("x-request-id", requestId);
    next();
  };
}
