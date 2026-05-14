import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authOptional, authRequired } from "../middleware/auth";
import { userRepo } from "../repositories";

const router = Router();

router.get("/profile", authOptional(), async (req: Request, res: Response) => {
  const userId = req.ctx?.userId;
  if (!userId) {
    res.json({
      id: null,
      name: "Guest",
      email: null,
      phone: null,
      tier: "Free",
      totalSavings: 0,
    });
    return;
  }
  const user = await userRepo.getById(userId);
  res.json({
    id: user?.id ?? userId,
    name: user?.name ?? "User",
    email: user?.email ?? null,
    phone: user?.phone ?? null,
    tier: "Free",
    totalSavings: 0,
  });
});

router.get("/rewards", authOptional(), async (_req: Request, res: Response) => {
  res.json({
    totalCashback: 0,
    availableCashback: 0,
    pendingCashback: 0,
    tier: "Free",
  });
});

router.put("/preferences", authRequired(), async (req: Request, res: Response) => {
  const parsed = z.record(z.string(), z.unknown()).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY" });
    return;
  }
  const user = await userRepo.getById(req.ctx!.userId!);
  res.json({ success: true, preferences: parsed.data, user });
});

router.get("/purchases", authRequired(), async (_req: Request, res: Response) => {
  res.json({ items: [] });
});

export default router;
