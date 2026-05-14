import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { foodService } from "../services/foodService";

const router = Router();

router.post("/search", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      query: z.string().trim().min(1),
      center: z.object({ lat: z.number(), lng: z.number() }),
      radiusKm: z.number().min(1).max(25).optional(),
      providers: z.array(z.enum(["Swiggy", "Zomato", "Blinkit"])).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const out = await foodService.search(parsed.data);
  res.json(out);
});

router.get("/restaurants/:restaurantId/menu", async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;
  if (!restaurantId) {
    res.status(400).json({ error: "MISSING_RESTAURANT_ID" });
    return;
  }
  const out = await foodService.getMenu(restaurantId);
  res.json(out);
});

router.post("/delivery-options", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      restaurantId: z.string().trim().min(1),
      center: z.object({ lat: z.number(), lng: z.number() }),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const out = await foodService.getDeliveryOptions(parsed.data);
  res.json(out);
});

export default router;

