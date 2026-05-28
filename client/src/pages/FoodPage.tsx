import { Bell, Clock, Crosshair, House, MapPin, Menu, Mic, Pizza, ShoppingCart, Star, User, CarFront } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/Map';
import { useRef, useState } from 'react';
import { foodAPI, ordersAPI } from '@/services/api';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

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
            <div className="app-topbar">
              <button className="app-icon-circle" type="button" aria-label="Menu" onClick={() => setLocation('/home')}>
                <Menu size={22} strokeWidth={2.2} />
              </button>
              <div className="app-searchbar" role="search">
                <input
                  className="app-searchbar-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for restaurants or dishes"
                />
                <button className="app-icon-ghost" type="button" aria-label="Voice">
                  <Mic size={18} strokeWidth={2.4} />
                </button>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button className="app-icon-ghost" type="button" aria-label="Notifications" onClick={() => setLocation('/history')}>
                  <Bell size={20} strokeWidth={2.2} />
                </button>
                <button className="app-icon-ghost" type="button" aria-label="Cart" onClick={() => setLocation('/history')}>
                  <ShoppingCart size={20} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(query);
              }}
            >
              <div className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Deliver to</span>
                    <span className="font-semibold text-foreground">MG Road</span>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    type="button"
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
                <div className="mt-3 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm">
                  <span className="font-bold text-orange-700">50% OFF</span> <span className="text-muted-foreground">up to ₹100</span>
                  <div className="text-xs text-muted-foreground mt-1">Use code: FOOD50</div>
                </div>
              </div>
            </form>

            <div className="mt-5 text-lg font-bold text-foreground">Popular Near You</div>

            <div className="mt-4">
              <MapView
                initialCenter={center}
                initialZoom={14}
                className="h-[220px] lg:h-[520px] rounded-2xl overflow-hidden border border-orange-100"
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
                    <Button
                      className="mt-4 w-full"
                      onClick={async () => {
                        try {
                          const raw = window.prompt('Enter order amount in INR (optional):')?.trim();
                          const amt = raw ? Number(raw) : null;
                          if (amt && Number.isFinite(amt) && amt > 0) {
                            await ordersAPI.createOrder({
                              domain: 'food',
                              provider: restaurant.provider,
                              title: `${restaurant.name}`,
                              itemUrl: restaurant.checkoutUrl,
                              amount: { currency: 'INR', amount: Math.max(1, Math.round(amt)) },
                              metadata: {
                                restaurantId: restaurant.id,
                                cuisine: restaurant.cuisine,
                                rating: restaurant.rating,
                                deliveryTimeMinutes: restaurant.deliveryTimeMinutes,
                                deliveryFee: restaurant.deliveryFee,
                                offer: restaurant.offer,
                                center,
                              },
                            });
                            toast.success('Food order saved.');
                          }
                        } catch {
                          toast.message('Checkout link opened.', { description: 'Log in to save orders.' });
                        } finally {
                          window.open(restaurant.checkoutUrl, '_blank');
                        }
                      }}
                    >
                      Order
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <nav className="app-bottom-nav" aria-label="Bottom navigation">
              <div className="app-bottom-nav-inner">
                <button className="app-bottom-nav-item" type="button" onClick={() => setLocation('/home')} aria-label="Home">
                  <span className="app-bottom-nav-bubble">
                    <House size={22} strokeWidth={2.2} />
                  </span>
                </button>
                <button className="app-bottom-nav-item" type="button" onClick={() => setLocation('/rides')} aria-label="Rides">
                  <span className="app-bottom-nav-bubble">
                    <CarFront size={22} strokeWidth={2.2} />
                  </span>
                </button>
                <button className="app-bottom-nav-item app-bottom-nav-item-active" type="button" aria-label="Food">
                  <span className="app-bottom-nav-bubble">
                    <Pizza size={22} strokeWidth={2.2} />
                  </span>
                </button>
                <button className="app-bottom-nav-item" type="button" onClick={() => setLocation('/profile')} aria-label="Profile">
                  <span className="app-bottom-nav-bubble">
                    <User size={22} strokeWidth={2.2} />
                  </span>
                </button>
              </div>
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
}
