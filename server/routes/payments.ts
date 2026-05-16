import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authOptional } from "../middleware/auth";

const router = Router();

function paymentsBaseUrl() {
  return process.env.PAYMENTS_SERVICE_URL || "http://localhost:4010";
}

router.get("/health", async (_req: Request, res: Response) => {
  const r = await fetch(`${paymentsBaseUrl()}/health`);
  const data = await r.json().catch(() => ({}));
  res.status(r.status).json(data);
});

router.post("/intents", authOptional(), async (req: Request, res: Response) => {
  const parsed = z
    .object({
      money: z.object({ amount: z.number().positive(), currency: z.string().min(1).default("INR") }),
      customer: z.object({
        customerId: z.string().min(1),
        customerPhone: z.string().min(1),
        customerEmail: z.string().email().optional(),
        customerName: z.string().min(1).optional(),
      }),
      returnUrl: z.string().url().optional(),
      notifyUrl: z.string().url().optional(),
      orderId: z.string().min(3).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  const idempotencyKey = req.header("Idempotency-Key") || req.header("x-idempotency-key");
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  if (req.ctx?.userId) headers["x-user-id"] = req.ctx.userId;

  const r = await fetch(`${paymentsBaseUrl()}/v1/payment_intents`, {
    method: "POST",
    headers,
    body: JSON.stringify(parsed.data),
  });

  const text = await r.text();
  res.status(r.status);
  res.type(r.headers.get("content-type") || "application/json");
  res.send(text);
});

router.get("/intents/:intentId", authOptional(), async (req: Request, res: Response) => {
  const intentId = req.params.intentId;
  const r = await fetch(`${paymentsBaseUrl()}/v1/payment_intents/${encodeURIComponent(intentId)}`, {
    headers: req.ctx?.userId ? { "x-user-id": req.ctx.userId } : undefined,
  });
  const text = await r.text();
  res.status(r.status);
  res.type(r.headers.get("content-type") || "application/json");
  res.send(text);
});

router.post("/webhooks/cashfree", async (req: Request, res: Response) => {
  const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));

  const headers: Record<string, string> = {
    "content-type": req.header("content-type") || "application/json",
  };

  const passthrough = [
    "x-webhook-timestamp",
    "x-webhook-signature",
    "x-webhook-version",
    "x-webhook-attempt",
    "x-idempotency-key",
  ];

  for (const h of passthrough) {
    const v = req.header(h);
    if (v) headers[h] = v;
  }

  const r = await fetch(`${paymentsBaseUrl()}/v1/webhooks/cashfree`, {
    method: "POST",
    headers,
    body: rawBody as any,
  });

  const text = await r.text();
  res.status(r.status);
  res.type(r.headers.get("content-type") || "application/json");
  res.send(text);
});

export default router;
