import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authOptional } from "../middleware/auth";
import { priceService } from "../services/priceService";

const router = Router();

router.post("/price-alerts", authOptional(), async (req: Request, res: Response) => {
  const parsed = z
    .object({
      itemId: z.string().trim().min(1),
      itemName: z.string().trim().min(1),
      platform: z.string().trim().min(1),
      currentPrice: z.number().nonnegative(),
      targetPrice: z.number().nonnegative(),
      domain: z.string().trim().min(1),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const alert = await priceService.createPriceAlert({
    ...parsed.data,
    userId: req.ctx?.userId ?? "anon",
    isActive: true,
  });
  res.json(alert);
});

router.get("/price-alerts", authOptional(), async (_req: Request, res: Response) => {
  const userId = _req.ctx?.userId ?? "anon";
  const alerts = await priceService.listActiveAlerts(userId);
  res.json(alerts);
});

router.delete("/price-alerts/:alertId", authOptional(), async (_req: Request, res: Response) => {
  const userId = _req.ctx?.userId ?? "anon";
  const ok = await priceService.deactivateAlert(_req.params.alertId, userId);
  res.json({ success: ok });
});

router.get("/price-history", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      itemId: z.string().trim().min(1),
      platform: z.string().trim().min(1),
      days: z.coerce.number().int().min(1).max(365).default(30),
    })
    .safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
    return;
  }

  const prices = await priceService.getPriceHistory(parsed.data.itemId, parsed.data.platform, parsed.data.days);
  res.json({ itemId: parsed.data.itemId, platform: parsed.data.platform, prices });
});

export default router;
