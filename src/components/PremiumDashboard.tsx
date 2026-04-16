"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Search, Bell,
  TrendingUp, BarChart2,
  ArrowUpRight, ArrowDownRight, Activity,
  Clock, Wallet, Briefcase, ChevronRight,
  LayoutDashboard, Star, BrainCircuit, MessageSquare,
  History, Trophy, GraduationCap, User, LogOut
} from 'lucide-react';

// ────────────────────────────────────────────────────────────
// DYNAMIC HOOKS
// ────────────────────────────────────────────────────────────
const usePortfolio = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      const resp = await fetch('/api/portfolio/summary');
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
      const resp = await fetch('/api/transactions?limit=10');
      if (!resp.ok) return;
      const json = await resp.json();
      if (Array.isArray(json)) setHistory(json);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchHistory(); }, []);
  return { history, refresh: fetchHistory };
};

// ────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ────────────────────────────────────────────────────────────
const CandlestickChart = ({ data }: { data: any[] }) => {
  const W = 700, H = 260;
  const PAD = { top: 10, right: 10, bottom: 24, left: 0 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  if (!data || data.length === 0) return <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] animate-pulse">SYNCING WITH MARKET FEEDS...</div>;

  const allPrices = data.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices) * 0.9995;
  const maxP = Math.max(...allPrices) * 1.0005;
  const range = (maxP - minP) || 1;

  const toY = (p: number) => PAD.top + ((maxP - p) / range) * chartH;
  const candleW = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={PAD.left} y1={PAD.top + t * chartH} x2={W - PAD.right} y2={PAD.top + t * chartH} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}
      {data.map((c, i) => {
        const x = PAD.left + i * candleW + candleW / 2;
        const color = c.close >= c.open ? '#00F5A0' : '#FF4D4D';
        return (
          <g key={i}>
            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1" opacity="0.6" />
            <rect x={x - candleW * 0.3} y={toY(Math.max(c.open, c.close))} width={candleW * 0.6} height={Math.max(1, Math.abs(toY(c.open) - toY(c.close)))} fill={color} opacity="0.8" rx="1" />
          </g>
        );
      })}
      <rect x={W - 75} y={toY(data[data.length - 1].close) - 10} width={75} height={20} rx="4" fill="#00F5A0" />
      <text x={W - 37} y={toY(data[data.length - 1].close) + 4} fill="#000" fontSize="9" textAnchor="middle" fontWeight="900">
        {data[data.length - 1].close.toFixed(2)}
      </text>
    </svg>
  );
};

// ────────────────────────────────────────────────────────────
// MAIN PANELS
// ────────────────────────────────────────────────────────────
const fmt = (n: number | undefined | null) =>
  n != null ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

const PortfolioSummary = ({ portfolio, loading }: { portfolio: any, loading: boolean }) => (
  <div className="welloh-card flex flex-col h-full overflow-hidden border-cyan-500/20">
    <div className="p-6">
      <p className="welloh-label text-cyan-500/80 mb-1">Portfolio Value</p>
      <h2 className="welloh-value-xl mb-2">
        {loading ? <span className="animate-pulse">---</span> : `$${fmt(portfolio?.totalValue)}`}
      </h2>
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ${(portfolio?.totalGainLoss ?? 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {(portfolio?.totalGainLoss ?? 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {portfolio?.totalGainLossPct?.toFixed(2) ?? '0.00'}% ALL TIME
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar">
      <div>
        <span className="welloh-label text-[9px] opacity-40 block mb-3">Capitals</span>
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2"><Wallet size={12} className="text-slate-500" /> <span className="text-[11px] text-slate-400 uppercase font-black">Cash</span></div>
            <span className="text-white text-xs font-bold font-mono">${fmt(portfolio?.cashBalance)}</span>
          </div>
          <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2"><Briefcase size={12} className="text-slate-500" /> <span className="text-[11px] text-slate-400 uppercase font-black">Holdings</span></div>
            <span className="text-white text-xs font-bold font-mono">${fmt(portfolio?.holdingsValue)}</span>
          </div>
        </div>
      </div>

      <div>
        <span className="welloh-label text-[9px] opacity-40 block mb-3">Statistics</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Win Rate</p>
            <p className="welloh-green text-sm font-black">{portfolio?.winRate ?? 0}%</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Trades</p>
            <p className="text-white text-sm font-black">{portfolio?.totalTrades ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TradingConsole = ({ ticker, exchange, refreshPortfolio }: { ticker: string, exchange: string, refreshPortfolio: () => void }) => {
  const [activeTab, setActiveTab] = useState('chart');
  const [candles, setCandles] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [amount, setAmount] = useState('1');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'OCO' | 'TRAILING_STOP'>('MARKET');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const { history, refresh: refreshHistory } = useHistory();

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const [cRes, qRes] = await Promise.all([
          fetch(`/api/stocks/candles?ticker=${ticker}`),
          fetch(`/api/stocks/quote?ticker=${ticker}&exchange=${exchange}`)
        ]);
        if (!cRes.ok || !qRes.ok) return;
        const [cData, qData] = await Promise.all([cRes.json(), qRes.json()]);
        setCandles(cData.candles || []);
        setQuote(qData);
      } catch (e) { console.error(e); }
    };
    fetchMarket();
    const interval = setInterval(fetchMarket, 30000);
    return () => clearInterval(interval);
  }, [ticker, exchange]);

  const placeOrder = async (side: 'BUY' | 'SELL') => {
    setLoading(true);
    try {
      const resp = await fetch('/api/trading/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          exchange,
          type: orderType,
          side,
          shares: parseFloat(amount),
          price: targetPrice ? parseFloat(targetPrice) : undefined,
          stopPrice: stopPrice ? parseFloat(stopPrice) : undefined
        })
      });
      const data = await resp.json();
      if (data.success) {
        refreshPortfolio();
        refreshHistory();
      } else { alert(data.error); }
    } catch (e) { alert("Execution error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="welloh-card flex flex-col h-full overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-4">
          <div className="welloh-exchange-badge">{exchange}</div>
          <div className="flex flex-col">
            <h3 className="text-white font-black text-lg tracking-tighter uppercase leading-none">{ticker}</h3>
            <span className={`text-[10px] font-black mt-1 ${(quote?.change ?? 0) >= 0 ? 'welloh-green' : 'text-red-500'}`}>
              {quote?.price != null ? `$${fmt(quote.price)}` : '—'} {quote?.changePct != null ? `(${quote.changePct.toFixed(2)}%)` : ''}
            </span>
          </div>
        </div>
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {[
            { id: 'chart', icon: BarChart2, label: 'Analysis' },
            { id: 'history', icon: Clock, label: 'Logs' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === t.id ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}>
              <t.icon size={12} /> {t.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative min-h-0">
        {activeTab === 'chart' ? (
          <div className="absolute inset-0 p-6 bg-black/[0.15]">
            <CandlestickChart data={candles} />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto px-6 py-4 space-y-2 custom-scrollbar">
            {history.length === 0 && <p className="text-slate-500 text-xs text-center mt-8">No transactions yet.</p>}
            {history.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tx.type === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold leading-none">{tx.ticker}</p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-black">{new Date(tx.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs font-mono font-black">${fmt(tx.price)}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{tx.shares} SHARES</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trading Execution Bar */}
      <div className="p-6 bg-black/20 border-t border-white/5 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col flex-1 min-w-[120px]">
             <span className="text-[10px] uppercase font-black text-slate-500 mb-1">Order Type</span>
             <select
                value={orderType}
                onChange={(e: any) => setOrderType(e.target.value)}
                className="bg-white/5 text-[11px] font-black text-white p-2.5 rounded-xl border border-white/10 outline-none"
             >
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
                <option value="STOP_LOSS">STOP LOSS</option>
                <option value="TAKE_PROFIT">TAKE PROFIT</option>
                <option value="OCO">OCO</option>
                <option value="TRAILING_STOP">TRAILING STOP</option>
             </select>
          </div>

          {(orderType === 'LIMIT' || orderType === 'TAKE_PROFIT' || orderType === 'OCO' || orderType === 'TRAILING_STOP') && (
            <div className="flex flex-col flex-1 min-w-[100px]">
               <span className="text-[10px] uppercase font-black text-slate-500 mb-1">
                 {orderType === 'TRAILING_STOP' ? 'Trailing Distance ($)' : 'Target Price'}
               </span>
               <input type="number" step="0.01" value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                 placeholder={quote?.price?.toString()} className="bg-white/5 text-[11px] font-black text-white p-2.5 rounded-xl border border-white/10 outline-none" />
            </div>
          )}

          {(orderType === 'STOP_LOSS' || orderType === 'OCO') && (
            <div className="flex flex-col flex-1 min-w-[100px]">
               <span className="text-[10px] uppercase font-black text-slate-500 mb-1">Stop Price</span>
               <input type="number" step="0.01" value={stopPrice} onChange={e => setStopPrice(e.target.value)}
                 className="bg-white/5 text-[11px] font-black text-white p-2.5 rounded-xl border border-white/10 outline-none" />
            </div>
          )}
        </div>

        {/* Execution Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 flex-shrink-0 transition-all focus-within:border-cyan-500/40">
            <Briefcase size={14} className="text-slate-500" />
            <div className="flex flex-col">
              <span className="text-[8px] welloh-label opacity-40">Position Size</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="bg-transparent text-white text-sm font-black outline-none w-20" />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <button onClick={() => placeOrder('BUY')} disabled={loading}
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 uppercase tracking-widest">
              {loading ? 'Processing...' : `Buy ${orderType !== 'MARKET' ? orderType : ''}`}
            </button>
            <button onClick={() => placeOrder('SELL')} disabled={loading}
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-xs transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 uppercase tracking-widest">
              {loading ? 'Processing...' : `Sell ${orderType !== 'MARKET' ? orderType : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// SIDEBAR NAV CONFIG
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
  { ticker: 'BTCUSDT', exchange: 'BINANCE', icon: '₿', name: 'Bitcoin' },
  { ticker: 'AAPL', exchange: 'NYSE', icon: 'A', name: 'Apple' },
  { ticker: 'TSLA', exchange: 'NASDAQ', icon: 'T', name: 'Tesla' },
  { ticker: 'EURUSD', exchange: 'FOREX', icon: '€', name: 'Euro/USD' },
  { ticker: 'XAUUSD', exchange: 'FOREX', icon: 'G', name: 'Gold' }
];

// ────────────────────────────────────────────────────────────
// ROOT VIEW
// ────────────────────────────────────────────────────────────
export default function PremiumDashboard() {
  const [ticker, setTicker] = useState('AAPL');
  const [exchange, setExchange] = useState('NYSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { portfolio, loading, refresh } = usePortfolio();
  const { user } = useUser();
  const { signOut } = useClerk();

  // Derive user initials from email or name
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const displayName = user?.fullName ?? email;
  const initials = displayName
    ? displayName.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const filteredMarkets = markets.filter(m =>
    m.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style jsx global>{`
        .welloh-card { background: rgba(8, 12, 20, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; backdrop-filter: blur(40px); }
        .welloh-label { font-size: 10px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: rgb(148,163,184); }
        .welloh-value-xl { font-size: 2rem; font-weight: 950; color: white; letter-spacing: -0.04em; }
        .welloh-green { color: #00FFBB; }
        .welloh-exchange-badge { background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); color: #22d3ee; font-size: 9px; font-weight: 950; letter-spacing: 0.15em; padding: 4px 12px; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .nav-tooltip { display: none; position: absolute; left: 100%; top: 50%; transform: translateY(-50%); margin-left: 12px; background: rgba(8,12,20,0.95); border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; color: white; white-space: nowrap; z-index: 999; }
        .nav-item:hover .nav-tooltip { display: block; }
      `}</style>

      <div className="fixed inset-0 flex overflow-hidden bg-[#04060b] text-white">
        {/* ── SIDEBAR ── */}
        <aside className="w-20 border-r border-white/5 flex flex-col items-center py-6 gap-2 flex-shrink-0 bg-black/40 overflow-y-auto custom-scrollbar">
          {/* Logo */}
          <Link href="/dashboard" className="w-12 h-12 rounded-3xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center font-black shadow-2xl shadow-cyan-500/40 text-lg mb-4 flex-shrink-0">W</Link>
          
          {/* Nav Items */}
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`nav-item relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all group ${item.href === '/dashboard' ? 'bg-cyan-500 text-black shadow-xl shadow-cyan-500/40' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={20} />
              <span className="nav-tooltip">{item.label}</span>
              {item.href === '/dashboard' && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />}
            </Link>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Markets quick-switch */}
          <div className="flex flex-col gap-2 w-full px-3">
            {markets.map(m => (
              <button key={m.ticker} onClick={() => { setTicker(m.ticker); setExchange(m.exchange); }}
                title={m.name}
                className={`nav-item relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all group ${ticker === m.ticker ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
                <span className="font-black text-base">{m.icon}</span>
                <span className="text-[7px] font-black opacity-60 mt-0.5">{m.ticker.slice(0, 3)}</span>
                <span className="nav-tooltip">{m.name}</span>
              </button>
            ))}
          </div>

          {/* Sign out */}
          <button onClick={() => signOut()} title="Sign Out"
            className="mt-4 p-4 rounded-2xl text-slate-600 hover:text-red-500 transition-colors flex-shrink-0">
            <LogOut size={20} />
          </button>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-white/5 flex items-center px-10 justify-between flex-shrink-0 bg-black/10">
            <div className="flex items-center gap-4">
              <span className="welloh-label text-slate-500 opacity-60">Control Center</span>
              <ChevronRight size={14} className="text-slate-800" />
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm uppercase tracking-tighter">{exchange}</span>
                <span className="text-slate-700 font-black">/</span>
                <span className="text-cyan-400 font-black text-sm uppercase tracking-widest">{ticker}</span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {/* Market Search */}
              <div className="hidden md:block relative z-50">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-2 group focus-within:border-cyan-500/40 transition-all">
                  <Search size={14} className="text-slate-500 group-focus-within:text-cyan-500" />
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                    className="bg-transparent border-none text-[11px] text-white outline-none w-56 font-bold"
                    placeholder="EXPLORE MARKETS..."
                  />
                </div>
                {isSearchOpen && searchQuery && (
                  <div className="absolute top-12 left-0 w-full bg-[#080c14] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
                    {filteredMarkets.length === 0 && (
                      <p className="text-slate-500 text-xs text-center py-4">No results</p>
                    )}
                    {filteredMarkets.map(m => (
                      <button
                        key={m.ticker}
                        onMouseDown={() => { setTicker(m.ticker); setExchange(m.exchange); setSearchQuery(''); setIsSearchOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                      >
                       <span className="text-xs font-black">{m.icon}</span>
                       <div className="flex flex-col">
                         <span className="text-white text-[11px] font-bold">{m.ticker}</span>
                         <span className="text-slate-500 text-[9px]">{m.name}</span>
                       </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User info */}
              <div className="flex items-center gap-3">
                <button className="relative p-2.5 rounded-2xl hover:bg-white/5 transition-all text-slate-400 hover:text-white">
                  <Bell size={20} />
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-cyan-500 rounded-full border-2 border-[#04060b]" />
                </button>
                {/* Avatar with initials + email */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-lg">
                    {initials}
                  </div>
                  <div className="flex flex-col hidden md:flex">
                    <span className="text-white text-[10px] font-bold leading-none max-w-[120px] truncate">{displayName}</span>
                    {email && email !== displayName && (
                      <span className="text-slate-500 text-[8px] leading-none mt-0.5 max-w-[120px] truncate">{email}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main grid */}
          <main className="flex-1 overflow-auto p-8 gap-8 flex flex-col custom-scrollbar" style={{ background: 'radial-gradient(circle at 10% 10%, rgba(6,182,212,0.05) 0%, transparent 40%)' }}>
            <div className="flex gap-8 flex-1 min-h-0" style={{ minHeight: '520px' }}>
              <div style={{ width: '300px' }} className="flex-shrink-0"><PortfolioSummary portfolio={portfolio} loading={loading} /></div>
              <div className="flex-1 min-w-0"><TradingConsole ticker={ticker} exchange={exchange} refreshPortfolio={refresh} /></div>
            </div>

            {/* Market Sentinel Strip */}
            <div className="welloh-card p-8 flex-shrink-0 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><Activity size={200} className="text-white" /></div>
              <div className="relative z-10">
                <span className="welloh-label mb-8 block text-cyan-500/40">Market Sentinel Stream</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {markets.map(m => (
                    <button key={m.ticker + '_grid'} onClick={() => { setTicker(m.ticker); setExchange(m.exchange); }}
                      className={`p-5 rounded-3xl border transition-all text-left flex items-center gap-5 ${ticker === m.ticker ? 'bg-cyan-500/10 border-cyan-500/40 shadow-2xl shadow-cyan-500/10 scale-105' : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${ticker === m.ticker ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-500'}`}>{m.icon}</div>
                      <div>
                        <p className="text-[9px] welloh-label opacity-40 mb-1">{m.exchange}</p>
                        <p className="text-white font-black text-sm tracking-tight">{m.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
