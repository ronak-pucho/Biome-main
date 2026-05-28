import { Bell, Clock, Crosshair, Home, MapPin, Menu, Mic, RotateCcw, Star, ShoppingCart, Briefcase, House, Pizza, User, CarFront } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/Map';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [pickupText, setPickupText] = useState('');
  const [dropoffText, setDropoffText] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff'>('pickup');
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState<'bike' | 'auto' | 'cab' | 'premium'>('bike');
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

  const initialCenter = useMemo(() => ({ lat: 12.97998, lng: 77.57708 }), []);

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

  const clearRoute = () => {
    if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
    directionsRendererRef.current = null;
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

  const setPoint = async (which: 'pickup' | 'dropoff', point: { lat: number; lng: number }) => {
    if (which === 'pickup') setPickup(point);
    else setDropoff(point);
    updateMarker(which, point);
    mapRef.current?.panTo(point);

    try {
      const r = await ridesAPI.reverseGeocode(point.lat, point.lng);
      const label = typeof r?.display_name === 'string' ? r.display_name : `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
      if (which === 'pickup') setPickupText(label);
      else setDropoffText(label);
    } catch {
      if (which === 'pickup') setPickupText(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
      else setDropoffText(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
    }
  };

  const geocodeToPoint = async (q: string): Promise<{ lat: number; lng: number } | null> => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return null;
    const data = await ridesAPI.geocode(trimmed);
    const items = Array.isArray(data?.items) ? (data.items as any[]) : [];
    const first = items[0];
    const lat = first?.lat ? Number(first.lat) : NaN;
    const lng = first?.lon ? Number(first.lon) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
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

  useEffect(() => {
    if (!pickup || !dropoff) return;
    const t = window.setTimeout(async () => {
      try {
        await renderRoute(pickup, dropoff);
      } catch {
        return;
      }
    }, 100);
    return () => window.clearTimeout(t);
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

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
                <input className="app-searchbar-input" placeholder="Type briefly what you want" />
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

            <div className="mt-4">
              <div className="relative">
                <MapView
                  initialCenter={initialCenter}
                  initialZoom={14}
                  className="h-[360px] lg:h-[520px] rounded-3xl overflow-hidden border border-black/10"
                  onMapReady={(map) => {
                    mapRef.current = map;
                    map.addListener('click', async (e: google.maps.MapMouseEvent) => {
                      if (!selectMode || !e.latLng) return;
                      const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                      if (activeField === 'pickup') {
                        await setPoint('pickup', point);
                        setActiveField('dropoff');
                      } else {
                        await setPoint('dropoff', point);
                        setSelectMode(false);
                      }
                    });
                  }}
                />

                <div className="absolute left-4 right-4 top-4 rounded-[34px] bg-white/95 border border-black/5 shadow-[0_22px_60px_rgba(67,46,27,0.16)] p-4">
                  <div className="grid gap-3">
                    <button
                      type="button"
                      className={`rounded-2xl bg-slate-100/70 border border-slate-200 px-4 py-4 flex items-center gap-3 text-left ${activeField === 'pickup' ? 'ring-2 ring-orange-400/60' : ''}`}
                      onClick={() => setActiveField('pickup')}
                    >
                      <MapPin className="w-5 h-5 text-orange-600" />
                      <input
                        className="w-full bg-transparent outline-none font-semibold text-foreground placeholder:text-muted-foreground"
                        placeholder="Pickup"
                        value={pickupText}
                        onChange={(e) => setPickupText(e.target.value)}
                        onFocus={() => setActiveField('pickup')}
                        onKeyDown={async (e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          try {
                            const p = await geocodeToPoint(pickupText);
                            if (!p) throw new Error('NO_RESULTS');
                            await setPoint('pickup', p);
                          } catch {
                            toast.error('Could not find pickup.');
                          }
                        }}
                      />
                    </button>
                    <button
                      type="button"
                      className={`rounded-2xl bg-slate-100/70 border border-slate-200 px-4 py-4 flex items-center gap-3 text-left ${activeField === 'dropoff' ? 'ring-2 ring-orange-400/60' : ''}`}
                      onClick={() => setActiveField('dropoff')}
                    >
                      <MapPin className="w-5 h-5 text-red-500" />
                      <input
                        className="w-full bg-transparent outline-none font-semibold text-foreground placeholder:text-muted-foreground"
                        placeholder="Drop"
                        value={dropoffText}
                        onChange={(e) => setDropoffText(e.target.value)}
                        onFocus={() => setActiveField('dropoff')}
                        onKeyDown={async (e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          try {
                            const p = await geocodeToPoint(dropoffText);
                            if (!p) throw new Error('NO_RESULTS');
                            await setPoint('dropoff', p);
                          } catch {
                            toast.error('Could not find drop.');
                          }
                        }}
                      />
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-2xl bg-slate-100/70 border border-slate-200 px-3 py-3 font-bold text-sm text-foreground flex items-center justify-center gap-2"
                        onClick={() => {
                          const saved = window.localStorage.getItem('rides_home');
                          if (!saved) return;
                          try {
                            const parsed = JSON.parse(saved) as { lat: number; lng: number; label?: string };
                            void setPoint(activeField, { lat: parsed.lat, lng: parsed.lng });
                            if (parsed.label) {
                              if (activeField === 'pickup') setPickupText(parsed.label);
                              else setDropoffText(parsed.label);
                            }
                          } catch {
                            return;
                          }
                        }}
                      >
                        <Home className="w-4 h-4" /> HOME
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-2xl bg-slate-100/70 border border-slate-200 px-3 py-3 font-bold text-sm text-foreground flex items-center justify-center gap-2"
                        onClick={() => {
                          const saved = window.localStorage.getItem('rides_work');
                          if (!saved) return;
                          try {
                            const parsed = JSON.parse(saved) as { lat: number; lng: number; label?: string };
                            void setPoint(activeField, { lat: parsed.lat, lng: parsed.lng });
                            if (parsed.label) {
                              if (activeField === 'pickup') setPickupText(parsed.label);
                              else setDropoffText(parsed.label);
                            }
                          } catch {
                            return;
                          }
                        }}
                      >
                        <Briefcase className="w-4 h-4" /> WORK
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-2xl bg-slate-100/70 border border-slate-200 px-3 py-3 font-bold text-sm text-foreground flex items-center justify-center gap-2"
                        onClick={() => {
                          const saved = window.localStorage.getItem('rides_last');
                          if (!saved) return;
                          try {
                            const parsed = JSON.parse(saved) as { lat: number; lng: number; label?: string };
                            void setPoint(activeField, { lat: parsed.lat, lng: parsed.lng });
                            if (parsed.label) {
                              if (activeField === 'pickup') setPickupText(parsed.label);
                              else setDropoffText(parsed.label);
                            }
                          } catch {
                            return;
                          }
                        }}
                      >
                        <RotateCcw className="w-4 h-4" /> LAST
                      </button>
                    </div>

                    <div className="grid gap-3">
                      <Button
                        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold"
                        disabled={!pickup || !dropoff || isLoading}
                        onClick={async () => {
                          if (!pickup || !dropoff) return;
                          try {
                            await renderRoute(pickup, dropoff);
                          } catch {
                            return;
                          }
                          await runEstimate(pickup, dropoff);
                          window.localStorage.setItem('rides_last', JSON.stringify({ ...(dropoff ?? pickup), label: dropoffText || pickupText }));
                        }}
                      >
                        {isLoading ? 'Requesting…' : 'Request a Ride'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-full bg-black text-white hover:bg-black/90 font-extrabold"
                        type="button"
                        onClick={() => {
                          setSelectMode((v) => !v);
                          setActiveField('pickup');
                        }}
                      >
                        {selectMode ? 'Tap map: pickup then drop' : 'Select from the map'}
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-full"
                          type="button"
                          onClick={() => {
                            navigator.geolocation?.getCurrentPosition(
                              (pos) => {
                                const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                                void setPoint('pickup', next);
                                setActiveField('dropoff');
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
                          className="flex-1 rounded-full"
                          type="button"
                          onClick={() => {
                            setPickup(null);
                            setDropoff(null);
                            setPickupText('');
                            setDropoffText('');
                            setQuotes([]);
                            setSelectMode(false);
                            setActiveField('pickup');
                            if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
                            if (dropMarkerRef.current) dropMarkerRef.current.map = null;
                            clearRoute();
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm text-muted-foreground">Recommended for you</div>
              <div className="mt-3 flex items-center justify-between gap-3">
                {(['bike', 'auto', 'cab', 'premium'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`history-filter-pill ${activeType === t ? 'history-filter-pill-active' : ''}`}
                    onClick={() => setActiveType(t)}
                  >
                    {t === 'premium' ? 'SUV' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {!isLoading && pickup && dropoff && quotes.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">No quotes returned.</div>
              )}

              <div className="mt-4 space-y-3">
                {(quotes.filter((q) => q.type === activeType) as typeof quotes).map((ride) => (
                  <div key={ride.id} className="rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">{ride.provider}</div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" /> {ride.driverRating.toFixed(1)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {ride.etaMinutes} min away
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-extrabold text-foreground">₹{ride.fare.toLocaleString()}</div>
                        <Button
                          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white"
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
                          Select
                        </Button>
                      </div>
                    </div>
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
                <button className="app-bottom-nav-item app-bottom-nav-item-active" type="button" aria-label="Rides">
                  <span className="app-bottom-nav-bubble">
                    <CarFront size={22} strokeWidth={2.2} />
                  </span>
                </button>
                <button className="app-bottom-nav-item" type="button" onClick={() => setLocation('/food')} aria-label="Food">
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
