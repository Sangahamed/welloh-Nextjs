"use client";

import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Shield, Lock, Globe, Zap, Search, PlusCircle } from 'lucide-react';

export default function SocialTradingHub() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch trading rooms from the backend (Phase 8)
    const fetchRooms = async () => {
      try {
        const resp = await fetch('/api/social/rooms');
        const data = await resp.json();
        setRooms(data);
      } catch (e) {
        // Fallback to mock data if API not fully wired yet
        setRooms([
          { id: '1', name: 'BRVM Elite', focus: 'africa', members: 485, isPrivate: false, description: 'West Africa core trading team.' },
          { id: '2', name: 'Crypto Degens', focus: 'crypto', members: 1250, isPrivate: false, description: 'High leverage BTC/ETH signals.' },
          { id: '3', name: 'Inner Circle', focus: 'mixed', members: 12, isPrivate: true, description: 'Verified performance only.' },
          { id: '4', name: 'WallStreet Africa', focus: 'stocks', members: 89, isPrivate: false, description: 'US & Global stocks analysis.' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Search & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">THE TRADING HUB</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Connect. Analyze. Copy. Win.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Find global rooms..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-purple-500/50 outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-purple-500/20">
            <PlusCircle size={14} /> New Room
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['All Rooms', 'West Africa', 'Crypto', 'Forex', 'Private'].map((cat, i) => (
          <button key={cat} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${i === 0 ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="glass-panel p-6 group cursor-pointer hover:bg-white/5 transition-all border-white/5 hover:border-purple-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 transition-all">
                {room.focus === 'africa' ? <Globe className="text-cyan-400" /> : room.focus === 'crypto' ? <Zap className="text-yellow-400" /> : <MessageSquare className="text-purple-400" />}
              </div>
              {room.isPrivate && <Lock size={12} className="text-slate-600" />}
            </div>
            
            <h3 className="font-bold text-lg mb-1">{room.name}</h3>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-4">{room.description}</p>
            
            <div className="flex items-center gap-4 border-t border-white/5 pt-4 mt-auto">
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-slate-500" />
                <span className="text-[10px] font-black text-slate-300">{room.members}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#00F5A0] rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Active Now</span>
              </div>
            </div>

            <button className="w-full mt-6 py-3 rounded-xl bg-white/5 group-hover:bg-purple-600 text-[10px] font-black uppercase tracking-widest transition-all">
              Join Intelligence
            </button>
          </div>
        ))}
      </div>

      {/* Trending Signal Stream */}
      <div className="glass-panel p-8 mt-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 flex gap-2">
            <div className="bg-red-500/10 text-red-500 text-[9px] font-black px-2 py-0.5 rounded uppercase">Experimental</div>
        </div>
        <h2 className="text-xl font-black italic mb-6">LIVE SIGNAL STREAM</h2>
        <div className="space-y-4">
            {[
                { user: '@alex_trader', msg: 'Just went long on SNTS at 19,450. Volume analysis confirms breakout.', type: 'trade', time: '2m' },
                { user: '@crypto_logic', msg: 'Btc orderbook showing heavy sell pressure at 68k. Careful here.', type: 'analysis', time: '5m' },
                { user: '@mentor_ai', msg: 'Note: Gold (XAU) showing correlation with emerging market volatility.', type: 'alert', time: '12m' }
            ].map((feed, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 flex-shrink-0" />
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-black text-[10px] text-purple-400 uppercase">{feed.user}</span>
                            <span className="text-[8px] text-slate-600 font-bold">{feed.time} ago</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{feed.msg}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
