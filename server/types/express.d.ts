import "express";

declare global {
  namespace Express {
    interface Request {
      ctx?: {
        requestId: string;
        userId?: string;
      };
    }
  }
}

export {};
