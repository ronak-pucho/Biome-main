import { Bell, Bus, Calendar, MapPinned, Menu, Mic, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';

export default function TravelPage() {
  const [, setLocation] = useLocation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const displayDate = useMemo(() => {
    const d = new Date();
    if (day === 'tomorrow') d.setDate(d.getDate() + 1);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
  }, [day]);

  return (
    <div className="mobile-stage">
      <div className="fit-shell">
        <div className="phone-screen">
          <section className="screen" style={{ paddingTop: 16, paddingBottom: 18 }}>
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

            <div className="mt-6 rounded-[34px] bg-white/95 border border-black/5 shadow-[0_22px_60px_rgba(67,46,27,0.16)] p-5">
              <div className="text-2xl font-extrabold text-foreground">Bus Tickets</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-100/70 border border-slate-200 px-4 py-4 flex items-center gap-3">
                  <Bus className="w-5 h-5 text-muted-foreground" />
                  <input className="w-full bg-transparent outline-none font-semibold text-foreground placeholder:text-muted-foreground" placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="rounded-2xl bg-slate-100/70 border border-slate-200 px-4 py-4 flex items-center gap-3">
                  <Bus className="w-5 h-5 text-muted-foreground" />
                  <input className="w-full bg-transparent outline-none font-semibold text-foreground placeholder:text-muted-foreground" placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <div className="font-semibold text-foreground">{displayDate}</div>
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-2xl font-bold border ${day === 'today' ? 'bg-rose-100 border-rose-200 text-foreground' : 'bg-white border-slate-200 text-muted-foreground'}`}
                    onClick={() => setDay('today')}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-2xl font-bold border ${day === 'tomorrow' ? 'bg-rose-100 border-rose-200 text-foreground' : 'bg-white border-slate-200 text-muted-foreground'}`}
                    onClick={() => setDay('tomorrow')}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <Button className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white font-extrabold">
                  Search buses
                </Button>
                <Button className="w-full rounded-full bg-black hover:bg-black/90 text-white font-extrabold gap-2">
                  <MapPinned className="w-4 h-4" />
                  Select from the map
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
