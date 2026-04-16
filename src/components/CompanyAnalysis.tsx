"use client";

import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, DollarSign, PieChart, Activity, Info, ChevronRight, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CompanyAnalysis() {
  const [ticker, setTicker] = useState('SNTS.CI');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFundamental = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`/api/stocks/fundamental?ticker=${ticker}`);
        const result = await resp.json();
        setData(result);
      } catch (e) {
        console.error("Fundamental fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFundamental();
  }, [ticker]);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest rounded-lg">Fundamental Analysis</div>
             {ticker.includes('.CI') && <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest rounded-lg">BRVM Regional</div>}
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter">THE ENTERPRISE VIEW</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Phase 6: Multi-Company Benchmark & Metric Intelligence</p>
        </div>
        
        <div className="flex items-center gap-3">
            {['SNTS.CI', 'AAPL', 'MSFT', 'SGBCI.CI'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTicker(t)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${ticker === t ? 'bg-white text-black shadow-xl ring-2 ring-purple-500/20' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}
                >
                    {t}
                </button>
            ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { label: 'Market Capital', value: data?.marketCap || '...', icon: DollarSign, color: 'text-cyan-400' },
            { label: 'P/E Ratio', value: data?.peRatio || '...', icon: Activity, color: 'text-purple-400' },
            { label: 'Dividend Yield', value: data?.dividendYield || '...', icon: PieChart, color: 'text-[#00F5A0]' },
            { label: 'Revenue Growth', value: data?.revenueGrowth || '...', icon: TrendingUp, color: 'text-amber-400' }
        ].map((stat, i) => (
            <div key={i} className="glass-panel p-6 border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-3 mb-4 opacity-50">
                    <stat.icon size={14} className={stat.color} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-2xl font-black">{stat.value}</p>
                <div className="mt-3 flex items-center justify-between">
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${stat.color.replace('text-', 'bg-')}`} style={{ width: '65%' }}></div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Comparison View & Analytics */}
      <div className="grid grid-cols-12 gap-8 min-h-[400px]">
        {/* Metric Chart */}
        <div className="col-span-12 lg:col-span-8 glass-panel p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 font-bold">Relative Performance Distribution</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Revenue', target: 85, industry: 65 },
                        { name: 'P/E', target: 72, industry: 48 },
                        { name: 'Margins', target: 94, industry: 72 },
                        { name: 'Div.', target: 58, industry: 22 }
                    ]}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ fontSize: '10px', color: '#fff' }}
                        />
                        <Bar dataKey="target" fill="#7F00FF" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="industry" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Company Description Card */}
        <div className="col-span-12 lg:col-span-4 glass-panel p-8 bg-gradient-to-br from-purple-500/10 to-transparent">
            <h3 className="text-sm font-black italic mb-6">MENTOR ANALYSIS</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-8">
                {data?.description || 'Retrieving enterprise profile data...'}
            </p>
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-[#00F5A0]/20 flex items-center justify-center">
                        <Zap size={14} className="text-[#00F5A0]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Bullish Indicator Found</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                        <Activity size={14} className="text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">High Volatility Alert</span>
                </div>
            </div>
            
            <button className="w-full mt-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-2xl">
                Open Strategy Guide
            </button>
        </div>
      </div>
    </div>
  );
}
