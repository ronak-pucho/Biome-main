import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth";
import { orderRepo } from "../repositories";

const router = Router();

const MoneySchema = z.object({
  currency: z.literal("INR"),
  amount: z.number().int().min(1),
});

const CreateOrderSchema = z.object({
  domain: z.enum(["ecommerce", "food", "rides", "travel", "hospitality"]),
  provider: z.string().trim().min(1),
  title: z.string().trim().min(1).max(140),
  itemUrl: z.string().url(),
  amount: MoneySchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  paymentIntentId: z.string().trim().min(1).optional(),
});

router.post("/", authRequired(), async (req: Request, res: Response) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const created = await orderRepo.create({
    userId: req.ctx!.userId!,
    domain: parsed.data.domain,
    provider: parsed.data.provider,
    title: parsed.data.title,
    itemUrl: parsed.data.itemUrl,
    amount: parsed.data.amount,
    status: parsed.data.paymentIntentId ? "PAYMENT_PENDING" : "CREATED",
    paymentIntentId: parsed.data.paymentIntentId,
    metadata: parsed.data.metadata,
  });

  res.json({ order: created });
});

router.get("/", authRequired(), async (req: Request, res: Response) => {
  const limit = z.coerce.number().int().min(1).max(100).optional().safeParse(req.query.limit);
  const items = await orderRepo.listByUser(req.ctx!.userId!, limit.success ? limit.data : 50);
  res.json({ items });
});

router.get("/:orderId", authRequired(), async (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const order = await orderRepo.getById(orderId);
  if (!order || order.userId !== req.ctx!.userId!) {
    res.status(404).json({ error: "ORDER_NOT_FOUND" });
    return;
  }
  res.json({ order });
});

router.post("/:orderId/cancel", authRequired(), async (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const order = await orderRepo.getById(orderId);
  if (!order || order.userId !== req.ctx!.userId!) {
    res.status(404).json({ error: "ORDER_NOT_FOUND" });
    return;
  }
  if (order.status === "CONFIRMED") {
    res.status(409).json({ error: "ORDER_ALREADY_CONFIRMED" });
    return;
  }
  if (order.status === "CANCELLED") {
    res.json({ order });
    return;
  }
  const updated = await orderRepo.updateById(orderId, { status: "CANCELLED" });
  res.json({ order: updated ?? order });
});

export default router;
