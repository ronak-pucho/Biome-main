import { Router, type Request, type Response } from "express";
import { AlternativesQuerySchema, CompareProductsSchema, ProductDetailsQuerySchema } from "../dto/products";
import { productService } from "../services/productService";
import { aiService } from "../services/aiService";

const router = Router();

router.get("/details", async (req: Request, res: Response) => {
  const parsed = ProductDetailsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
    return;
  }
  const item = await productService.getDetails(parsed.data.id, parsed.data.provider);
  res.json({ item });
});

router.post("/compare", async (req: Request, res: Response) => {
  const parsed = CompareProductsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const detailed = await Promise.all(
    parsed.data.items.map(async (i: { id: string; provider: string }) => (await productService.getDetails(i.id, i.provider)) || null)
  );
  const items = detailed.filter((x: unknown): x is NonNullable<(typeof detailed)[number]> => Boolean(x));
  const ai = await aiService.generateRecommendation("Compare selected items", items);
  res.json({ items, ai });
});

router.get("/alternatives", async (req: Request, res: Response) => {
  const parsed = AlternativesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
    return;
  }
  const items = await productService.getAlternatives(parsed.data.id, parsed.data.provider);
  res.json({ items });
});

export default router;
