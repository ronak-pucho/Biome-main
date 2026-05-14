import { motion } from 'framer-motion';
import { Clock, MapPin, Star, Crosshair, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AISearchInput from '@/components/ai/AISearchInput';
import { MapView } from '@/components/Map';
import { useMemo, useRef, useState } from 'react';
import { foodAPI } from '@/services/api';

export default function FoodPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-orange-400 to-red-400 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.3),transparent)]" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🍔 Order Food, Save More
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Find the best restaurants and food deals from Swiggy, Zomato, and ONDC
            </p>
            <div className="max-w-xl">
              <AISearchInput
                placeholder="Search for food or restaurants..."
                onSearch={runSearch}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10 bg-white border-b border-orange-100">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3">
              <h2 className="text-2xl font-bold mb-2">Pick your area</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Click on the map to set your delivery location, then search across apps.
              </p>

              <div className="flex gap-2 mb-4">
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

              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Apps</p>
                <div className="flex flex-wrap gap-2">
                  {providerChips.map((p) => {
                    const active = providers.includes(p.key);
                    return (
                      <button
                        key={p.key}
                        onClick={() => {
                          setProviders((prev) =>
                            prev.includes(p.key)
                              ? prev.filter((x) => x !== p.key)
                              : [...prev, p.key]
                          );
                        }}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          active
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-foreground border-orange-200 hover:bg-orange-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <Store className="w-4 h-4" />
                  <span>Providers: {providers.join(', ') || 'None selected'}</span>
                </div>
              </div>
            </div>

            <div className="lg:w-2/3">
              <MapView
                initialCenter={center}
                initialZoom={14}
                className="h-[420px] rounded-2xl overflow-hidden border border-orange-100"
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
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Real-time Offers',
                description: 'Get the latest discounts and promos',
              },
              {
                icon: '🚚',
                title: 'Fast Delivery',
                description: 'Compare delivery times across platforms',
              },
              {
                icon: '⭐',
                title: 'Quality Reviews',
                description: 'Read summarized reviews from real customers',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-orange-50 border border-orange-100 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold mb-2">
            {query ? `Results for "${query}"` : 'Popular Restaurants'}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {isLoading ? 'Searching across apps…' : 'Compare delivery time and offers by provider.'}
          </p>

          {!isLoading && query && results.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No results found. Try a different search.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(results.length ? results : []).map((restaurant, idx) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-orange-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 text-center relative">
                  <div className="text-6xl mb-4">🍽️</div>
                  {restaurant.offer && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {restaurant.offer}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {restaurant.cuisine} • {restaurant.provider} • {restaurant.distanceKm} km
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-orange-400 text-orange-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {restaurant.rating} ({restaurant.reviews})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {restaurant.deliveryTimeMinutes} min
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {restaurant.deliveryFee === 0 ? 'Free' : `₹${restaurant.deliveryFee}`}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    onClick={() => window.open(restaurant.checkoutUrl, '_blank')}
                  >
                    Order Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
