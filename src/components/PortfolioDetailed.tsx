"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { PieChart, TrendingUp, History, Download, List, Filter } from 'lucide-react';

export default function PortfolioDetailed() {
  const [data, setData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        const resp = await fetch('/api/portfolio/summary');
        const summary = await resp.json();
        setData(summary);
        
        // Simulating detailed transaction history
        setTransactions([
          { id: 1, ticker: 'BTCUSDT', type: 'BUY', shares: 0.1, price: 68421, date: '2024-12-01' },
          { id: 2, ticker: 'SNTS', type: 'BUY', shares: 15, price: 19450, date: '2024-11-28' },
          { id: 3, ticker: 'AAPL', type: 'SELL', shares: 5, price: 182.4, date: '2024-11-25' },
        ]);
      } catch (e) {
        console.error("Full portfolio error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, []);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Portfolio Deep Analysis</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Historical Performance & Structural Allocation</p>
        </div>
        <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"><Download size={14} /> Export CSV</button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#7F00FF]/10 border border-[#7F00FF]/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7F00FF] hover:bg-[#7F00FF] hover:text-white transition-all"><TrendingUp size={14} /> Detailed Audit</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Performance Chart */}
        <div className="col-span-12 lg:col-span-8 glass-panel p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Performance Growth (30D)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{v: 380000}, {v: 410000}, {v: 440000}, {v: 485210}]}>
                        <defs>
                            <linearGradient id="pColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7F00FF" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#7F00FF" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{backgroundColor: '#050505', border: '1px solid #1a1a1a', borderRadius: '12px'}} />
                        <Area type="monotone" dataKey="v" stroke="#7F00FF" strokeWidth={3} fillOpacity={1} fill="url(#pColor)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Allocation Info & Mobile Money */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <div className="glass-panel p-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Asset Allocation</h3>
                <div className="space-y-6">
                    {[
                        { label: 'Technology', val: '45.2%', col: 'bg-purple-500' },
                        { label: 'West Africa', val: '28.4%', col: 'bg-cyan-400' },
                        { label: 'Crypto Assets', val: '15.8%', col: 'bg-[#00F5A0]' },
                        { label: 'Cash (XOF)', val: '10.6%', col: 'bg-slate-700' }
                    ].map((alloc, i) => (
                        <div key={i}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-slate-300 uppercase">{alloc.label}</span>
                                <span className="text-xs font-black">{alloc.val}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${alloc.col}`} style={{ width: alloc.val }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Money Integration (Localized Feature) */}
            <div className="glass-panel p-8 border-[#FF6600]/20 bg-gradient-to-br from-[#FF6600]/5 to-transparent">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF6600]">Mobile Wallets</h3>
                    <div className="px-2 py-0.5 rounded bg-[#FF6600]/10 text-[#FF6600] text-[8px] font-black">Region: WAEMU</div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FF6600] flex items-center justify-center font-black text-[10px] text-white">O</div>
                            <span className="text-[10px] font-bold">Orange Money</span>
                        </div>
                        <span className="text-xs font-black">45,200 <span className="text-[8px] text-slate-500">XOF</span></span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FFCC00] flex items-center justify-center font-black text-[10px] text-black">M</div>
                            <span className="text-[10px] font-bold">MTN MoMo</span>
                        </div>
                        <span className="text-xs font-black">12,800 <span className="text-[8px] text-slate-500">XOF</span></span>
                    </div>
                </div>

                <button className="w-full mt-6 py-3 bg-[#FF6600] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#FF6600]/20">
                    Simulation: Instant Deposit
                </button>
            </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-end mb-8">
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Transaction Log</h3>
            <div className="flex gap-2"><Filter size={16} className="text-slate-500 cursor-pointer" /> <List size={16} className="text-slate-500 cursor-pointer" /></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <tbody>
                    {transactions.map(t => (
                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                            <td className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${t.type === 'BUY' ? 'bg-[#00F5A0]/20 text-[#00F5A0]' : 'bg-red-400/20 text-red-400'}`}>{t.type}</div>
                                    <span className="text-xs font-bold">{t.ticker}</span>
                                </div>
                            </td>
                            <td className="py-4 text-xs text-slate-500 font-mono">{t.date}</td>
                            <td className="py-4 text-xs font-bold text-slate-300">{t.shares} Shares</td>
                            <td className="py-4 text-xs font-black text-right">${t.price.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
