import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import EcommercePage from "./pages/EcommercePage";
import FoodPage from "./pages/FoodPage";
import RidesPage from "./pages/RidesPage";
import TravelPage from "./pages/TravelPage";
import HospitalityPage from "./pages/HospitalityPage";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import ContactPage from "./pages/ContactPage";
import { ArrowLeft, ArrowRight, CarFront, History, House, Pizza, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ordersAPI } from "@/services/api";
import { toast } from "sonner";

declare global {
  interface Window {
    Cashfree?: any;
  }
}

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [setLocation, to]);
  return null;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function WelcomeScreen() {
  return (
    <div className="mobile-stage">
      <div className="fit-shell">
        <div className="phone-screen">
          <section className="screen onboarding-screen">
            <div className="hero-logo" aria-hidden="true">
              <div className="brand-logo" style={{ fontSize: 84, lineHeight: 1 }}>
                ⚡
              </div>
            </div>
            <div className="hero-copy">
              <h1 className="hero-title">
                <span>Stop Searching</span>
                <span className="hero-title-accent">Start Deciding</span>
              </h1>
              <p className="hero-description">
                Algorithec is your AI decision engine that finds the single best option across food, rides and more all in one place.
              </p>
              <p className="hero-description hero-description-bottom">
                No switching apps. No endless comparisons. Just the smartest choice, instantly.
              </p>
            </div>
            <div className="hero-actions">
              <Link className="button primary-button" href="/login">
                <span>Get Started</span>
                <ArrowRight size={28} strokeWidth={2.2} />
              </Link>
              <Link className="button secondary-button" href="/login">
                Log In
              </Link>
              <Link className="button secondary-button" href="/home">
                Continue as guest
              </Link>
            </div>
            <p className="bottom-note">Engineered by Algorithec</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [location, setLocation] = useLocation();
  const isDesktop = useIsDesktop();
  const hide = location === "/" || location.startsWith("/login");

  if (!isDesktop || hide) return null;

  const activePage = location.startsWith("/history")
    ? "history"
    : location.startsWith("/food")
      ? "food"
      : location.startsWith("/rides")
        ? "rides"
        : "home";

  const RECENT = ["Book a ride to airport", "Order pizza near me", "Best phone under 30k", "Compare iPhone 15 prices"];

  return (
    <aside className={`home-sidebar ${collapsed ? "home-sidebar-collapsed" : ""}`}>
      <div className="home-sidebar-inner">
        <div className="home-sidebar-top">
          <div className="home-sidebar-brand">
            <h3 className="home-sidebar-title">Deepenk</h3>
            <div className="home-sidebar-logo">D</div>
          </div>
          <button type="button" className="home-sidebar-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggle}>
            {collapsed ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="home-sidebar-nav" aria-label="Sidebar navigation">
          <Link className={`home-sidebar-link ${activePage === "home" ? "home-sidebar-link-active" : ""}`} href="/home">
            <House size={22} strokeWidth={2.1} />
            <span>Home</span>
          </Link>
          <Link className={`home-sidebar-link ${activePage === "history" ? "home-sidebar-link-active" : ""}`} href="/history">
            <History size={22} strokeWidth={2.1} />
            <span>History</span>
          </Link>
          <Link className={`home-sidebar-link ${activePage === "food" ? "home-sidebar-link-active" : ""}`} href="/food">
            <Pizza size={22} strokeWidth={2.1} />
            <span>Food</span>
          </Link>
          <Link className={`home-sidebar-link ${activePage === "rides" ? "home-sidebar-link-active" : ""}`} href="/rides">
            <CarFront size={22} strokeWidth={2.1} />
            <span>Rides</span>
          </Link>
        </nav>

        <div className="home-sidebar-scroll">
          <div className="mt-2">
            <div className="text-sm font-semibold text-foreground mb-2">Recent</div>
            <div className="space-y-2">
              {RECENT.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-full text-left rounded-lg px-2 py-2 text-sm text-foreground hover:bg-amber-50"
                  onClick={() => {
                    window.localStorage.setItem("home_prompt_draft", c);
                    setLocation("/home");
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="home-sidebar-bottom">
          <button type="button" className="w-full rounded-full border border-amber-200 bg-white px-4 py-3 font-semibold text-foreground" onClick={() => setLocation("/profile")}>
            <span className="home-sidebar-bottom-label">Profile</span>
            <User className="home-sidebar-bottom-icon" size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function HistoryScreen() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"All" | "Food" | "Rides">("All");
  type OrderStatus = "CREATED" | "PAYMENT_PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  type Domain = "ecommerce" | "food" | "rides" | "travel" | "hospitality";
  type Order = {
    id: string;
    userId: string;
    domain: Domain;
    provider: string;
    title: string;
    itemUrl: string;
    amount: { currency: "INR"; amount: number };
    status: OrderStatus;
    paymentIntentId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Order[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const returnUrl = useMemo(() => `${window.location.origin}/history`, []);
  const notifyUrl = useMemo(() => {
    const configured = import.meta.env.VITE_API_URL as string | undefined;
    const apiOrigin = typeof configured === "string" && configured.startsWith("http") ? new URL(configured).origin : window.location.origin;
    return `${apiOrigin}/api/payments/webhooks/cashfree`;
  }, []);

  const loadCashfreeSdk = async () => {
    if (window.Cashfree) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-cashfree-sdk="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("CASHFREE_SDK_LOAD_FAILED")));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.dataset.cashfreeSdk = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("CASHFREE_SDK_LOAD_FAILED"));
      document.head.appendChild(script);
    });
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await ordersAPI.listOrders(50);
      setItems(Array.isArray(data?.items) ? (data.items as Order[]) : []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const domainLabel = (d: Domain) => (d === "ecommerce" ? "Ecommerce" : d === "food" ? "Food" : d === "rides" ? "Rides" : d === "travel" ? "Travel" : "Hospitality");

  const shown = items.filter((o) => {
    const cat = o.domain === "rides" ? "Rides" : o.domain === "food" ? "Food" : "Other";
    if (filter === "All") return true;
    return cat === filter;
  });

  const statusPill = (s: OrderStatus) => {
    if (s === "CONFIRMED") return { label: "Complete", cls: "history-status-complete" };
    if (s === "CANCELLED" || s === "FAILED") return { label: s === "FAILED" ? "Failed" : "Cancel", cls: "history-status-cancel" };
    return { label: s === "PAYMENT_PENDING" ? "Pending" : "Ongoing", cls: "history-status-ongoing" };
  };

  const badgeStyle = (o: Order) => {
    const d = o.domain;
    if (d === "rides") return { background: "linear-gradient(180deg, #2f80ed 0%, #1c63c3 100%)" };
    if (d === "food") return { background: "linear-gradient(180deg, #ff5d1a 0%, #ff8a00 100%)" };
    if (d === "ecommerce") return { background: "linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)" };
    if (d === "travel") return { background: "linear-gradient(180deg, #0ea5e9 0%, #0369a1 100%)" };
    return { background: "linear-gradient(180deg, #10b981 0%, #047857 100%)" };
  };

  const startPayment = async (order: Order, customerPhone?: string) => {
    setPayingOrderId(order.id);
    let phone = customerPhone;
    try {
      let created: any;
      try {
        created = await ordersAPI.createPaymentIntent(order.id, { customerPhone: phone, returnUrl, notifyUrl });
      } catch (e) {
        const err = e as any;
        const code = err?.response?.data?.error;
        if (code === "MISSING_CUSTOMER_PHONE" && !phone) {
          phone = window.prompt("Enter phone number for payment (e.g. 9999999999):")?.trim();
          if (phone) {
            created = await ordersAPI.createPaymentIntent(order.id, { customerPhone: phone, returnUrl, notifyUrl });
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
      const payment = created?.payment;
      const checkout = payment?.checkout;
      const paymentSessionId = checkout?.paymentSessionId;
      if (typeof paymentSessionId !== "string" || !paymentSessionId) {
        throw new Error("PAYMENT_INTENT_CREATE_FAILED");
      }

      await loadCashfreeSdk();
      const cashfree = window.Cashfree?.({ mode: checkout?.env || "sandbox" });
      await cashfree?.checkout({ paymentSessionId, redirectTarget: "_modal" });
      await fetchOrders();
    } catch (e) {
      toast.error("Payment init failed.");
    } finally {
      setPayingOrderId(null);
    }
  };

  const cancelOrder = async (order: Order) => {
    setCancellingOrderId(order.id);
    try {
      await ordersAPI.cancelOrder(order.id);
      toast.success("Order cancelled.");
      await fetchOrders();
    } catch {
      toast.error("Cancel failed.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="mobile-stage">
      <div className="fit-shell">
        <div className="phone-screen">
          <section className="screen history-screen">
            <div className="simple-topbar">
              <button className="simple-topbar-button" type="button" onClick={() => setLocation("/home")} aria-label="Back">
                ←
              </button>
              <h2 className="simple-topbar-title">History</h2>
              <div className="simple-topbar-space" />
            </div>

            <div className="history-filter-row" role="tablist" aria-label="History filters">
              {(["All", "Food", "Rides"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`history-filter-pill ${filter === k ? "history-filter-pill-active" : ""}`}
                  onClick={() => setFilter(k)}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="history-card-list">
              {isLoading && <div className="py-10 text-center text-muted-foreground">Loading…</div>}
              {!isLoading && shown.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">No orders yet.</div>
              )}
              {!isLoading &&
                shown.map((o) => {
                  const pill = statusPill(o.status);
                  const canPay = o.status === "CREATED" || o.status === "PAYMENT_PENDING";
                  const canCancel = o.status !== "CONFIRMED" && o.status !== "CANCELLED" && o.status !== "FAILED";
                  return (
                    <div key={o.id} className="history-booking-card">
                      <div className="history-brand-badge" style={badgeStyle(o)}>
                        {(o.provider || "?").slice(0, 8)}
                      </div>
                      <div className="history-booking-copy">
                        <strong>{o.title}</strong>
                        <span>
                          {new Date(o.createdAt).toLocaleString()} • {domainLabel(o.domain)} • ₹{Number(o.amount?.amount ?? 0).toLocaleString()}
                        </span>
                        {(canPay || canCancel) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {canPay && (
                              <button
                                type="button"
                                className="px-3 py-2 rounded-full bg-orange-500 text-white text-xs font-bold"
                                disabled={payingOrderId === o.id}
                                onClick={() => startPayment(o)}
                              >
                                {payingOrderId === o.id ? "Starting…" : "Pay now"}
                              </button>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                className="px-3 py-2 rounded-full bg-white border border-orange-200 text-orange-700 text-xs font-bold"
                                disabled={cancellingOrderId === o.id}
                                onClick={() => cancelOrder(o)}
                              >
                                {cancellingOrderId === o.id ? "Cancelling…" : "Cancel"}
                              </button>
                            )}
                            <button
                              type="button"
                              className="px-3 py-2 rounded-full bg-white border border-orange-200 text-foreground text-xs font-bold"
                              onClick={() => window.open(o.itemUrl, "_blank")}
                            >
                              Open
                            </button>
                          </div>
                        )}
                      </div>
                      <div className={`history-status-pill ${pill.cls}`}>{pill.label}</div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const isDesktop = useIsDesktop();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = window.localStorage.getItem("sidebar_expanded");
    return saved ? saved === "1" : true;
  });
  useEffect(() => {
    window.localStorage.setItem("sidebar_expanded", sidebarExpanded ? "1" : "0");
  }, [sidebarExpanded]);

  const shellClass = isDesktop ? `app-shell with-sidebar ${sidebarExpanded ? "" : "sidebar-collapsed"}` : "app-shell";

  return (
    <div className={shellClass}>
      <DesktopSidebar collapsed={!sidebarExpanded} onToggle={() => setSidebarExpanded((v) => !v)} />
      <Switch>
        <Route path="/" component={WelcomeScreen} />
        <Route path="/home" component={SearchPage} />
        <Route path="/history" component={HistoryScreen} />
        <Route path="/login" component={AuthPage} />
        <Route path="/auth">
          <Redirect to="/login" />
        </Route>
        <Route path="/web" component={Home} />
        <Route path="/search" component={SearchPage} />
        <Route path="/deals">
          <Redirect to="/web" />
        </Route>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/ecommerce" component={EcommercePage} />
        <Route path="/food" component={FoodPage} />
        <Route path="/rides" component={RidesPage} />
        <Route path="/travel" component={TravelPage} />
        <Route path="/hospitality" component={HospitalityPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
