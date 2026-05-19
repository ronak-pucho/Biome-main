import { Clock, MapPin, Star, Crosshair, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/Map';
import { useMemo, useRef, useState } from 'react';
import { foodAPI } from '@/services/api';
import { useLocation } from 'wouter';

export default function FoodPage() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.209 });
  const [providers, setProviders] = useState<Array<'Swiggy' | 'Zomato' | 'Blinkit'>>([
    'Swiggy',
    'Zomato',
    'Blinkit',
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<
    Array<{
      id: string;
      name: string;
      cuisine: string;
      rating: number;
      reviews: number;
      deliveryTimeMinutes: number;
      deliveryFee: number;
      provider: 'Swiggy' | 'Zomato' | 'Blinkit';
      distanceKm: number;
      checkoutUrl: string;
      offer?: string;
    }>
  >([]);

  const providerChips = useMemo(
    () =>
      [
        { key: 'Swiggy', label: 'Swiggy' },
        { key: 'Zomato', label: 'Zomato' },
        { key: 'Blinkit', label: 'Blinkit' },
      ] as const,
    []
  );

  const updateMarker = (next: { lat: number; lng: number }) => {
    if (!mapRef.current || !window.google?.maps?.marker?.AdvancedMarkerElement) return;
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }
    markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: next,
      title: 'Delivery location',
    });
  };

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setIsLoading(true);
    try {
      const resp = await foodAPI.searchRestaurants(trimmed, center, providers, 5);
      setResults(resp.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-stage">
      <div className="fit-shell">
        <div className="phone-screen">
          <section className="screen" style={{ paddingTop: 16, paddingBottom: 28 }}>
            <div className="simple-topbar">
              <button className="simple-topbar-button" type="button" onClick={() => setLocation('/home')} aria-label="Back">
                ←
              </button>
              <h2 className="simple-topbar-title">Food</h2>
              <div className="simple-topbar-space" />
            </div>

            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(query);
              }}
            >
              <div className="home-prompt-card" style={{ gridTemplateColumns: '1fr auto' }}>
                <input
                  className="home-prompt-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search restaurants or dishes"
                />
                <button className="home-prompt-send" disabled={!query.trim() || isLoading} type="submit">
                  →
                </button>
              </div>
            </form>

            <div className="mt-4">
              <div className="text-sm font-semibold text-foreground">Apps</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {providerChips.map((p) => {
                  const active = providers.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setProviders((prev) => (prev.includes(p.key) ? prev.filter((x) => x !== p.key) : [...prev, p.key]));
                      }}
                      className={`px-3 py-2 rounded-full border text-sm font-semibold transition-colors ${
                        active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-foreground border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-white/90 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.geolocation?.getCurrentPosition(
                      (pos) => {
                        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setCenter(next);
                        mapRef.current?.setCenter(next);
                        updateMarker(next);
                      },
                      () => {
                        return;
                      }
                    );
                  }}
                >
                  <Crosshair className="w-4 h-4" />
                  Use my location
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>Providers: {providers.join(', ') || 'None selected'}</span>
              </div>
            </div>

            <div className="mt-4">
              <MapView
                initialCenter={center}
                initialZoom={14}
                className="h-[320px] lg:h-[520px] rounded-2xl overflow-hidden border border-orange-100"
                onMapReady={(map) => {
                  mapRef.current = map;
                  updateMarker(center);
                  map.addListener('click', (e: google.maps.MapMouseEvent) => {
                    if (!e.latLng) return;
                    const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                    setCenter(next);
                    updateMarker(next);
                  });
                }}
              />
            </div>

            <div className="mt-6">
              <div className="text-xl font-bold text-foreground">{query ? `Results for "${query}"` : 'Results'}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {isLoading ? 'Searching across apps…' : 'Compare delivery time and offers by provider.'}
              </div>

              {!isLoading && query && results.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">No results found. Try a different search.</div>
              )}

              <div className="mt-4 space-y-3">
                {results.map((restaurant) => (
                  <div key={restaurant.id} className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">{restaurant.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {restaurant.cuisine} • {restaurant.provider} • {restaurant.distanceKm} km
                        </div>
                      </div>
                      {restaurant.offer ? (
                        <div className="flex-none rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                          {restaurant.offer}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                        <span>
                          {restaurant.rating} ({restaurant.reviews})
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {restaurant.deliveryTimeMinutes}m
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {restaurant.deliveryFee === 0 ? 'Free' : `₹${restaurant.deliveryFee}`}
                        </span>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => window.open(restaurant.checkoutUrl, '_blank')}>
                      Order
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
