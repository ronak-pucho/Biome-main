import type { DomainType, Money, SearchIntent, SearchResult } from "../entities";
import { aiService } from "./aiService";
import { TTLCache } from "./cache";
import { productService } from "./productService";
import { searchRepo } from "../repositories";

function inr(amount: number): Money {
  return { currency: "INR", amount: Math.round(amount) };
}

function extractBudget(query: string): Money | undefined {
  const match = query.match(/(?:under|below)\s*₹?\s*([\d,]+)/i) || query.match(/₹\s*([\d,]+)/);
  if (!match) return undefined;
  const raw = match[1].replace(/,/g, "");
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return inr(num);
}

function detectDomain(query: string): DomainType {
  const q = query.toLowerCase();
  if (q.match(/\b(biryani|pizza|restaurant|swiggy|zomato|food|order)\b/)) return "food";
  if (q.match(/\b(uber|ola|rapido|ride|cab|auto|bike|fare)\b/)) return "rides";
  if (q.match(/\b(flight|train|bus|irctc|redbus|ticket)\b/)) return "travel";
  if (q.match(/\b(hotel|oyo|booking|airbnb|stay|resort)\b/)) return "hospitality";
  return "ecommerce";
}

function extractFeatures(query: string) {
  const q = query.toLowerCase();
  const candidates = [
    "gaming",
    "rtx",
    "battery",
    "display",
    "camera",
    "fast",
    "premium",
    "cheap",
    "delivery",
  ];
  return candidates.filter((c) => q.includes(c));
}

function stableKey(input: unknown) {
  return JSON.stringify(input, Object.keys(input as any).sort());
}

const cache = new TTLCache<Omit<SearchResult, "searchId" | "generatedAt" | "cache">>(300_000);

export class SearchEngine {
  async search(input: {
    query: string;
    userId?: string;
    domain?: DomainType;
    filters?: Record<string, unknown>;
    locale?: string;
  }): Promise<SearchResult> {
    const domain = input.domain ?? detectDomain(input.query);
    const intent: SearchIntent = {
      domain,
      budget: extractBudget(input.query),
      features: extractFeatures(input.query),
      keywords: input.query.toLowerCase().split(/\s+/).slice(0, 12),
    };

    const cacheKey = `srch:${domain}:${stableKey({
      q: input.query.trim().toLowerCase(),
      f: input.filters ?? {},
      l: input.locale ?? "en-IN",
    })}`;

    const cached = cache.get(cacheKey);
    const cacheHit = Boolean(cached);

    const base = cached
      ? cached
      : await (async () => {
          const providerResults = await productService.searchAcrossProviders({
            query: input.query,
            domain,
            filters: input.filters,
          });
          const items = providerResults.flatMap((r) => r.items);
          const ai = await aiService.generateRecommendation(input.query, items);
          const payload = {
            query: input.query,
            intent,
            items,
            ai,
          } satisfies Omit<SearchResult, "searchId" | "generatedAt" | "cache">;
          cache.set(cacheKey, payload);
          return payload;
        })();

    const created = await searchRepo.create({
      userId: input.userId,
      query: input.query,
      domain,
      intent,
      resultsCount: base.items.length,
      topResult: base.ai.bestOverall,
      alternatives: base.items.slice(0, 5),
    });

    return {
      searchId: created.id,
      ...base,
      generatedAt: new Date().toISOString(),
      cache: { hit: cacheHit, key: cacheKey },
    };
  }

  async suggestions(input: { q: string; domain?: DomainType }) {
    const q = input.q.trim();
    if (!q) return [];
    const domain = input.domain ?? detectDomain(q);
    const presets =
      domain === "ecommerce"
        ? ["Gaming laptop under ₹70k", "Phone under ₹25k with best camera", "Wireless earbuds ANC"]
        : domain === "food"
          ? ["Biryani under ₹300", "Pizza delivery near me", "Healthy bowl under ₹250"]
          : domain === "rides"
            ? ["Cab to airport cheapest", "Auto ride in 10 minutes", "Bike taxi under ₹100"]
            : domain === "travel"
              ? ["Train tickets to Delhi", "Flights to Goa next week", "Bus to Pune tomorrow"]
              : ["Hotel in Goa beach view", "Stay near airport under ₹3k", "Resort with pool"];

    return presets.filter((p) => p.toLowerCase().includes(q.toLowerCase())).slice(0, 7);
  }
}

export const searchEngine = new SearchEngine();
