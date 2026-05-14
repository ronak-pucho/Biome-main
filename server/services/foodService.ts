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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function jitterLocation(center: LatLng, km: number): LatLng {
  const dLat = (Math.random() - 0.5) * (km / 110);
  const dLng = (Math.random() - 0.5) * (km / 110);
  return { lat: center.lat + dLat, lng: center.lng + dLng };
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
      for (let i = 0; i < 6; i++) {
        const distanceKm = Number((Math.random() * radiusKm).toFixed(1));
        const deliveryTimeMinutes = clamp(
          Math.round(12 + distanceKm * 6 + Math.random() * 12),
          10,
          60
        );
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

