import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  Bell,
  Boxes,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  FileUp,
  Filter,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
  X,
  RotateCcw,
  CircleAlert,
  CircleCheck,
  PanelLeftClose,
  MessageSquareText,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateProductProfit,
  daysUntilStockout,
  calculateReturnRate,
  orderFinancials,
} from "../server/calculations.js";
import "./styles.css";

const originalFetch = window.fetch.bind(window);
const apiFetch = (url, options = {}) =>
  originalFetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(sessionStorage.getItem("marginly_token")
        ? {
            Authorization: `Bearer ${sessionStorage.getItem("marginly_token")}`,
          }
        : {}),
    },
  });
const words = {
  en: {
    overview: "Overview",
    products: "Products",
    inventory: "Inventory",
    analytics: "Analytics",
    returns: "Returns",
    advisor: "AI Advisor",
    integrations: "Integrations",
    settings: "Settings",
    signOut: "Sign out",
    stock: "Stock predictions",
    daily: "Daily AI recommendations",
  },
  uz: {
    overview: "Bosh sahifa",
    products: "Mahsulotlar",
    inventory: "Ombor",
    analytics: "Tahlil",
    returns: "Qaytarishlar",
    advisor: "AI maslahatchi",
    integrations: "Integratsiyalar",
    settings: "Sozlamalar",
    signOut: "Chiqish",
    stock: "Zaxira prognozi",
    daily: "Kunlik AI tavsiyalari",
  },
  ru: {
    overview: "Обзор",
    products: "Товары",
    inventory: "Склад",
    analytics: "Аналитика",
    returns: "Возвраты",
    advisor: "AI-советник",
    integrations: "Интеграции",
    settings: "Настройки",
    signOut: "Выйти",
    stock: "Прогноз запасов",
    daily: "Ежедневные AI-рекомендации",
  },
};
const navigation = [
  "overview",
  "products",
  "inventory",
  "analytics",
  "returns",
  "advisor",
  "integrations",
];
function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "register" ? { name } : {}),
        }),
      });
      if (!/\bjson\b/i.test(res.headers.get("content-type") || "")) {
        throw new Error(
          `The authentication endpoint returned a non-JSON response (HTTP ${res.status}). Check that the API server is running.`,
        );
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Authentication failed");
      sessionStorage.setItem("marginly_token", result.token);
      onAuthenticated(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-background">
      <form className="auth-box" onSubmit={submit}>
        <div className="brand">
          <div className="brand-mark">m</div>
          <span>marginly</span>
        </div>
        <h1>{mode === "login" ? "Welcome back" : "Create seller account"}</h1>
        <p>Marketplace analytics · MongoDB-powered</p>
        {mode === "register" && (
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (10+ characters)"
          value={password}
          minLength={10}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="auth-error">{error}</p>}
        <button disabled={busy} className="button button-primary">
          {busy ? "Working..." : mode === "login" ? "Log in" : "Register"}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Create account" : "Already registered? Log in"}
        </button>
        <small>
          Demo: use the credentials configured in .env after running npm run
          seed.
        </small>
      </form>
    </div>
  );
}
function Root() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const token = sessionStorage.getItem("marginly_token");
    if (!token) {
      setChecking(false);
      return;
    }
    originalFetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw Error("Session expired");
        return r.json();
      })
      .then((d) => setUser(d.user))
      .catch(() => sessionStorage.removeItem("marginly_token"))
      .finally(() => setChecking(false));
  }, []);
  if (checking) return <div className="loading-screen">Loading...</div>;
  return user ? (
    <App
      user={user}
      logout={() => {
        sessionStorage.removeItem("marginly_token");
        setUser(null);
      }}
    />
  ) : (
    <AuthGate onAuthenticated={setUser} />
  );
}
const navigationOld = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "returns", label: "Returns", icon: RotateCcw },
  { id: "advisor", label: "AI Advisor", icon: BrainCircuit },
  { id: "integrations", label: "Integrations", icon: Store },
];
const marketplaceColors = {
  Amazon: "#efa833",
  Shopify: "#77a878",
  Etsy: "#dd795a",
  "Uzum Market": "#7257dd",
  Wildberries: "#bc58a4",
  Ozon: "#4084e8",
};
const currency = (amount, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
    ...(compact ? { notation: "compact" } : {}),
  }).format(amount || 0);
const preciseCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
const percent = (value) => `${Number(value || 0).toFixed(1)}%`;
const dateLabel = (value, options = { month: "short", day: "numeric" }) =>
  new Date(value).toLocaleDateString("en-US", options);
const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

function rangeOrders(orders, range) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = startOfDay(new Date());
  if (range === "Today") start.setDate(start.getDate());
  else start.setDate(start.getDate() - (Number(range) - 1));
  return orders.filter((order) => {
    const date = new Date(order.date);
    return date >= start && date <= end;
  });
}

function totalMetrics(orders) {
  return orders.reduce(
    (totals, order) => {
      const amounts = orderFinancials(order);
      totals.revenue += amounts.revenue;
      totals.expenses += amounts.totalExpenses;
      totals.profit += amounts.netProfit;
      totals.units += order.quantity;
      totals.orders += 1;
      return totals;
    },
    { revenue: 0, expenses: 0, profit: 0, units: 0, orders: 0 },
  );
}

function statusFor(product) {
  if (product.stock === 0)
    return { text: "Out of stock", className: "status-red" };
  if (product.stock <= Math.ceil(product.minStock * 0.5))
    return { text: "Critical", className: "status-red" };
  if (product.stock <= product.minStock)
    return { text: "Low stock", className: "status-amber" };
  return { text: "Healthy", className: "status-green" };
}

function App({ user, logout }) {
  const [data, setData] = useState(null);
  const [lang, setLang] = useState(user.locale || "uz");
  const t = words[lang];
  const [page, setPage] = useState("overview");
  const [dateRange, setDateRange] = useState("30");
  const [chartPeriod, setChartPeriod] = useState("Daily");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/state");
      if (!response.ok) throw new Error("Could not load business data.");
      setData(await response.json());
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const products = data?.products ?? [];
  const orders = data?.orders ?? [];
  const visibleOrders = useMemo(
    () => rangeOrders(orders, dateRange),
    [orders, dateRange],
  );
  const metrics = useMemo(() => totalMetrics(visibleOrders), [visibleOrders]);
  const previousMetrics = useMemo(() => {
    const days = dateRange === "Today" ? 1 : Number(dateRange);
    const currentStart = startOfDay(new Date());
    currentStart.setDate(currentStart.getDate() - days + 1);
    const end = new Date(currentStart.getTime() - 1);
    const start = new Date(currentStart);
    start.setDate(start.getDate() - days);
    return totalMetrics(
      orders.filter(
        (order) => new Date(order.date) >= start && new Date(order.date) <= end,
      ),
    );
  }, [orders, dateRange]);

  const goTo = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  async function resetDemo() {
    if (
      !window.confirm(
        "Reset demo data to its original sample state? Your product changes will be removed.",
      )
    )
      return;
    try {
      const response = await apiFetch("/api/demo/reset", { method: "POST" });
      if (!response.ok) throw new Error("The demo data could not be reset.");
      setData(await response.json());
      setNotice("Demo data has been reset.");
    } catch (resetError) {
      setNotice(resetError.message);
    }
  }

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loader" />
        Loading your workspace
      </div>
    );
  if (error)
    return (
      <div className="error-screen">
        <CircleAlert size={20} />
        <div>
          <strong>Workspace unavailable</strong>
          <p>{error} Make sure the Express server is running.</p>
          <button className="button button-primary" onClick={loadData}>
            Try again
          </button>
        </div>
      </div>
    );

  const active = [
    ...navigationOld,
    { id: "settings", label: "Settings", icon: Settings },
  ].find((item) => item.id === page);
  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">m</div>
          <span>marginly</span>
          <button
            aria-label="Close menu"
            className="icon-button mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-avatar">N</div>
          <div className="workspace-copy">
            <strong>{data.business.name}</strong>
            <span>{data.demoMode ? "Demo workspace" : "Live workspace"}</span>
          </div>
          <ChevronDown size={15} className="muted-icon" />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigationOld.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "nav-active" : ""}`}
              onClick={() => goTo(id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{t[id]}</span>
              {id === "inventory" &&
                products.some(
                  (product) => product.stock <= product.minStock,
                ) && (
                  <span className="nav-count">
                    {
                      products.filter(
                        (product) => product.stock <= product.minStock,
                      ).length
                    }
                  </span>
                )}
            </button>
          ))}
        </nav>
        <div className="nav-separator" />
        <button
          className={`nav-item ${page === "settings" ? "nav-active" : ""}`}
          onClick={() => goTo("settings")}
        >
          <Settings size={17} strokeWidth={1.8} />
          <span>{t.settings}</span>
        </button>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <LifeBuoy size={16} />
            </div>
            <div>
              <strong>Need a hand?</strong>
              <span>Visit the help center</span>
            </div>
            <ExternalLink size={14} />
          </div>
          <button className="profile-button" onClick={() => goTo("settings")}>
            <div className="profile-avatar">JD</div>
            <div className="profile-copy">
              <strong>{user.name || user.email}</strong>
              <span>Seller account</span>
            </div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{active?.label ?? "Overview"}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <select
              aria-label="Language"
              value={lang}
              onChange={async (e) => {
                setLang(e.target.value);
                await apiFetch("/api/settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ locale: e.target.value }),
                });
              }}
            >
              <option value="uz">O‘zbek</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
            <button className="button button-secondary" onClick={logout}>
              {t.signOut}
            </button>
            <div className="demo-pill">
              <span /> {data.demoMode ? "Demo mode" : "Store mode"}
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setNotice("No new notifications.")}
            >
              <Bell size={18} />
              <i />
            </button>
            <button
              className="topbar-avatar profile-shortcut"
              aria-label="Open settings"
              onClick={() => goTo("settings")}
            >
              JD
            </button>
          </div>
        </header>
        <div className="page-content">
          {page === "overview" && (
            <>
              <SaaSPanel lang={lang} t={t} />
              <Dashboard
                data={data}
                products={products}
                orders={orders}
                visibleOrders={visibleOrders}
                metrics={metrics}
                previousMetrics={previousMetrics}
                dateRange={dateRange}
                setDateRange={setDateRange}
                chartPeriod={chartPeriod}
                setChartPeriod={setChartPeriod}
                goTo={goTo}
              />
            </>
          )}
          {page === "products" && (
            <ProductsPage
              products={products}
              orders={orders}
              onAdd={() => setModal({ type: "add" })}
              onEdit={(product) => setModal({ type: "edit", product })}
              onDelete={async (product) => {
                if (
                  !window.confirm(
                    `Delete ${product.name}? This cannot be undone.`,
                  )
                )
                  return;
                const response = await apiFetch(`/api/products/${product.id}`, {
                  method: "DELETE",
                });
                if (!response.ok) {
                  setNotice("Could not delete the product.");
                  return;
                }
                await loadData();
                setNotice("Product deleted.");
              }}
              onImport={() => setModal({ type: "import" })}
            />
          )}
          {page === "inventory" && (
            <>
              <StockPanel lang={lang} t={t} />
              <InventoryPage
                products={products}
                orders={visibleOrders}
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </>
          )}
          {page === "analytics" && (
            <AnalyticsPage
              products={products}
              orders={visibleOrders}
              metrics={metrics}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          )}
          {page === "returns" && (
            <ReturnsPage returns={data.returns} orders={orders} />
          )}
          {page === "advisor" && <AdvisorPage products={products} />}
          {page === "integrations" && (
            <>
              <ConnectStore />
              <IntegrationsPage connections={data.connections} />
            </>
          )}
          {page === "settings" && (
            <>
              <TelegramSettings />
              <SettingsPage
                data={data}
                resetDemo={resetDemo}
                onSave={async (business) => {
                  const response = await apiFetch("/api/business", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: business.name }),
                  });
                  const result = await response.json();
                  if (!response.ok)
                    throw new Error(
                      result.error ?? "Could not save business profile.",
                    );
                  setData((current) => ({ ...current, business: result }));
                }}
              />
            </>
          )}
        </div>
      </main>
      {modal && (
        <ProductModal
          mode={modal.type}
          product={modal.product}
          products={products}
          onClose={() => setModal(null)}
          onSave={async (form, isEdit) => {
            try {
              const response = await apiFetch(
                isEdit ? `/api/products/${modal.product.id}` : "/api/products",
                {
                  method: isEdit ? "PUT" : "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...form,
                    price: Number(form.price),
                    cogs: Number(form.cogs),
                    stock: Number(form.stock),
                    minStock: Number(form.minStock),
                  }),
                },
              );
              const result = await response.json();
              if (!response.ok)
                throw new Error(result.error ?? "Could not save product.");
              await loadData();
              setModal(null);
              setNotice(isEdit ? "Product updated." : "Product added.");
            } catch (saveError) {
              throw saveError;
            }
          }}
          onImportComplete={async (newProducts) => {
            for (const product of newProducts) {
              const response = await apiFetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(product),
              });
              if (!response.ok) {
                const result = await response.json();
                throw new Error(
                  `${product.name}: ${result.error ?? "Could not import product."}`,
                );
              }
            }
            await loadData();
            setModal(null);
            setNotice(
              `${newProducts.length} product${newProducts.length === 1 ? "" : "s"} imported.`,
            );
          }}
        />
      )}
      {notice && (
        <div className="toast">
          <CircleCheck size={17} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function SaaSPanel({ lang, t }) {
  const [cards, setCards] = useState([]);
  const [profit, setProfit] = useState(null);
  useEffect(() => {
    apiFetch(`/api/ai/daily-advice?lang=${lang}`)
      .then((r) => r.json())
      .then((d) => setCards(d.cards || []))
      .catch(() => {});
    apiFetch("/api/analytics/profit")
      .then((r) => r.json())
      .then(setProfit)
      .catch(() => {});
  }, [lang]);
  return (
    <div className="saas-grid">
      <section className="panel saas-widget">
        <h2>Net unit economics</h2>
        <p>Including fees, shipping, storage, refunds and COGS</p>
        <div className="saas-numbers">
          <strong>{profit ? currency(profit.total.profit) : "—"}</strong>
          <span>
            Margin {profit?.total.margin ?? "—"}% · ROI{" "}
            {profit?.total.roi ?? "—"}%
          </span>
        </div>
      </section>
      <section className="panel saas-widget">
        <h2>{t.daily}</h2>
        {cards.map((card, i) => (
          <p key={i}>
            <b>
              {card.kind.toUpperCase()} · {card.sku}
            </b>{" "}
            — {card.text}
          </p>
        ))}
        {!cards.length && <p>Loading daily recommendations...</p>}
      </section>
    </div>
  );
}
function StockPanel({ lang, t }) {
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMuted(Boolean(d.user?.widgetMuted)))
      .catch(() => {});
    apiFetch("/api/inventory/predictions")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="panel saas-widget">
      <div className="saas-heading">
        <h2>{t.stock}</h2>
        <button
          className="button button-secondary"
          onClick={() => setHidden(!hidden)}
        >
          {hidden ? "Show" : "Hide"}
        </button>
      </div>
      {!hidden && !muted && (
        <>
          {error && <p>{error}</p>}
          <div className="stock-list">
            {items.map((item) => (
              <div key={item.sku} className="stock-item">
                <b>
                  {item.name} · {item.sku}
                </b>
                <span>Stock: {item.stock} units</span>
                <span>Velocity: {item.velocity}/day</span>
                <span>
                  Stockout:{" "}
                  {item.daysRemaining === null
                    ? "Insufficient data"
                    : `${item.daysRemaining} days`}
                </span>
                <span>
                  Reorder: {item.reorderQuantity} units by{" "}
                  {item.reorderDate || "—"}
                </span>
                <small>
                  {item.trend} · {item.seasonality} · {item.recommendation}
                </small>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
function ConnectStore() {
  const [marketplace, setMarketplace] = useState("Uzum Market");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e) {
    e.preventDefault();
    const r = await apiFetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketplace, accessToken: token }),
    });
    const j = await r.json();
    setMessage(j.note || j.error);
    if (r.ok) setToken("");
  }
  return (
    <section className="panel saas-widget">
      <h2>Save marketplace API credentials</h2>
      <p>
        Encrypted at rest. Saving credentials does not activate synchronization
        until an authorized provider adapter is configured.
      </p>
      <form className="saas-form" onSubmit={submit}>
        <select
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
        >
          {[
            "Uzum Market",
            "Amazon",
            "Shopify",
            "Etsy",
            "Wildberries",
            "Ozon",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <input
          type="password"
          autoComplete="off"
          placeholder="API key / access token"
          value={token}
          minLength={8}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <button className="button button-primary">Save encrypted token</button>
      </form>
      <p>{message}</p>
    </section>
  );
}
function TelegramSettings() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const generate = async () => {
    const r = await apiFetch("/api/telegram/link", { method: "POST" });
    const j = await r.json();
    if (r.ok) setCode(j.code);
    else setMessage(j.error);
  };
  return (
    <section className="panel saas-widget">
      <h2>Telegram inventory alerts</h2>
      <p>
        Link the seller account with your bot and receive warnings when stock
        coverage falls below supplier lead time.
      </p>
      <button className="button button-primary" onClick={generate}>
        Generate Telegram pairing code
      </button>
      {code && (
        <p>
          Send <code>/start {code}</code> to your Telegram bot within 10
          minutes.
        </p>
      )}
      <label className="saas-muted">
        <input
          type="checkbox"
          checked={muted}
          onChange={async (e) => {
            setMuted(e.target.checked);
            await apiFetch("/api/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ widgetMuted: e.target.checked }),
            });
          }}
        />{" "}
        Mute web inventory widget (Telegram alerts remain enabled)
      </label>
      {message && <p>{message}</p>}
    </section>
  );
}

function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

function DateSelect({ value, onChange }) {
  return (
    <label className="select-wrap date-select">
      <SlidersHorizontal size={14} />
      <span>Last</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="Today">today</option>
        <option value="7">7 days</option>
        <option value="30">30 days</option>
        <option value="90">90 days</option>
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

function MetricCard({ title, value, change, note, icon: Icon, tone }) {
  const positive = Number(change) >= 0;
  return (
    <section className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className={`metric-icon ${tone}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        <span className={`change ${positive ? "change-up" : "change-down"}`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(change).toFixed(1)}%
        </span>
        <span>{note}</span>
      </div>
    </section>
  );
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function Dashboard({
  data,
  products,
  orders,
  visibleOrders,
  metrics,
  previousMetrics,
  dateRange,
  setDateRange,
  chartPeriod,
  setChartPeriod,
  goTo,
}) {
  const chartData = useMemo(
    () => makeChartData(visibleOrders, chartPeriod),
    [visibleOrders, chartPeriod],
  );
  const topProducts = useMemo(
    () =>
      productPerformance(products, visibleOrders)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 4),
    [products, visibleOrders],
  );
  const recentOrders = [...visibleOrders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);
  const lowProducts = products.filter(
    (product) => product.stock <= product.minStock,
  );
  const margin = metrics.revenue ? (metrics.profit / metrics.revenue) * 100 : 0;
  const previousMargin = previousMetrics.revenue
    ? (previousMetrics.profit / previousMetrics.revenue) * 100
    : 0;

  return (
    <>
      <PageHeading
        eyebrow={new Date()
          .toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
          .toUpperCase()}
        title="Store overview"
        description="Here’s what’s happening across your business."
        actions={
          <>
            <DateSelect value={dateRange} onChange={setDateRange} />
            <button
              className="button button-secondary"
              onClick={() => exportReport(visibleOrders)}
            >
              <Download size={15} /> Export report
            </button>
          </>
        }
      />
      <div className="demo-banner">
        <div className="demo-banner-icon">
          <CircleHelp size={17} />
        </div>
        <span>
          <strong>Exploring demo data.</strong> Sample numbers help you see how
          Marginly works before connecting a store.
        </span>
        <button onClick={() => goTo("integrations")}>
          Connect a store <ArrowRight size={14} />
        </button>
      </div>
      <div className="metrics-grid">
        <MetricCard
          title="Total revenue"
          value={currency(metrics.revenue, true)}
          change={percentChange(metrics.revenue, previousMetrics.revenue)}
          note="vs. previous period"
          icon={Wallet}
          tone="blue"
        />
        <MetricCard
          title="Total expenses"
          value={currency(metrics.expenses, true)}
          change={percentChange(metrics.expenses, previousMetrics.expenses)}
          note="vs. previous period"
          icon={ArrowDownRight}
          tone="amber"
        />
        <MetricCard
          title="Net profit"
          value={currency(metrics.profit, true)}
          change={percentChange(metrics.profit, previousMetrics.profit)}
          note="vs. previous period"
          icon={TrendingUp}
          tone="green"
        />
        <MetricCard
          title="Profit margin"
          value={percent(margin)}
          change={percentChange(margin, previousMargin)}
          note="vs. previous period"
          icon={Activity}
          tone="violet"
        />
      </div>
      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Revenue &amp; profit</h2>
            <p>Track how revenue turns into profit over time</p>
          </div>
          <div className="segmented-control">
            {["Daily", "Weekly", "Monthly"].map((period) => (
              <button
                key={period}
                className={chartPeriod === period ? "segment-active" : ""}
                onClick={() => setChartPeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-dot legend-revenue" />
            Revenue
          </span>
          <span>
            <i className="legend-dot legend-expenses" />
            Expenses
          </span>
          <span>
            <i className="legend-dot legend-profit" />
            Net profit
          </span>
        </div>
        <div className="main-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6387d7" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#6387d7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#52a884" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#52a884" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#edf0f3" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8a919c", fontSize: 11 }}
                dy={10}
                minTickGap={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8a919c", fontSize: 11 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#698bd6"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#e9a754"
                strokeWidth={1.8}
                fill="transparent"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Net profit"
                stroke="#54a987"
                strokeWidth={2}
                fill="url(#profitFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className="dashboard-lower">
        <section className="panel performance-panel">
          <div className="panel-heading">
            <div>
              <h2>Top products</h2>
              <p>By net profit this period</p>
            </div>
            <button className="text-button" onClick={() => goTo("products")}>
              All products <ArrowRight size={14} />
            </button>
          </div>
          <div className="product-performance-list">
            {topProducts.map((item, index) => (
              <div className="performance-row" key={item.id}>
                <div className="rank">{String(index + 1).padStart(2, "0")}</div>
                <div
                  className="product-swatch"
                  style={{ backgroundColor: item.color }}
                >
                  <ShoppingBag size={16} />
                </div>
                <div className="performance-name">
                  <strong>{item.name}</strong>
                  <span>{item.units} units sold</span>
                </div>
                <div className="performance-result">
                  <strong>{currency(item.profit)}</strong>
                  <span>{percent(item.margin)} margin</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel insight-panel">
          <div className="panel-heading">
            <div>
              <div className="title-with-icon">
                <div className="insight-spark">
                  <Sparkles size={15} />
                </div>
                <h2>Daily insights</h2>
              </div>
              <p>Signals from your business data</p>
            </div>
            <button
              aria-label="Open advisor"
              className="icon-button"
              onClick={() => goTo("advisor")}
            >
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="insight-list">
            {lowProducts.length > 0 ? (
              lowProducts.slice(0, 2).map((product, index) => (
                <div className="insight-item" key={product.id}>
                  <span
                    className={`priority-mark ${index ? "priority-low" : "priority-high"}`}
                  />
                  <div>
                    <strong>{product.name} is running low</strong>
                    <p>
                      {product.stock} units left, below your {product.minStock}
                      -unit threshold.
                    </p>
                    <button onClick={() => goTo("inventory")}>
                      Review inventory <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="insight-item">
                <span className="priority-mark priority-low" />
                <div>
                  <strong>
                    {topProducts[0]?.name ?? "Your catalog"} leads on profit
                  </strong>
                  <p>
                    Review product performance for the strongest margins this
                    period.
                  </p>
                  <button onClick={() => goTo("advisor")}>
                    Explore insight <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="advisor-link" onClick={() => goTo("advisor")}>
            <Sparkles size={14} /> Ask your AI advisor <ArrowRight size={13} />
          </button>
        </section>
      </div>
      <div className="dashboard-lower dashboard-secondary">
        <section className="panel snapshot-panel">
          <div className="panel-heading">
            <div>
              <h2>Sales snapshot</h2>
              <p>Performance for this period</p>
            </div>
            <ShoppingBag size={16} className="snapshot-icon" />
          </div>
          <div className="snapshot-stats">
            <div>
              <span>Orders</span>
              <strong>{metrics.orders.toLocaleString()}</strong>
            </div>
            <div>
              <span>Units sold</span>
              <strong>{metrics.units.toLocaleString()}</strong>
            </div>
            <div>
              <span>Avg. order value</span>
              <strong>
                {currency(
                  metrics.orders ? metrics.revenue / metrics.orders : 0,
                )}
              </strong>
            </div>
          </div>
        </section>
        <InventoryWidget products={products} goTo={goTo} />
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent orders</h2>
            <p>Your latest order activity</p>
          </div>
          <button className="text-button" onClick={() => goTo("analytics")}>
            View analytics <ArrowRight size={14} />
          </button>
        </div>
        <OrdersTable orders={recentOrders} compact />
      </section>
      <div className="dashboard-footnote">
        <CircleHelp size={14} /> Profit is estimated from recorded COGS,
        marketplace fees, shipping, advertising, and other listed order costs.
        Subscription and business-level expenses are not included in this
        order-level view.
      </div>
    </>
  );
}

function exportReport(orders) {
  const rows = [
    [
      "Order ID",
      "Date",
      "Product",
      "Marketplace",
      "Units",
      "Revenue",
      "Expenses",
      "Net profit",
      "Status",
    ],
    ...orders.map((order) => {
      const amounts = orderFinancials(order);
      return [
        order.id,
        order.date,
        order.productName,
        order.marketplace,
        order.quantity,
        amounts.revenue.toFixed(2),
        amounts.totalExpenses.toFixed(2),
        amounts.netProfit.toFixed(2),
        order.status,
      ];
    }),
  ];
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `marginly-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function InventoryWidget({ products, goTo }) {
  const [expanded, setExpanded] = useState(true);
  const lowProducts = products.filter(
    (product) => product.stock <= product.minStock,
  );
  const outOfStock = products.filter((product) => product.stock === 0).length;
  return (
    <section className="panel inventory-widget">
      <div className="panel-heading">
        <div>
          <h2>Inventory overview</h2>
          <p>
            {products.length} products · {lowProducts.length} need attention
          </p>
        </div>
        <button
          aria-label={
            expanded ? "Collapse inventory widget" : "Expand inventory widget"
          }
          className="icon-button widget-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {expanded && (
        <>
          <div className="widget-summary">
            <span>
              <i className="stock-dot healthy-dot" />
              {products.length - lowProducts.length} healthy
            </span>
            <span>
              <i className="stock-dot low-dot" />
              {lowProducts.length} low stock
            </span>
            <span>
              <i className="stock-dot out-dot" />
              {outOfStock} out of stock
            </span>
          </div>
          {lowProducts.length > 0 && (
            <div className="widget-product-list">
              {lowProducts.slice(0, 3).map((product) => (
                <div key={product.id}>
                  <span>{product.name}</span>
                  <strong className={statusFor(product).className}>
                    {product.stock} left
                  </strong>
                </div>
              ))}
            </div>
          )}
          <button
            className="text-button widget-link"
            onClick={() => goTo("inventory")}
          >
            View inventory <ArrowRight size={13} />
          </button>
        </>
      )}
    </section>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.name}>
          <span style={{ background: item.color }} />
          {item.name}
          <b>{preciseCurrency(item.value)}</b>
        </div>
      ))}
    </div>
  );
}

function makeChartData(orders, period = "Daily") {
  const buckets = new Map();
  for (const order of orders) {
    const date = new Date(order.date);
    let key;
    let label;
    if (period === "Monthly") {
      key = `${date.getFullYear()}-${date.getMonth()}`;
      label = date.toLocaleDateString("en-US", { month: "short" });
    } else if (period === "Weekly") {
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      key = monday.toISOString().slice(0, 10);
      label = dateLabel(monday, { month: "short", day: "numeric" });
    } else {
      key = date.toISOString().slice(0, 10);
      label = dateLabel(date, { month: "short", day: "numeric" });
    }
    if (!buckets.has(key))
      buckets.set(key, { key, label, revenue: 0, expenses: 0, profit: 0 });
    const bucket = buckets.get(key);
    const result = orderFinancials(order);
    bucket.revenue += result.revenue;
    bucket.expenses += result.totalExpenses;
    bucket.profit += result.netProfit;
  }
  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function productPerformance(products, orders) {
  return products.map((product) => {
    const matching = orders.filter((order) => order.productId === product.id);
    const totals = totalMetrics(matching);
    return {
      ...product,
      units: totals.units,
      revenue: totals.revenue,
      profit: totals.profit,
      margin: totals.revenue ? (totals.profit / totals.revenue) * 100 : 0,
    };
  });
}

function OrdersTable({ orders, compact = false }) {
  if (!orders.length)
    return <div className="empty-state">No orders found for this period.</div>;
  return (
    <div className="table-scroll">
      <table className={compact ? "data-table compact-table" : "data-table"}>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>PRODUCT</th>
            <th>MARKETPLACE</th>
            <th>DATE</th>
            <th>REVENUE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="order-id">{order.id.toUpperCase()}</td>
              <td>
                <strong className="table-primary">{order.productName}</strong>
              </td>
              <td>
                <MarketplaceName name={order.marketplace} />
              </td>
              <td className="muted-cell">{dateLabel(order.date)}</td>
              <td className="money-cell">
                {preciseCurrency(orderFinancials(order).revenue)}
              </td>
              <td>
                <span
                  className={`order-status ${order.status === "Returned" ? "status-red" : order.status === "Processing" ? "status-amber" : "status-green"}`}
                >
                  <i />
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarketplaceName({ name }) {
  return (
    <span className="marketplace-name">
      <i style={{ background: marketplaceColors[name] ?? "#bbb" }} />
      {name}
    </span>
  );
}

function ProductsPage({ products, orders, onAdd, onEdit, onDelete, onImport }) {
  const [search, setSearch] = useState("");
  const [marketplace, setMarketplace] = useState("All marketplaces");
  const [sort, setSort] = useState("profit");
  const [direction, setDirection] = useState("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 8;
  const performance = productPerformance(products, orders);
  const filtered = performance
    .filter((product) => {
      const matchSearch = `${product.name} ${product.sku} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return (
        matchSearch &&
        (marketplace === "All marketplaces" ||
          product.marketplace === marketplace)
      );
    })
    .sort((a, b) => {
      const value =
        sort === "profit"
          ? a.profit - b.profit
          : sort === "revenue"
            ? a.revenue - b.revenue
            : sort === "units"
              ? a.units - b.units
              : a.name.localeCompare(b.name);
      return direction === "desc" ? -value : value;
    });
  const visible = filtered.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );
  return (
    <>
      <PageHeading
        eyebrow="CATALOG"
        title="Products"
        description="Understand product performance and manage your catalog."
        actions={
          <>
            <button className="button button-secondary" onClick={onImport}>
              <FileUp size={15} /> Import CSV
            </button>
            <button className="button button-primary" onClick={onAdd}>
              <Plus size={16} /> Add product
            </button>
          </>
        }
      />
      <div className="summary-strip">
        <div>
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Catalog revenue</span>
          <strong>
            {currency(
              performance.reduce((sum, product) => sum + product.revenue, 0),
              true,
            )}
          </strong>
        </div>
        <div>
          <span>Catalog profit</span>
          <strong>
            {currency(
              performance.reduce((sum, product) => sum + product.profit, 0),
              true,
            )}
          </strong>
        </div>
        <div>
          <span>Low stock</span>
          <strong className="warning-value">
            {
              products.filter((product) => product.stock <= product.minStock)
                .length
            }
          </strong>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageIndex(0);
              }}
            />
          </div>
          <div className="toolbar-filters">
            <label className="select-wrap">
              <Filter size={14} />
              <select
                value={marketplace}
                onChange={(event) => setMarketplace(event.target.value)}
              >
                <option>All marketplaces</option>
                <option>Amazon</option>
                <option>Shopify</option>
                <option>Etsy</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <label className="select-wrap">
              <ArrowUpDown size={14} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="profit">Sort: profit</option>
                <option value="revenue">Sort: revenue</option>
                <option value="units">Sort: units sold</option>
                <option value="name">Sort: name</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <button
              className={`icon-button sort-direction ${direction === "asc" ? "sort-asc" : ""}`}
              aria-label="Reverse sort direction"
              onClick={() =>
                setDirection(direction === "desc" ? "asc" : "desc")
              }
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>
        {visible.length ? (
          <div className="table-scroll">
            <table className="data-table products-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SKU</th>
                  <th>MARKETPLACE</th>
                  <th>PRICE / COGS</th>
                  <th>UNITS SOLD</th>
                  <th>REVENUE</th>
                  <th>NET PROFIT</th>
                  <th>MARGIN</th>
                  <th>INVENTORY</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <div
                          className="product-swatch"
                          style={{ backgroundColor: product.color }}
                        >
                          <ShoppingBag size={15} />
                        </div>
                        <div>
                          <strong className="table-primary">
                            {product.name}
                          </strong>
                          <span className="table-sub">{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">{product.sku}</td>
                    <td>
                      <MarketplaceName name={product.marketplace} />
                    </td>
                    <td>
                      <span className="money-cell">
                        {preciseCurrency(product.price)}
                      </span>
                      <span className="table-sub">
                        COGS {preciseCurrency(product.cogs)}
                      </span>
                    </td>
                    <td>{product.units}</td>
                    <td className="money-cell">{currency(product.revenue)}</td>
                    <td
                      className={
                        product.profit < 0 ? "negative-cell" : "money-cell"
                      }
                    >
                      {currency(product.profit)}
                    </td>
                    <td>{percent(product.margin)}</td>
                    <td>
                      <span
                        className={`stock-status ${statusFor(product).className}`}
                      >
                        <i />
                        {statusFor(product).text}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => onEdit(product)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          title="Delete product"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => onDelete(product)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Package size={22} />
            No products match your search.
          </div>
        )}
        <div className="pagination">
          <span>
            Showing {filtered.length ? pageIndex * pageSize + 1 : 0}–
            {Math.min((pageIndex + 1) * pageSize, filtered.length)} of{" "}
            {filtered.length} products
          </span>
          <div>
            <button
              aria-label="Previous page"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex(pageIndex - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              aria-label="Next page"
              disabled={(pageIndex + 1) * pageSize >= filtered.length}
              onClick={() => setPageIndex(pageIndex + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <div className="dashboard-footnote">
        <CircleHelp size={14} /> Profit estimates subtract COGS and recorded
        order-level costs. Missing expense data can change actual results.
      </div>
    </>
  );
}

function InventoryPage({ products, orders, dateRange, setDateRange }) {
  const days = dateRange === "Today" ? 1 : Number(dateRange);
  const inventory = products.map((product) => {
    const sold = orders
      .filter((order) => order.productId === product.id)
      .reduce((sum, order) => sum + order.quantity, 0);
    const stats = daysUntilStockout(product.stock, sold, days);
    return {
      ...product,
      sold,
      averageDailySales: stats.averageDailySales,
      daysRemaining: stats.daysRemaining,
    };
  });
  const low = inventory.filter((product) => product.stock <= product.minStock);
  return (
    <>
      <PageHeading
        eyebrow="OPERATIONS"
        title="Inventory"
        description="Stay ahead of stockouts and keep your best sellers available."
        actions={<DateSelect value={dateRange} onChange={setDateRange} />}
      />
      <div className="metrics-grid inventory-metrics">
        <MetricCard
          title="Units in stock"
          value={inventory
            .reduce((sum, product) => sum + product.stock, 0)
            .toLocaleString()}
          change={0}
          note="across all products"
          icon={Boxes}
          tone="blue"
        />
        <MetricCard
          title="Low stock"
          value={low.length}
          change={0}
          note="at or below threshold"
          icon={CircleAlert}
          tone="amber"
        />
        <MetricCard
          title="Out of stock"
          value={inventory.filter((product) => product.stock === 0).length}
          change={0}
          note="needs immediate attention"
          icon={Package}
          tone="red"
        />
        <MetricCard
          title="Inventory value"
          value={currency(
            inventory.reduce(
              (sum, product) => sum + product.stock * product.cogs,
              0,
            ),
            true,
          )}
          change={0}
          note="at cost of goods"
          icon={Wallet}
          tone="green"
        />
      </div>
      <section className="panel table-panel">
        <div className="panel-heading inventory-heading">
          <div>
            <h2>Stock health</h2>
            <p>Sales velocity estimated from the selected period</p>
          </div>
          <span className="small-tag">
            <Activity size={13} />{" "}
            {dateRange === "Today" ? "Today" : `Last ${dateRange} days`}
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table inventory-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>MARKETPLACE</th>
                <th>IN STOCK</th>
                <th>UNITS SOLD</th>
                <th>AVG. / DAY</th>
                <th>DAYS LEFT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      <div
                        className="product-swatch"
                        style={{ backgroundColor: product.color }}
                      >
                        <ShoppingBag size={15} />
                      </div>
                      <div>
                        <strong className="table-primary">
                          {product.name}
                        </strong>
                        <span className="table-sub">{product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <MarketplaceName name={product.marketplace} />
                  </td>
                  <td>
                    <strong>{product.stock}</strong>
                    <span className="table-sub">Min. {product.minStock}</span>
                  </td>
                  <td>{product.sold}</td>
                  <td>{product.averageDailySales.toFixed(1)}</td>
                  <td>
                    {product.daysRemaining === null ? (
                      <span className="muted-cell">No recent sales</span>
                    ) : (
                      <strong
                        className={
                          product.daysRemaining < 7 ? "negative-cell" : ""
                        }
                      >
                        {Math.ceil(product.daysRemaining)} days
                      </strong>
                    )}
                  </td>
                  <td>
                    <span
                      className={`stock-status ${statusFor(product).className}`}
                    >
                      <i />
                      {statusFor(product).text}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="inventory-note">
        <Truck size={16} />
        <span>
          Stockout estimates use units sold during the selected period divided
          by its number of days. They are directional, not a replenishment
          forecast.
        </span>
      </div>
    </>
  );
}

function AnalyticsPage({ products, orders, metrics, dateRange, setDateRange }) {
  const performance = productPerformance(products, orders).sort(
    (a, b) => b.profit - a.profit,
  );
  const channelMap = new Map();
  orders.forEach((order) => {
    const amount = orderFinancials(order);
    const current = channelMap.get(order.marketplace) ?? {
      marketplace: order.marketplace,
      revenue: 0,
      profit: 0,
      orders: 0,
    };
    current.revenue += amount.revenue;
    current.profit += amount.netProfit;
    current.orders += 1;
    channelMap.set(order.marketplace, current);
  });
  const channels = [...channelMap.values()];
  const colors = ["#6888d0", "#e3a051", "#62a587", "#a28ac9", "#d97b77"];
  return (
    <>
      <PageHeading
        eyebrow="BUSINESS INTELLIGENCE"
        title="Analytics"
        description="A clearer picture of your revenue, profit, and sales mix."
        actions={<DateSelect value={dateRange} onChange={setDateRange} />}
      />
      <div className="metrics-grid analytics-metrics">
        <MetricCard
          title="Revenue"
          value={currency(metrics.revenue, true)}
          change={0}
          note="selected period"
          icon={Wallet}
          tone="blue"
        />
        <MetricCard
          title="Gross profit"
          value={currency(
            orders.reduce(
              (sum, order) => sum + orderFinancials(order).grossProfit,
              0,
            ),
            true,
          )}
          change={0}
          note="before operating expenses"
          icon={TrendingUp}
          tone="green"
        />
        <MetricCard
          title="Net profit"
          value={currency(metrics.profit, true)}
          change={0}
          note="after recorded order costs"
          icon={Activity}
          tone="violet"
        />
        <MetricCard
          title="Average order value"
          value={currency(
            metrics.orders ? metrics.revenue / metrics.orders : 0,
          )}
          change={0}
          note={`${metrics.orders} orders`}
          icon={ShoppingBag}
          tone="amber"
        />
      </div>
      <div className="analytics-grid">
        <section className="panel analytics-chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Sales trend</h2>
              <p>Revenue and net profit over time</p>
            </div>
          </div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={makeChartData(orders)}
                margin={{ top: 8, right: 12, left: -14, bottom: 0 }}
              >
                <CartesianGrid stroke="#edf0f3" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a919c", fontSize: 11 }}
                  minTickGap={20}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a919c", fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#698bd6"
                  strokeWidth={2}
                  fill="#698bd622"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Net profit"
                  stroke="#54a987"
                  strokeWidth={2}
                  fill="#54a98722"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel channel-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue by marketplace</h2>
              <p>Based on recorded demo orders</p>
            </div>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={185}>
              <PieChart>
                <Pie
                  data={channels}
                  dataKey="revenue"
                  nameKey="marketplace"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="none"
                >
                  {channels.map((channel, index) => (
                    <Cell
                      key={channel.marketplace}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => preciseCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{currency(metrics.revenue, true)}</strong>
              <span>Total revenue</span>
            </div>
          </div>
          <div className="channel-legend">
            {channels.map((channel, index) => (
              <div key={channel.marketplace}>
                <span>
                  <i style={{ background: colors[index % colors.length] }} />
                  {channel.marketplace}
                </span>
                <strong>{currency(channel.revenue)}</strong>
                <small>
                  {metrics.revenue
                    ? ((channel.revenue / metrics.revenue) * 100).toFixed(0)
                    : 0}
                  %
                </small>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel table-panel analytics-products">
        <div className="panel-heading">
          <div>
            <h2>Product profitability</h2>
            <p>Net profit includes recorded product costs and order expenses</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>MARKETPLACE</th>
                <th>UNITS</th>
                <th>REVENUE</th>
                <th>GROSS PROFIT</th>
                <th>NET PROFIT</th>
                <th>MARGIN</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong className="table-primary">{product.name}</strong>
                  </td>
                  <td>
                    <MarketplaceName name={product.marketplace} />
                  </td>
                  <td>{product.units}</td>
                  <td className="money-cell">{currency(product.revenue)}</td>
                  <td>
                    {currency(
                      orders
                        .filter((order) => order.productId === product.id)
                        .reduce(
                          (sum, order) =>
                            sum + orderFinancials(order).grossProfit,
                          0,
                        ),
                    )}
                  </td>
                  <td className="money-cell">{currency(product.profit)}</td>
                  <td>{percent(product.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="dashboard-footnote">
        <CircleHelp size={14} /> Marketplaces are demo samples and may not
        represent connected store data. Compare costs only when inputs are
        complete and consistent.
      </div>
    </>
  );
}

function ReturnsPage({ returns, orders }) {
  const refundTotal = returns.reduce((sum, entry) => sum + entry.amount, 0);
  const rate = calculateReturnRate(returns.length, orders.length);
  const productReturns = Object.values(
    returns.reduce((group, entry) => {
      group[entry.productName] = group[entry.productName] ?? {
        name: entry.productName,
        count: 0,
        refund: 0,
      };
      group[entry.productName].count += 1;
      group[entry.productName].refund += entry.amount;
      return group;
    }, {}),
  ).sort((a, b) => b.count - a.count);
  return (
    <>
      <PageHeading
        eyebrow="CUSTOMER EXPERIENCE"
        title="Returns & refunds"
        description="Understand return volume and the impact of refunds on profit."
        actions={
          <span className="small-tag">
            <RotateCcw size={13} /> Demo records
          </span>
        }
      />
      <div className="metrics-grid">
        <MetricCard
          title="Returned orders"
          value={returns.length}
          change={0}
          note="in sample dataset"
          icon={RotateCcw}
          tone="amber"
        />
        <MetricCard
          title="Refunded amount"
          value={currency(refundTotal)}
          change={0}
          note="actual recorded refunds"
          icon={Wallet}
          tone="red"
        />
        <MetricCard
          title="Return rate"
          value={percent(rate)}
          change={0}
          note="returned / all demo orders"
          icon={Activity}
          tone="violet"
        />
        <MetricCard
          title="Estimated profit impact"
          value={currency(refundTotal, true)}
          change={0}
          note="refund amount only"
          icon={TrendingDown}
          tone="red"
        />
      </div>
      <div className="returns-grid">
        <section className="panel return-products">
          <div className="panel-heading">
            <div>
              <h2>Products with most returns</h2>
              <p>Ranked by number of returned orders</p>
            </div>
          </div>
          {productReturns.length ? (
            productReturns.slice(0, 5).map((item, index) => (
              <div className="return-product-row" key={item.name}>
                <span className="return-rank">{index + 1}</span>
                <strong>{item.name}</strong>
                <span>{item.count} returns</span>
                <b>{currency(item.refund)}</b>
              </div>
            ))
          ) : (
            <div className="empty-state">No returned orders recorded.</div>
          )}
        </section>
        <section className="panel return-note">
          <div className="note-icon">
            <CircleHelp size={18} />
          </div>
          <h3>Refunds vs. profit impact</h3>
          <p>
            The refunded amount shown here is the amount recorded on returned
            demo orders. Estimated profit impact can also include product costs,
            fees, and shipping that may not be recovered; those recovery details
            are not yet tracked.
          </p>
          <div className="note-source">
            Data quality note <span>Costs on returns may be incomplete</span>
          </div>
        </section>
      </div>
      <section className="panel table-panel returns-table">
        <div className="panel-heading">
          <div>
            <h2>Return activity</h2>
            <p>{returns.length} recorded refund events</p>
          </div>
        </div>
        {returns.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>PRODUCT</th>
                  <th>MARKETPLACE</th>
                  <th>RETURN DATE</th>
                  <th>REASON</th>
                  <th>REFUND</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {returns
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((item) => (
                    <tr key={item.id}>
                      <td className="order-id">{item.orderId.toUpperCase()}</td>
                      <td>
                        <strong className="table-primary">
                          {item.productName}
                        </strong>
                      </td>
                      <td>
                        <MarketplaceName name={item.marketplace} />
                      </td>
                      <td className="muted-cell">{dateLabel(item.date)}</td>
                      <td>{item.reason}</td>
                      <td className="negative-cell">
                        {preciseCurrency(item.amount)}
                      </td>
                      <td>
                        <span className="order-status status-green">
                          <i />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No return data yet.</div>
        )}
      </section>
    </>
  );
}

function AdvisorPage({ products }) {
  const suggestions = [
    "Which products generated the most profit?",
    "Which products might run out soon?",
    "Which products have the lowest margins?",
  ];
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  async function ask(value = question) {
    if (!value.trim() || sending) return;
    setQuestion("");
    setMessages((items) => [...items, { role: "user", text: value }]);
    setSending(true);
    try {
      const response = await apiFetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Advisor request failed.");
      setMessages((items) => [
        ...items,
        { role: "assistant", text: result.answer, source: result.source },
      ]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        { role: "assistant", text: error.message, source: "Request error" },
      ]);
    } finally {
      setSending(false);
    }
  }
  const restock = products.filter(
    (product) => product.stock <= product.minStock,
  );
  return (
    <>
      <PageHeading
        eyebrow="BUSINESS ASSISTANT"
        title="AI Profit Advisor"
        description="Ask practical questions and get answers grounded in your recorded business data."
        actions={
          <span className="small-tag">
            <Sparkles size={13} /> Demo data context
          </span>
        }
      />
      <div className="advisor-layout">
        <section className="panel advisor-chat">
          <div className="chat-header">
            <div className="advisor-avatar">
              <BrainCircuit size={18} />
            </div>
            <div>
              <strong>Marginly advisor</strong>
              <span>
                <i /> Data-connected · Demo mode
              </span>
            </div>
            <button className="small-tag" onClick={() => setMessages([])}>
              Clear chat
            </button>
          </div>
          <div className="chat-body">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="welcome-icon">
                  <Sparkles size={20} />
                </div>
                <h2>What would you like to know?</h2>
                <p>
                  I'll use your sample orders, product costs, and inventory to
                  answer.
                </p>
                <div className="suggestion-list">
                  {suggestions.map((item) => (
                    <button key={item} onClick={() => ask(item)}>
                      {item}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div
                    className={`chat-message ${message.role}`}
                    key={`${index}-${message.role}`}
                  >
                    <div className="message-avatar">
                      {message.role === "assistant" ? (
                        <Sparkles size={14} />
                      ) : (
                        "JD"
                      )}
                    </div>
                    <div className="message-content">
                      <p>{message.text}</p>
                      {message.source && <span>{message.source}</span>}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="chat-message assistant">
                    <div className="message-avatar">
                      <Sparkles size={14} />
                    </div>
                    <div className="typing-indicator">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your business..."
              maxLength={500}
            />
            <button
              className="button button-primary"
              disabled={sending || !question.trim()}
            >
              <ArrowRight size={16} />
              <span>Ask</span>
            </button>
          </form>
          <div className="chat-disclaimer">
            Rule-based answers from demo business data. No external AI service
            is connected.
          </div>
        </section>
        <aside className="advisor-side">
          <section className="panel advisor-tip">
            <div className="panel-heading">
              <div>
                <div className="title-with-icon">
                  <Sparkles size={15} className="tip-spark" />
                  <h2>Needs attention</h2>
                </div>
                <p>Based on product thresholds</p>
              </div>
            </div>
            {restock.length ? (
              restock.map((product) => (
                <div className="attention-item" key={product.id}>
                  <span className="attention-dot" />
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {product.stock} left · threshold {product.minStock}
                    </p>
                  </div>
                  <span className="attention-status">Restock</span>
                </div>
              ))
            ) : (
              <div className="all-clear">
                <CircleCheck size={17} /> All products are above their minimum
                stock levels.
              </div>
            )}
          </section>
          <section className="advisor-limits">
            <CircleHelp size={16} />
            <div>
              <strong>Grounded in your data</strong>
              <p>
                Recommendations use recorded orders and product details only.
                Marketplace feeds and forecasting are not connected in this
                demo.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function IntegrationsPage({ connections }) {
  const descriptions = {
    Amazon: "Bring Amazon orders and product performance into one clear view.",
    Shopify:
      "Review direct store sales and inventory alongside other channels.",
    Etsy: "Understand how your handmade marketplace sales are performing.",
  };
  return (
    <>
      <PageHeading
        eyebrow="CONNECTED STORES"
        title="Integrations"
        description="Connect marketplace data or explore the included sample workspace."
        actions={
          <span className="small-tag">
            <CircleHelp size={13} /> Demo connections only
          </span>
        }
      />
      <div className="integration-callout">
        <div className="callout-icon">
          <CircleHelp size={17} />
        </div>
        <div>
          <strong>Sync adapters not activated</strong>
          <p>
            Tokens can be stored securely above. Live orders require a verified
            provider API adapter and a successful sync.
          </p>
        </div>
      </div>
      <div className="integration-grid">
        {connections.map((connection) => (
          <section
            className="panel integration-card"
            key={connection.marketplace}
          >
            <div
              className={`marketplace-logo logo-${connection.marketplace.toLowerCase()}`}
            >
              {connection.marketplace === "Amazon"
                ? "a"
                : connection.marketplace === "Shopify"
                  ? "S"
                  : "E"}
            </div>
            <div className="integration-title">
              <div>
                <h2>{connection.marketplace}</h2>
                <span className="demo-connection">
                  <i />
                  {connection.status}
                </span>
              </div>
              <MoreHorizontal size={18} className="muted-icon" />
            </div>
            <p>{descriptions[connection.marketplace]}</p>
            <div className="integration-meta">
              <span>Sync status</span>
              <strong>Not connected</strong>
            </div>
            <div className="integration-meta">
              <span>Last sync</span>
              <strong>—</strong>
            </div>
            <button
              className="button button-secondary integration-disabled"
              disabled
              title="Marketplace OAuth is not implemented"
            >
              <Plus size={15} /> Requires API adapter
            </button>
          </section>
        ))}
      </div>
      <section className="panel integration-import">
        <div className="import-icon">
          <FileUp size={18} />
        </div>
        <div>
          <h3>Have a CSV export?</h3>
          <p>
            Import products from a spreadsheet to work with your own catalog
            data.
          </p>
        </div>
        <span>CSV product import available on Products</span>
      </section>
    </>
  );
}

function SettingsPage({ data, resetDemo, onSave }) {
  const [businessName, setBusinessName] = useState(data.business.name);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  async function saveSettings(event) {
    event.preventDefault();
    if (businessName.trim().length < 2) return;
    setSaveError("");
    try {
      await onSave({ ...data.business, name: businessName.trim() });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaveError(error.message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="PREFERENCES"
        title="Settings"
        description="Manage your workspace preferences and demo data."
      />
      <div className="settings-layout">
        <div className="settings-nav">
          <button className="settings-nav-active">
            <Store size={15} /> Business profile
          </button>
          <button disabled>
            <Wallet size={15} /> Business expenses <span>Coming soon</span>
          </button>
          <button disabled>
            <Bell size={15} /> Notifications <span>Coming soon</span>
          </button>
          <button disabled>
            <Activity size={15} /> Security <span>Coming soon</span>
          </button>
        </div>
        <div className="settings-panels">
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h2>Business profile</h2>
                <p>Basic details for your Marginly workspace.</p>
              </div>
            </div>
            <form onSubmit={saveSettings}>
              <label className="form-field">
                <span>Business name</span>
                <input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
              <label className="form-field">
                <span>Currency</span>
                <select value={data.business.currency} disabled>
                  <option>USD — US Dollar</option>
                </select>
                <small>Currency selection is read-only in this demo.</small>
              </label>
              <label className="form-field">
                <span>Time zone</span>
                <select value={data.business.timezone} disabled>
                  <option value="America/New_York">
                    Eastern Time (US &amp; Canada)
                  </option>
                </select>
                <small>Time zone selection is read-only in this demo.</small>
              </label>
              {saveError && (
                <div className="form-error">
                  <CircleAlert size={15} />
                  {saveError}
                </div>
              )}
              <div className="form-footer">
                <span>
                  {saved ? (
                    <span className="save-confirm">
                      <Check size={14} /> Saved
                    </span>
                  ) : (
                    "Changes apply to this demo workspace."
                  )}
                </span>
                <button className="button button-primary">Save changes</button>
              </div>
            </form>
          </section>
          <section className="panel settings-panel reset-panel">
            <div>
              <div className="reset-icon">
                <RotateCcw size={17} />
              </div>
              <div>
                <h2>Reset demo workspace</h2>
                <p>
                  Restore the original sample products and 90 days of sample
                  orders. This removes any products you added or edited.
                </p>
              </div>
            </div>
            <button
              className="button button-secondary"
              disabled={!data.demoMode}
              onClick={resetDemo}
            >
              Reset demo data
            </button>
          </section>
          <div className="settings-note">
            <CircleHelp size={15} /> User authentication and tenant isolation
            are active. Password changes and editable business expenses are not
            yet available.
          </div>
        </div>
      </div>
    </>
  );
}

function ProductModal({
  mode,
  product,
  products,
  onClose,
  onSave,
  onImportComplete,
}) {
  const [form, setForm] = useState(
    product
      ? { ...product }
      : {
          name: "",
          sku: "",
          marketplace: "Uzum Market",
          category: "",
          price: "",
          cogs: "",
          stock: "",
          minStock: "",
        },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const isEdit = mode === "edit";
  const isImport = mode === "import";
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form, isEdit);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }
  function parseCsv(file) {
    setError("");
    setImportErrors([]);
    setCsvPreview([]);
    if (!file || !file.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a .csv file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("CSV file must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result)
        .split(/\r?\n/)
        .filter((line) => line.trim());
      if (lines.length < 2) {
        setError("CSV needs a header row and at least one product.");
        return;
      }
      const headers = lines[0]
        .split(",")
        .map((header) => header.trim().toLowerCase());
      const required = [
        "name",
        "sku",
        "marketplace",
        "category",
        "price",
        "cogs",
        "stock",
        "minstock",
      ];
      const missing = required.filter((header) => !headers.includes(header));
      if (missing.length) {
        setError(`Missing columns: ${missing.join(", ")}.`);
        return;
      }
      const records = [];
      const issues = [];
      lines.slice(1).forEach((line, index) => {
        const values = line.split(",").map((value) => value.trim());
        const row = Object.fromEntries(
          headers.map((header, i) => [header, values[i] ?? ""]),
        );
        const item = {
          name: row.name,
          sku: row.sku,
          marketplace: row.marketplace,
          category: row.category,
          price: Number(row.price),
          cogs: Number(row.cogs),
          stock: Number(row.stock),
          minStock: Number(row.minstock),
        };
        const duplicate =
          products.some(
            (product) => product.sku.toLowerCase() === item.sku.toLowerCase(),
          ) ||
          records.some(
            (existing) => existing.sku.toLowerCase() === item.sku.toLowerCase(),
          );
        if (
          !item.name ||
          !item.sku ||
          !item.category ||
          ![
            "Amazon",
            "Shopify",
            "Etsy",
            "Uzum Market",
            "Wildberries",
            "Ozon",
          ].includes(item.marketplace) ||
          !Number.isFinite(item.price) ||
          item.price <= 0 ||
          !Number.isFinite(item.cogs) ||
          item.cogs < 0 ||
          !Number.isInteger(item.stock) ||
          item.stock < 0 ||
          !Number.isInteger(item.minStock) ||
          item.minStock < 0 ||
          duplicate
        ) {
          issues.push(
            `Row ${index + 2}: invalid data, unsupported marketplace, or duplicate SKU.`,
          );
        } else records.push(item);
      });
      setCsvPreview(records);
      setImportErrors(issues);
      if (!records.length && issues.length)
        setError("No valid rows to import. Check the errors below.");
    };
    reader.onerror = () => setError("Could not read the selected file.");
    reader.readAsText(file);
  }
  if (isImport)
    return (
      <div
        className="modal-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section
          className="modal csv-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-heading">
            <div>
              <h2 id="modal-title">Import products</h2>
              <p>Upload a CSV and review valid rows before adding them.</p>
            </div>
            <button
              className="icon-button"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
          <div className="csv-instructions">
            <strong>Required columns</strong>
            <code>
              name, sku, marketplace, category, price, cogs, stock, minStock
            </code>
            <span>
              Use Amazon, Shopify, or Etsy. Values should be comma-separated.
              Quoted fields are not supported.
            </span>
          </div>
          <label className="upload-zone">
            <FileUp size={20} />
            <span>
              <strong>Choose a CSV file</strong> or drop it here
            </span>
            <small>Maximum 2 MB</small>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => parseCsv(event.target.files?.[0])}
            />
          </label>
          {error && (
            <div className="form-error">
              <CircleAlert size={15} />
              {error}
            </div>
          )}
          {importErrors.length > 0 && (
            <div className="csv-errors">
              {importErrors.slice(0, 5).map((item) => (
                <p key={item}>{item}</p>
              ))}
              {importErrors.length > 5 && (
                <p>...and {importErrors.length - 5} more row errors</p>
              )}
            </div>
          )}
          {csvPreview.length > 0 && (
            <div className="csv-preview">
              <strong>
                Preview — {csvPreview.length} valid product
                {csvPreview.length === 1 ? "" : "s"}
              </strong>
              <div>
                {csvPreview.slice(0, 4).map((item) => (
                  <span key={item.sku}>
                    {item.name} · {item.sku}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="modal-footer">
            <button className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={!csvPreview.length || saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onImportComplete(csvPreview);
                } catch (importError) {
                  setError(importError.message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving
                ? "Importing..."
                : `Import ${csvPreview.length || ""} products`}
            </button>
          </div>
        </section>
      </div>
    );
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <div>
            <h2 id="modal-title">
              {isEdit ? "Edit product" : "Add a product"}
            </h2>
            <p>Keep your catalog and cost data up to date.</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="form-field span-two">
              <span>Product name</span>
              <input
                autoFocus
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                minLength={2}
                maxLength={100}
                required
                placeholder="e.g. Wireless Earbuds"
              />
            </label>
            <label className="form-field">
              <span>SKU</span>
              <input
                value={form.sku}
                onChange={(event) =>
                  setForm({ ...form, sku: event.target.value })
                }
                minLength={2}
                maxLength={40}
                required
                placeholder="AUD-1042"
              />
            </label>
            <label className="form-field">
              <span>Marketplace</span>
              <select
                value={form.marketplace}
                onChange={(event) =>
                  setForm({ ...form, marketplace: event.target.value })
                }
              >
                <option>Amazon</option>
                <option>Shopify</option>
                <option>Etsy</option>
                <option>Uzum Market</option>
                <option>Wildberries</option>
                <option>Ozon</option>
              </select>
            </label>
            <label className="form-field span-two">
              <span>Category</span>
              <input
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                required
                placeholder="e.g. Electronics"
              />
            </label>
            <label className="form-field">
              <span>Selling price ($)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Unit cost / COGS ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cogs}
                onChange={(event) =>
                  setForm({ ...form, cogs: event.target.value })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Current stock</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) =>
                  setForm({ ...form, stock: event.target.value })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Minimum stock</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.minStock}
                onChange={(event) =>
                  setForm({ ...form, minStock: event.target.value })
                }
                required
              />
            </label>
          </div>
          {error && (
            <div className="form-error">
              <CircleAlert size={15} />
              {error}
            </div>
          )}
          <div className="modal-footer">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
