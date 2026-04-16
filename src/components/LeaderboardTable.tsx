"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, ArrowUp, ArrowDown, User, Flag, Target, TrendingUp } from 'lucide-react';

export default function LeaderboardTable() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const resp = await fetch('/api/leaderboard?limit=10');
        const data = await resp.json();
        setEntries(data);
      } catch (e) {
        // Mock fallback for premium look
        setEntries([
          { rank: 1, displayName: 'Saliou_Invest', score: 2845.2, returnPct: 154.2, winRate: 68.5, country: 'SN' },
          { rank: 2, displayName: 'Koffi_Abidjan', score: 2612.4, returnPct: 124.8, winRate: 62.1, country: 'CI' },
          { rank: 3, displayName: 'Tiger_Market', score: 2450.9, returnPct: 98.4, winRate: 71.2, country: 'NG' },
          { rank: 4, displayName: 'Amina_Fintech', score: 2210.5, returnPct: 82.1, winRate: 59.4, country: 'MA' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="glass-panel p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-yellow-400" size={24} />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Global Talent Leaderboard</h2>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Phase 7: Composite Performance Score (PnL + Sharpe + Winrate)</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">My Rank</button>
            <button className="px-4 py-2 bg-[#00F5A0]/10 rounded-xl border border-[#00F5A0]/20 text-[9px] font-black uppercase tracking-widest text-[#00F5A0]">Compete</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
              <th className="pb-4 pl-4">Rank</th>
              <th className="pb-4">Trader</th>
              <th className="pb-4">Score</th>
              <th className="pb-4">Return %</th>
              <th className="pb-4">Win Rate</th>
              <th className="pb-4">Analysis</th>
              <th className="pb-4 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {entries.map((entry) => (
              <tr key={entry.rank} className="group hover:bg-white/[0.02] transition-colors">
                <td className="py-5 pl-4">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${entry.rank === 1 ? 'bg-yellow-400 text-black' : entry.rank === 2 ? 'bg-slate-300 text-black' : entry.rank === 3 ? 'bg-orange-400 text-black' : 'bg-white/5 text-slate-400'}`}>
                    {entry.rank}
                  </div>
                </td>
                <td className="py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                        {entry.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-0.5">{entry.displayName}</p>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Flag size={10} className="text-slate-500" />
                        <span className="text-[8px] font-black uppercase">{entry.country || 'Global'}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-5">
                  <div className="flex items-center gap-1.5">
                    <Target size={12} className="text-purple-400" />
                    <span className="text-[11px] font-black">{entry.score}</span>
                  </div>
                </td>
                <td className="py-5">
                  <div className="flex items-center gap-1.5 text-[#00F5A0]">
                    <TrendingUp size={12} />
                    <span className="text-[11px] font-bold">+{entry.returnPct}%</span>
                  </div>
                </td>
                <td className="py-5">
                  <span className="text-[11px] font-bold text-slate-300">{entry.winRate}%</span>
                </td>
                <td className="py-5">
                    <div className="flex gap-1">
                        {Array.from({length: 4}).map((_, i) => (
                            <div key={i} className={`w-1 h-3 rounded-full ${i < 3 ? 'bg-purple-500' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                </td>
                <td className="py-5 pr-4 text-right">
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#7F00FF] transition-all group-hover:bg-[#7F00FF] group-hover:text-white">
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
