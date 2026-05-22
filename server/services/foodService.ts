import { nanoid } from "nanoid";

export type FoodProvider = "Swiggy" | "Zomato" | "Blinkit";

export type LatLng = { lat: number; lng: number };

export type RestaurantResult = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviews: number;
  deliveryTimeMinutes: number;
  deliveryFee: number;
  provider: FoodProvider;
  location: LatLng;
  distanceKm: number;
  checkoutUrl: string;
  offer?: string;
};

export type FoodSearchResult = {
  query: string;
  center: LatLng;
  results: RestaurantResult[];
};

function getRapidApiKey() {
  return process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || "";
}

function getRapidApiProviderConfig(provider: string) {
  const key = provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const host = process.env[`RAPIDAPI_${key}_HOST`] || "";
  const url = process.env[`RAPIDAPI_${key}_SEARCH_URL`] || "";
  const menuUrl = process.env[`RAPIDAPI_${key}_MENU_URL`] || "";
  return { host, url, menuUrl };
}

async function fetchJsonWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers, signal: controller.signal });
    if (!r.ok) throw new Error(`HTTP_${r.status}`);
    return (await r.json()) as unknown;
  } finally {
    clearTimeout(t);
  }
}

function pickString(v: unknown, keys: string[]): string | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  for (const k of keys) {
    const val = o[k];
    if (typeof val === "string" && val.trim()) return val;
  }
  return undefined;
}

function pickNumber(v: unknown, keys: string[]): number | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  for (const k of keys) {
    const val = o[k];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim() && Number.isFinite(Number(val))) return Number(val);
  }
  return undefined;
}

function pickArray(v: unknown, keys: string[]): unknown[] | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  for (const k of keys) {
    const val = o[k];
    if (Array.isArray(val)) return val;
  }
  return undefined;
}

function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function jitterLocation(center: LatLng, km: number): LatLng {
  const dLat = (Math.random() - 0.5) * (km / 110);
  const dLng = (Math.random() - 0.5) * (km / 110);
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

async function rapidApiSearchRestaurants(input: {
  provider: FoodProvider;
  query: string;
  center: LatLng;
  radiusKm: number;
}): Promise<RestaurantResult[] | null> {
  const apiKey = getRapidApiKey();
  if (!apiKey) return null;
  const cfg = getRapidApiProviderConfig(input.provider);
  if (!cfg.host || !cfg.url) return null;

  const rawUrl = cfg.url.includes("{query}") ? cfg.url.replaceAll("{query}", encodeURIComponent(input.query)) : cfg.url;
  const u = new URL(rawUrl);
  if (!cfg.url.includes("{query}") && !u.searchParams.has("query") && !u.searchParams.has("q")) {
    u.searchParams.set("query", input.query);
  }
  if (!u.searchParams.has("lat")) u.searchParams.set("lat", String(input.center.lat));
  if (!u.searchParams.has("lng")) u.searchParams.set("lng", String(input.center.lng));
  if (!u.searchParams.has("radius_km") && !u.searchParams.has("radiusKm")) u.searchParams.set("radius_km", String(input.radiusKm));

  const json = await fetchJsonWithTimeout(u.toString(), { "x-rapidapi-key": apiKey, "x-rapidapi-host": cfg.host });

  const arr =
    (Array.isArray(json) ? json : undefined) ||
    pickArray(json, ["restaurants", "data", "items", "results", "result", "response"]);
  if (!arr) return [];

  const out: RestaurantResult[] = [];
  for (const x of arr) {
    const name = pickString(x, ["name", "restaurant_name", "title"]) || `${input.query} Kitchen`;
    const cuisinesVal = pickString(x, ["cuisine", "cuisines", "category"]) || "Food";
    const rating = clamp(pickNumber(x, ["rating", "stars", "avg_rating", "average_rating"]) ?? 4.2, 0, 5);
    const reviews = Math.max(0, Math.round(pickNumber(x, ["reviews", "reviewsCount", "review_count", "ratings_total"]) ?? 0));
    const eta = clamp(Math.round(pickNumber(x, ["delivery_time", "deliveryTimeMinutes", "deliveryTime", "eta_minutes", "eta"]) ?? 30), 5, 120);
    const fee = Math.max(0, Math.round(pickNumber(x, ["delivery_fee", "deliveryFee", "fee"]) ?? (input.provider === "Blinkit" ? 0 : 20)));
    const lat = pickNumber(x, ["lat", "latitude"]);
    const lng = pickNumber(x, ["lng", "longitude", "lon"]);
    const location =
      typeof lat === "number" && typeof lng === "number" ? { lat, lng } : jitterLocation(input.center, input.radiusKm);
    const dist = Number(distanceKm(input.center, location).toFixed(1));
    const checkoutUrl = pickString(x, ["checkout_url", "checkoutUrl", "url", "link"]) || "https://example.com/checkout";
    const offer = pickString(x, ["offer", "offerText", "promo", "promotion"]);

    const externalId =
      pickString(x, ["id", "restaurant_id", "restaurantId", "res_id", "store_id", "storeId"]) || nanoid(10);

    out.push({
      id: `fd_${input.provider.toLowerCase()}_${externalId}`,
      name,
      cuisine: cuisinesVal,
      rating: Number(rating.toFixed(1)),
      reviews,
      deliveryTimeMinutes: eta,
      deliveryFee: fee,
      provider: input.provider,
      location,
      distanceKm: dist,
      checkoutUrl,
      offer,
    });
  }

  return out.slice(0, 18);
}

export class FoodService {
  async search(input: {
    query: string;
    center: LatLng;
    radiusKm?: number;
    providers?: FoodProvider[];
  }): Promise<FoodSearchResult> {
    const radiusKm = clamp(input.radiusKm ?? 5, 1, 25);
    const providers: FoodProvider[] = input.providers?.length
      ? input.providers
      : ["Swiggy", "Zomato", "Blinkit"];

    const cuisines = ["North Indian", "South Indian", "Chinese", "Italian", "Hyderabadi", "Fast Food", "Desserts"];

    const results: RestaurantResult[] = [];
    for (const provider of providers) {
      try {
        const real = await rapidApiSearchRestaurants({ provider, query: input.query, center: input.center, radiusKm });
        if (real && real.length) {
          results.push(...real);
          continue;
        }
      } catch {
      }

      for (let i = 0; i < 6; i++) {
        const distanceKm = Number((Math.random() * radiusKm).toFixed(1));
        const deliveryTimeMinutes = clamp(Math.round(12 + distanceKm * 6 + Math.random() * 12), 10, 60);
        const rating = Number((4.1 + Math.random() * 0.8).toFixed(1));
        const deliveryFee = provider === "Blinkit" ? 0 : Math.round(Math.random() * 40);
        const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
        results.push({
          id: `fd_${provider.toLowerCase()}_${nanoid(10)}`,
          name: `${input.query} ${i === 0 ? "Spot" : "Kitchen"}`,
          cuisine,
          rating,
          reviews: Math.floor(200 + Math.random() * 4000),
          deliveryTimeMinutes,
          deliveryFee,
          provider,
          location: jitterLocation(input.center, radiusKm),
          distanceKm,
          checkoutUrl: "https://example.com/checkout",
          offer: Math.random() > 0.6 ? "₹100 off" : undefined,
        });
      }
    }

    results.sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes);

    return { query: input.query, center: input.center, results };
  }

  async getMenu(restaurantId: string) {
    const parts = restaurantId.split("_");
    const providerLower = parts.length >= 3 && parts[0] === "fd" ? parts[1] : null;
    const externalId = parts.length >= 3 && parts[0] === "fd" ? parts.slice(2).join("_") : null;

    const provider: FoodProvider | null =
      providerLower === "swiggy" ? "Swiggy" : providerLower === "zomato" ? "Zomato" : providerLower === "blinkit" ? "Blinkit" : null;

    if (provider && externalId) {
      const apiKey = getRapidApiKey();
      const cfg = getRapidApiProviderConfig(provider);
      if (apiKey && cfg.host && cfg.menuUrl) {
        try {
          const rawUrl = cfg.menuUrl
            .replaceAll("{restaurant_id}", encodeURIComponent(externalId))
            .replaceAll("{id}", encodeURIComponent(externalId));
          const u = new URL(rawUrl);
          if (!cfg.menuUrl.includes("{restaurant_id}") && !cfg.menuUrl.includes("{id}")) {
            if (!u.searchParams.has("restaurant_id") && !u.searchParams.has("id")) u.searchParams.set("restaurant_id", externalId);
          }
          const json = await fetchJsonWithTimeout(u.toString(), { "x-rapidapi-key": apiKey, "x-rapidapi-host": cfg.host });
          const arr =
            (Array.isArray(json) ? json : undefined) ||
            pickArray(json, ["menu", "items", "data", "results", "result", "response"]);
          if (arr) {
            const items = arr
              .map((x) => {
                const id = pickString(x, ["id", "item_id", "itemId"]) || `m_${nanoid(8)}`;
                const name = pickString(x, ["name", "title", "item_name", "itemName"]);
                const price = pickNumber(x, ["price", "amount", "final_price", "selling_price"]);
                if (!name || typeof price !== "number") return null;
                return { id: String(id), name, price: Math.round(price) };
              })
              .filter((x): x is { id: string; name: string; price: number } => Boolean(x))
              .slice(0, 50);

            if (items.length) return { restaurantId, items };
          }
        } catch {
        }
      }
    }

    return {
      restaurantId,
      items: [
        { id: `m_${nanoid(8)}`, name: "Biryani", price: 249 },
        { id: `m_${nanoid(8)}`, name: "Burger", price: 159 },
        { id: `m_${nanoid(8)}`, name: "Pizza", price: 399 },
      ],
    };
  }

  async getDeliveryOptions(input: { restaurantId: string; center: LatLng }) {
    return {
      restaurantId: input.restaurantId,
      options: [
        { type: "fastest", etaMinutes: 20, fee: 30 },
        { type: "balanced", etaMinutes: 28, fee: 15 },
        { type: "cheapest", etaMinutes: 40, fee: 0 },
      ],
    };
  }
}

export const foodService = new FoodService();
