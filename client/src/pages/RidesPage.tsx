import { Clock, Star, MapPin, Crosshair, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/Map';
import { useMemo, useRef, useState } from 'react';
import { ordersAPI, ridesAPI } from '@/services/api';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function RidesPage() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const dropMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quotes, setQuotes] = useState<
    Array<{
      id: string;
      provider: 'Uber' | 'Ola' | 'Rapido' | 'ONDC';
      type: 'bike' | 'auto' | 'cab' | 'premium';
      fare: number;
      etaMinutes: number;
      driverRating: number;
      distanceKm: number;
      surgeMultiplier?: number;
      deeplinkUrl: string;
    }>
  >([]);

  const initialCenter = useMemo(() => ({ lat: 28.6139, lng: 77.209 }), []);

  const renderRoute = async (p: { lat: number; lng: number }, d: { lat: number; lng: number }) => {
    if (!mapRef.current || !window.google?.maps) return;
    const directionsService = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({ map: mapRef.current, suppressMarkers: true });
    }
    const res = await directionsService.route({
      origin: p,
      destination: d,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    directionsRendererRef.current.setDirections(res);
  };

  const updateMarker = (
    which: 'pickup' | 'dropoff',
    point: { lat: number; lng: number }
  ) => {
    if (!mapRef.current || !window.google?.maps?.marker?.AdvancedMarkerElement) return;
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: point,
      title: which === 'pickup' ? 'Pickup' : 'Dropoff',
    });
    if (which === 'pickup') {
      if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
      pickupMarkerRef.current = marker;
    } else {
      if (dropMarkerRef.current) dropMarkerRef.current.map = null;
      dropMarkerRef.current = marker;
    }
  };

  const runEstimate = async (p: { lat: number; lng: number }, d: { lat: number; lng: number }) => {
    setIsLoading(true);
    try {
      const resp = await ridesAPI.getFareEstimate(p, d);
      setQuotes(resp.quotes || []);
    } catch {
      setQuotes([]);
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
              <h2 className="simple-topbar-title">Rides</h2>
              <div className="simple-topbar-space" />
            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-white/90 p-4 text-sm text-muted-foreground">
              Tap map once for pickup, second time for drop. Tap again to reset.
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="gap-2 flex-1"
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    (pos) => {
                      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                      setPickup(next);
                      updateMarker('pickup', next);
                      mapRef.current?.setCenter(next);
                    },
                    () => {
                      return;
                    }
                  );
                }}
              >
                <Crosshair className="w-4 h-4" />
                Pickup = me
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPickup(null);
                  setDropoff(null);
                  setQuotes([]);
                  if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
                  if (dropMarkerRef.current) dropMarkerRef.current.map = null;
                  if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
                  directionsRendererRef.current = null;
                }}
              >
                Reset
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-white/90 p-4 text-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Pickup: {pickup ? `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}` : 'not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Navigation className="w-4 h-4" />
                <span>Drop: {dropoff ? `${dropoff.lat.toFixed(5)}, ${dropoff.lng.toFixed(5)}` : 'not set'}</span>
              </div>
            </div>

            <div className="mt-4">
              <MapView
                initialCenter={initialCenter}
                initialZoom={13}
                className="h-[320px] lg:h-[520px] rounded-2xl overflow-hidden border border-amber-100"
                onMapReady={(map) => {
                  mapRef.current = map;
                  map.addListener('click', async (e: google.maps.MapMouseEvent) => {
                    if (!e.latLng) return;
                    const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };

                    if (!pickup || (pickup && dropoff)) {
                      setPickup(point);
                      setDropoff(null);
                      setQuotes([]);
                      updateMarker('pickup', point);
                      if (dropMarkerRef.current) dropMarkerRef.current.map = null;
                      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
                      directionsRendererRef.current = null;
                      return;
                    }

                    setDropoff(point);
                    updateMarker('dropoff', point);
                    await renderRoute(pickup, point);
                    await runEstimate(pickup, point);
                  });
                }}
              />
            </div>

            <div className="mt-6">
              <div className="text-xl font-bold text-foreground">Fare comparison</div>
              <div className="text-sm text-muted-foreground mt-1">{isLoading ? 'Fetching quotes…' : 'Sorted by lowest fare.'}</div>

              {!isLoading && pickup && dropoff && quotes.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">No quotes returned.</div>
              )}

              <div className="mt-4 space-y-3">
                {quotes.map((ride) => (
                  <div key={ride.id} className="rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">{ride.type.toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {ride.provider} • {ride.distanceKm} km
                          {ride.surgeMultiplier ? ` • Surge x${ride.surgeMultiplier}` : ''}
                        </div>
                      </div>
                      <div className="flex-none text-lg font-extrabold text-foreground">₹{ride.fare.toLocaleString()}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {ride.etaMinutes}m
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-4 h-4" /> {ride.driverRating.toFixed(1)}
                      </span>
                    </div>

                    <Button
                      className="mt-4 w-full"
                      onClick={async () => {
                        try {
                          await ordersAPI.createOrder({
                            domain: 'rides',
                            provider: ride.provider,
                            title: `${ride.provider} ${ride.type.toUpperCase()} ride`,
                            itemUrl: ride.deeplinkUrl,
                            amount: { currency: 'INR', amount: Math.max(1, Math.round(ride.fare)) },
                            metadata: {
                              quoteId: ride.id,
                              pickup,
                              dropoff,
                              etaMinutes: ride.etaMinutes,
                              distanceKm: ride.distanceKm,
                              surgeMultiplier: ride.surgeMultiplier,
                            },
                          });
                          toast.success('Ride saved to orders.');
                        } catch {
                          toast.message('Booking link opened.', { description: 'Log in to save orders.' });
                        } finally {
                          window.open(ride.deeplinkUrl, '_blank');
                        }
                      }}
                    >
                      Book
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
