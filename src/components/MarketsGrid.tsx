"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Globe, Zap, DollarSign, BarChart3, ChevronRight } from 'lucide-react';

const REGIONS = [
  { id: 'africa', name: 'Africa', icon: Globe },
  { id: 'us_eu', name: 'US / Europe', icon: BarChart3 },
  { id: 'crypto', name: 'Crypto', icon: Zap },
  { id: 'commodities', name: 'Commods', icon: DollarSign },
];

export default function MarketsGrid() {
  const [activeRegion, setActiveRegion] = useState('africa');
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRegionData = async () => {
      setLoading(true);
      try {
        const endpoint = activeRegion === 'africa' ? '/api/stocks/markets/africa' : `/api/stocks/quote?region=${activeRegion}`;
        const resp = await fetch(endpoint);
        const data = await resp.json();
        setMarkets(Array.isArray(data) ? data : [data]);
      } catch (e) {
        console.error("Market fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRegionData();
  }, [activeRegion]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Region Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-4">
        {REGIONS.map((reg) => (
          <button 
            key={reg.id}
            onClick={() => setActiveRegion(reg.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRegion === reg.id ? 'bg-white text-black shadow-2xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <reg.icon size={14} />
            {reg.name}
          </button>
        ))}
      </div>

      {/* Markets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {markets.map((m, i) => (
          <div key={i} className="glass-panel p-6 group hover:bg-white/[0.03] transition-all cursor-pointer border-white/5 hover:border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#00F5A0]/50 transition-colors">
                <span className="text-[10px] font-black text-cyan-400">{m.ticker?.slice(0, 3)}</span>
              </div>
              <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${parseFloat(m.changePct) >= 0 ? 'bg-[#00F5A0]/10 text-[#00F5A0]' : 'bg-red-400/10 text-red-400'}`}>
                {m.changePct}
              </div>
            </div>

            <h3 className="font-bold text-sm tracking-tight mb-0.5">{m.ticker}</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4 truncate">{m.exchange || m.name || 'Global Market'}</p>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-black">{m.price?.toLocaleString()}</p>
                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">{m.currency || 'USD'}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-[#00F5A0] group-hover:text-black transition-all">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        ))}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel p-6 animate-pulse bg-white/5 border-white/5 h-40"></div>
        ))}
      </div>
    </div>
  );
}
