import { Router, type Request, type Response } from "express";
import { z } from "zod";

const router = Router();

router.post("/scrape/amazon", async (req: Request, res: Response) => {
  const parsed = z.object({ url: z.string().url() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }
  res.json({
    status: "NOT_IMPLEMENTED",
    url: parsed.data.url,
    message: "Scraper is a placeholder. Configure a provider API or scraper runtime later.",
  });
});

export default router;

