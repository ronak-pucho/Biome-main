import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authOptional } from "../middleware/auth";
import { SuggestionsQuerySchema, TrackClickSchema, SearchRequestSchema } from "../dto/search";
import { searchEngine } from "../services/searchEngine";
import { clickRepo, searchRepo } from "../repositories";

const router = Router();

router.post("/", authOptional(), async (req: Request, res: Response) => {
  const parsed = SearchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const result = await searchEngine.search({
    query: parsed.data.query,
    userId: req.ctx?.userId,
    domain: parsed.data.domain,
    filters: parsed.data.filters,
    locale: parsed.data.locale,
  });

  res.json(result);
});

router.post("/shopping", authOptional(), async (req: Request, res: Response) => {
  const parsed = SearchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const result = await searchEngine.search({
    query: parsed.data.query,
    userId: req.ctx?.userId,
    domain: "ecommerce",
    filters: parsed.data.filters,
    locale: parsed.data.locale,
  });
  res.json(result);
});

router.post("/food", authOptional(), async (req: Request, res: Response) => {
  const parsed = SearchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const result = await searchEngine.search({
    query: parsed.data.query,
    userId: req.ctx?.userId,
    domain: "food",
    filters: parsed.data.filters,
    locale: parsed.data.locale,
  });
  res.json(result);
});

router.post("/rides", authOptional(), async (req: Request, res: Response) => {
  const parsed = SearchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const result = await searchEngine.search({
    query: parsed.data.query,
    userId: req.ctx?.userId,
    domain: "rides",
    filters: parsed.data.filters,
    locale: parsed.data.locale,
  });
  res.json(result);
});

router.post("/travel", authOptional(), async (req: Request, res: Response) => {
  const parsed = SearchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const result = await searchEngine.search({
    query: parsed.data.query,
    userId: req.ctx?.userId,
    domain: "travel",
    filters: parsed.data.filters,
    locale: parsed.data.locale,
  });
  res.json(result);
});

router.post("/stays", authOptional(), async (req: Request, res: Response) => {
  const parsed = SearchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const result = await searchEngine.search({
    query: parsed.data.query,
    userId: req.ctx?.userId,
    domain: "hospitality",
    filters: parsed.data.filters,
    locale: parsed.data.locale,
  });
  res.json(result);
});

router.get("/suggestions", async (req: Request, res: Response) => {
  const parsed = SuggestionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
    return;
  }
  const suggestions = await searchEngine.suggestions({ q: parsed.data.q, domain: parsed.data.domain });
  res.json({ q: parsed.data.q, suggestions });
});

router.post("/track-click", authOptional(), async (req: Request, res: Response) => {
  const parsed = TrackClickSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  const created = await clickRepo.create({
    userId: req.ctx?.userId,
    searchId: parsed.data.searchId,
    itemName: parsed.data.itemName,
    itemUrl: parsed.data.itemUrl,
    provider: parsed.data.provider,
    price: parsed.data.price,
  });
  res.json({ success: true, click: created });
});

router.get("/history", authOptional(), async (req: Request, res: Response) => {
  const userId = req.ctx?.userId;
  if (!userId) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  const limit = z.coerce.number().int().min(1).max(100).optional().safeParse(req.query.limit);
  const items = await searchRepo.listByUser(userId, limit.success ? limit.data : 20);
  res.json({ items });
});

export default router;
