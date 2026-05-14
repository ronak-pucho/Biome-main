import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ridesService } from "../services/ridesService";

const router = Router();

router.post("/fare-estimate", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      pickup: z.object({ lat: z.number(), lng: z.number() }),
      dropoff: z.object({ lat: z.number(), lng: z.number() }),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const out = await ridesService.getFareEstimate(parsed.data);
  res.json(out);
});

router.get("/available", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
    })
    .safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
    return;
  }

  const out = await ridesService.getAvailable({ center: { lat: parsed.data.lat, lng: parsed.data.lng } });
  res.json(out);
});

router.post("/book", async (req: Request, res: Response) => {
  const parsed = z.object({ quoteId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const out = await ridesService.book({ quoteId: parsed.data.quoteId });
  res.json(out);
});

export default router;

