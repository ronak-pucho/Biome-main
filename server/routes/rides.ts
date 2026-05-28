import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ridesService } from "../services/ridesService";

const router = Router();

async function fetchJsonWithTimeout(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "biome-server/1.0" },
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(`HTTP_${r.status}`);
    return (await r.json()) as unknown;
  } finally {
    clearTimeout(t);
  }
}

async function fetchBufferWithTimeout(url: string, timeoutMs = 8000): Promise<{ buf: Buffer; contentType?: string; cacheControl?: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "biome-server/1.0" },
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(`HTTP_${r.status}`);
    const contentType = r.headers.get("content-type") ?? undefined;
    const cacheControl = r.headers.get("cache-control") ?? undefined;
    const arrayBuffer = await r.arrayBuffer();
    return { buf: Buffer.from(arrayBuffer), contentType, cacheControl };
  } finally {
    clearTimeout(t);
  }
}

router.get("/tiles/:z/:x/:y.png", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      z: z.coerce.number().int().min(0).max(20),
      x: z.coerce.number().int().min(0),
      y: z.coerce.number().int().min(0),
    })
    .safeParse(req.params);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_PARAMS", details: parsed.error.flatten() });
    return;
  }

  const { z: zoom, x, y } = parsed.data;
  const primary = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  const fallback = `https://a.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;

  try {
    const { buf, contentType, cacheControl } = await fetchBufferWithTimeout(primary, 8000);
    res.setHeader("content-type", contentType || "image/png");
    res.setHeader("cache-control", cacheControl || "public, max-age=86400");
    res.end(buf);
  } catch {
    try {
      const { buf, contentType, cacheControl } = await fetchBufferWithTimeout(fallback, 8000);
      res.setHeader("content-type", contentType || "image/png");
      res.setHeader("cache-control", cacheControl || "public, max-age=86400");
      res.end(buf);
    } catch {
      res.status(502).json({ error: "TILE_FETCH_FAILED" });
    }
  }
});

router.get("/geocode", async (req: Request, res: Response) => {
  const parsed = z.object({ q: z.string().trim().min(2).max(200) }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
    return;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", parsed.data.q);
  url.searchParams.set("limit", "5");

  try {
    const json = await fetchJsonWithTimeout(url.toString(), 8000);
    res.json({ items: json });
  } catch {
    res.status(502).json({ error: "GEOCODE_FAILED" });
  }
});

router.get("/reverse", async (req: Request, res: Response) => {
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

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(parsed.data.lat));
  url.searchParams.set("lon", String(parsed.data.lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  try {
    const json = await fetchJsonWithTimeout(url.toString(), 8000);
    res.json(json);
  } catch {
    res.status(502).json({ error: "REVERSE_GEOCODE_FAILED" });
  }
});

router.get("/route", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      pickupLat: z.coerce.number(),
      pickupLng: z.coerce.number(),
      dropoffLat: z.coerce.number(),
      dropoffLng: z.coerce.number(),
    })
    .safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
    return;
  }

  const base = "https://router.project-osrm.org/route/v1/driving";
  const path = `${parsed.data.pickupLng},${parsed.data.pickupLat};${parsed.data.dropoffLng},${parsed.data.dropoffLat}`;
  const url = new URL(`${base}/${path}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  try {
    const json = (await fetchJsonWithTimeout(url.toString(), 8000)) as any;
    const route = json?.routes?.[0];
    const geometry = route?.geometry;
    const distanceMeters = typeof route?.distance === "number" ? route.distance : null;
    const durationSeconds = typeof route?.duration === "number" ? route.duration : null;

    if (!geometry) {
      res.status(502).json({ error: "ROUTE_BAD_RESPONSE" });
      return;
    }

    res.json({ geometry, distanceMeters, durationSeconds });
  } catch {
    res.status(502).json({ error: "ROUTE_FAILED" });
  }
});

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
