"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  Search,
  Bell,
  TrendingUp,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  Briefcase,
  LayoutDashboard,
  Star,
  BrainCircuit,
  MessageSquare,
  History,
  Trophy,
  GraduationCap,
  User,
  LogOut,
  ChevronRight,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────
// DATA HOOKS
// ────────────────────────────────────────────────────────────
const usePortfolio = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      const resp = await fetch("/api/portfolio/summary");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setData(json);
    } catch (e) {
      console.error("Portfolio fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  return { portfolio: data, loading, refresh: fetchPortfolio };
};

const useHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const fetchHistory = async () => {
    try {
      const resp = await fetch("/api/transactions?limit=10");
      if (!resp.ok) return;
      const json = await resp.json();
      if (Array.isArray(json)) setHistory(json);
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    fetchHistory();
  }, []);
  return { history, refresh: fetchHistory };
};

// ────────────────────────────────────────────────────────────
// CHART COMPONENT
// ────────────────────────────────────────────────────────────
const CandlestickChart = ({ data }: { data: any[] }) => {
  const W = 700,
    H = 220;
  const PAD = { top: 10, right: 10, bottom: 20, left: 0 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        Loading market data...
      </div>
    );
  }

  const allPrices = data.flatMap((c) => [c.high, c.low]);
  const minP = Math.min(...allPrices) * 0.9995;
  const maxP = Math.max(...allPrices) * 1.0005;
  const range = maxP - minP || 1;

  const toY = (p: number) => PAD.top + ((maxP - p) / range) * chartH;
  const candleW = chartW / data.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={PAD.left}
          y1={PAD.top + t * chartH}
          x2={W - PAD.right}
          y2={PAD.top + t * chartH}
          stroke="var(--border)"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
      ))}
      {/* Candles */}
      {data.map((c, i) => {
        const x = PAD.left + i * candleW + candleW / 2;
        const isUp = c.close >= c.open;
        const color = isUp ? "var(--accent)" : "var(--destructive)";
        return (
          <g key={i}>
            <line
              x1={x}
              y1={toY(c.high)}
              x2={x}
              y2={toY(c.low)}
              stroke={color}
              strokeWidth="1"
              opacity="0.6"
            />
            <rect
              x={x - candleW * 0.3}
              y={toY(Math.max(c.open, c.close))}
              width={candleW * 0.6}
              height={Math.max(1, Math.abs(toY(c.open) - toY(c.close)))}
              fill={color}
              opacity="0.9"
              rx="1"
            />
          </g>
        );
      })}
      {/* Current price label */}
      <rect
        x={W - 70}
        y={toY(data[data.length - 1].close) - 10}
        width={60}
        height={20}
        rx="4"
        fill="var(--accent)"
      />
      <text
        x={W - 40}
        y={toY(data[data.length - 1].close) + 4}
        fill="var(--accent-foreground)"
        fontSize="10"
        textAnchor="middle"
        fontWeight="600"
      >
        {data[data.length - 1].close.toFixed(2)}
      </text>
    </svg>
  );
};

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
const fmt = (n: number | undefined | null) =>
  n != null
    ? n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "---";

// ────────────────────────────────────────────────────────────
// PORTFOLIO CARD
// ────────────────────────────────────────────────────────────
const PortfolioCard = ({
  portfolio,
  loading,
}: {
  portfolio: any;
  loading: boolean;
}) => (
  <div className="bg-card border border-border rounded-xl p-5 h-full flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Portfolio Value
      </h3>
      <Activity size={16} className="text-muted-foreground" />
    </div>

    <div className="mb-4">
      <p className="text-3xl font-semibold tracking-tight text-foreground">
        {loading ? (
          <span className="animate-pulse">---</span>
        ) : (
          `$${fmt(portfolio?.totalValue)}`
        )}
      </p>
      <div
        className={cn(
          "inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-md text-xs font-medium",
          (portfolio?.totalGainLoss ?? 0) >= 0
            ? "bg-accent/10 text-accent"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {(portfolio?.totalGainLoss ?? 0) >= 0 ? (
          <ArrowUpRight size={14} />
        ) : (
          <ArrowDownRight size={14} />
        )}
        {portfolio?.totalGainLossPct?.toFixed(2) ?? "0.00"}% all time
      </div>
    </div>

    <div className="flex-1 space-y-3">
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cash</span>
        </div>
        <span className="text-sm font-medium font-mono text-foreground">
          ${fmt(portfolio?.cashBalance)}
        </span>
      </div>
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Holdings</span>
        </div>
        <span className="text-sm font-medium font-mono text-foreground">
          ${fmt(portfolio?.holdingsValue)}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
      <div className="text-center p-3 bg-secondary/30 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
        <p className="text-lg font-semibold text-accent">
          {portfolio?.winRate ?? 0}%
        </p>
      </div>
      <div className="text-center p-3 bg-secondary/30 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Total Trades</p>
        <p className="text-lg font-semibold text-foreground">
          {portfolio?.totalTrades ?? 0}
        </p>
      </div>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
// TRADING PANEL
// ────────────────────────────────────────────────────────────
const TradingPanel = ({
  ticker,
  exchange,
  refreshPortfolio,
}: {
  ticker: string;
  exchange: string;
  refreshPortfolio: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<"chart" | "history">("chart");
  const [candles, setCandles] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [amount, setAmount] = useState("1");
  const [orderType, setOrderType] = useState<
    "MARKET" | "LIMIT" | "STOP_LOSS" | "TAKE_PROFIT" | "OCO" | "TRAILING_STOP"
  >("MARKET");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const { history, refresh: refreshHistory } = useHistory();

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const [cRes, qRes] = await Promise.all([
          fetch(`/api/stocks/candles?ticker=${ticker}`),
          fetch(`/api/stocks/quote?ticker=${ticker}&exchange=${exchange}`),
        ]);
        if (!cRes.ok || !qRes.ok) return;
        const [cData, qData] = await Promise.all([cRes.json(), qRes.json()]);
        setCandles(cData.candles || []);
        setQuote(qData);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMarket();
    const interval = setInterval(fetchMarket, 30000);
    return () => clearInterval(interval);
  }, [ticker, exchange]);

  const placeOrder = async (side: "BUY" | "SELL") => {
    setLoading(true);
    try {
      const resp = await fetch("/api/trading/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          exchange,
          type: orderType,
          side,
          shares: parseFloat(amount),
          price: targetPrice ? parseFloat(targetPrice) : undefined,
          stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        refreshPortfolio();
        refreshHistory();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Execution error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
            {exchange}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{ticker}</h3>
            <span
              className={cn(
                "text-sm font-medium",
                (quote?.change ?? 0) >= 0 ? "text-accent" : "text-destructive"
              )}
            >
              {quote?.price != null ? `$${fmt(quote.price)}` : "---"}{" "}
              {quote?.changePct != null ? `(${quote.changePct.toFixed(2)}%)` : ""}
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setActiveTab("chart")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "chart"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart2 size={14} />
            Chart
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === "history"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History size={14} />
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {activeTab === "chart" ? (
          <div className="absolute inset-0 p-4">
            <CandlestickChart data={candles} />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {history.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                No transactions yet
              </p>
            )}
            {history.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      tx.type === "BUY"
                        ? "bg-accent/10 text-accent"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {tx.type === "BUY" ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tx.ticker}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium text-foreground">
                    ${fmt(tx.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.shares} shares
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trading Controls */}
      <div className="p-4 border-t border-border bg-secondary/30">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e: any) => setOrderType(e.target.value)}
              className="w-full bg-card text-sm text-foreground p-2.5 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
              <option value="STOP_LOSS">Stop Loss</option>
              <option value="TAKE_PROFIT">Take Profit</option>
              <option value="OCO">OCO</option>
              <option value="TRAILING_STOP">Trailing Stop</option>
            </select>
          </div>

          {(orderType === "LIMIT" ||
            orderType === "TAKE_PROFIT" ||
            orderType === "OCO" ||
            orderType === "TRAILING_STOP") && (
            <div className="flex-1 min-w-[100px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">
                {orderType === "TRAILING_STOP" ? "Distance ($)" : "Target Price"}
              </label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={quote?.price?.toString()}
                className="w-full bg-card text-sm text-foreground p-2.5 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {(orderType === "STOP_LOSS" || orderType === "OCO") && (
            <div className="flex-1 min-w-[100px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Stop Price
              </label>
              <input
                type="number"
                step="0.01"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="w-full bg-card text-sm text-foreground p-2.5 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Briefcase size={14} className="text-muted-foreground" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-sm font-medium text-foreground outline-none w-16"
              placeholder="Qty"
            />
          </div>
          <button
            onClick={() => placeOrder("BUY")}
            disabled={loading}
            className="flex-1 h-10 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Buy"}
          </button>
          <button
            onClick={() => placeOrder("SELL")}
            disabled={loading}
            className="flex-1 h-10 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Sell"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// NAV CONFIG
// ────────────────────────────────────────────────────────────
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: TrendingUp },
  { label: "Watchlist", href: "/watchlist", icon: Star },
  { label: "Analysis", href: "/analysis", icon: BrainCircuit },
  { label: "AI Mentor", href: "/mentor", icon: MessageSquare },
  { label: "Transactions", href: "/transactions", icon: History },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Learn", href: "/learn", icon: GraduationCap },
  { label: "Profile", href: "/profile", icon: User },
];

const markets = [
  { ticker: "BTCUSDT", exchange: "BINANCE", name: "Bitcoin", symbol: "BTC" },
  { ticker: "AAPL", exchange: "NYSE", name: "Apple", symbol: "AAPL" },
  { ticker: "TSLA", exchange: "NASDAQ", name: "Tesla", symbol: "TSLA" },
  { ticker: "EURUSD", exchange: "FOREX", name: "Euro/USD", symbol: "EUR" },
  { ticker: "XAUUSD", exchange: "FOREX", name: "Gold", symbol: "XAU" },
];

// ────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ────────────────────────────────────────────────────────────
export default function PremiumDashboard() {
  const [ticker, setTicker] = useState("AAPL");
  const [exchange, setExchange] = useState("NYSE");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { portfolio, loading, refresh } = usePortfolio();
  const { currentUser, logout } = useAuth();

  const email = currentUser?.email ?? "";
  const displayName = currentUser?.fullName ?? email;
  const initials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const filteredMarkets = markets.filter(
    (m) =>
      m.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 flex bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground">
              W
            </div>
            <span className="font-semibold text-foreground">Welloh</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <div className="px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  item.href === "/dashboard"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Quick Markets */}
          <div className="mt-6 px-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Quick Trade
            </p>
            <div className="space-y-1">
              {markets.map((m) => (
                <button
                  key={m.ticker}
                  onClick={() => {
                    setTicker(m.ticker);
                    setExchange(m.exchange);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    ticker === m.ticker
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold">
                    {m.symbol.slice(0, 2)}
                  </span>
                  <div>
                    <p className="leading-none">{m.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.exchange}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName}
              </p>
              {email && email !== displayName && (
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Trading</span>
              <ChevronRight size={14} className="text-muted-foreground" />
              <span className="font-medium text-foreground">
                {exchange} / {ticker}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <Search size={16} className="text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                  className="bg-transparent text-sm text-foreground outline-none w-48 placeholder:text-muted-foreground"
                  placeholder="Search markets..."
                />
              </div>
              {isSearchOpen && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  {filteredMarkets.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No results
                    </p>
                  )}
                  {filteredMarkets.map((m) => (
                    <button
                      key={m.ticker}
                      onMouseDown={() => {
                        setTicker(m.ticker);
                        setExchange(m.exchange);
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center gap-3 transition-colors border-b border-border last:border-0"
                    >
                      <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold">
                        {m.symbol.slice(0, 2)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {m.ticker}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 mb-6">
            <PortfolioCard portfolio={portfolio} loading={loading} />
            <div className="min-h-[480px]">
              <TradingPanel
                ticker={ticker}
                exchange={exchange}
                refreshPortfolio={refresh}
              />
            </div>
          </div>

          {/* Market Grid */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Market Overview
              </h3>
              <Activity size={16} className="text-muted-foreground" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {markets.map((m) => (
                <button
                  key={m.ticker}
                  onClick={() => {
                    setTicker(m.ticker);
                    setExchange(m.exchange);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border transition-all text-left",
                    ticker === m.ticker
                      ? "bg-primary/5 border-primary/30"
                      : "bg-secondary/30 border-border hover:border-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold",
                      ticker === m.ticker
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {m.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.exchange}</p>
                    <p className="text-sm font-medium text-foreground">
                      {m.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
