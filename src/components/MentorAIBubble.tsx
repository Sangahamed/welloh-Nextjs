"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, X, Minus, MessageSquare } from 'lucide-react';

export default function MentorAIBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Terminal synchronized. I'm monitoring global liquidity and high-frequency patterns. How can I assist your trading today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const windowSize = useRef({ width: 0, height: 0 });

  // Initialize position and window size on client
  useEffect(() => {
    windowSize.current = { width: window.innerWidth, height: window.innerHeight };
    setPosition({ 
      x: window.innerWidth - 380, // Default bottom right, 380px from right
      y: window.innerHeight - 600  // Default bottom right, 600px from top
    });

    const handleResize = () => {
      windowSize.current = { width: window.innerWidth, height: window.innerHeight };
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    let newX = e.clientX - dragStartRef.current.x;
    let newY = e.clientY - dragStartRef.current.y;

    // Bounds checking
    const uiWidth = 340;
    const uiHeight = 520;
    
    if (newX < 0) newX = 0;
    if (newX + uiWidth > windowSize.current.width) newX = windowSize.current.width - uiWidth;
    if (newY < 0) newY = 0;
    if (newY + uiHeight > windowSize.current.height) newY = windowSize.current.height - uiHeight;

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = 'auto';
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const queryAI = async () => {
    if (!input.trim() || loading) return;
    const msg = input; 
    setMessages(p => [...p, { role: 'user', text: msg }]); 
    setInput(''); 
    setLoading(true);
    
    try {
      const r = await fetch('/api/mentor/analysis', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }) 
      });
      const d = await r.json();
      setMessages(p => [...p, { role: 'ai', text: d.reply || d.content || "Neural link stable. Standard analysis complete." }]);
    } catch { 
      setMessages(p => [...p, { role: 'ai', text: "Signal lost. Check network." }]); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105 transition-transform"
      >
        <MessageSquare className="text-white w-8 h-8" />
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#04060b]"></span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl bg-[#080c14] border border-cyan-500/30 flex items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:border-cyan-500/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Zap size={14} className="text-white fill-current" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white font-black text-xs uppercase tracking-widest">Mentor AI</span>
          <span className="text-[9px] text-[#00FFBB] font-bold animate-pulse uppercase">Active Link</span>
        </div>
        <MaximizeIcon />
      </button>
    );
  }

  return (
    <div 
      className="fixed z-50 welloh-card flex flex-col overflow-hidden border-cyan-500/20 shadow-2xl backdrop-blur-3xl bg-[#04060b]/95"
      style={{
        width: '340px',
        height: '520px',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none' // Prevent scrolling while dragging
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header (Drag Handle) */}
      <div className="drag-handle flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02] cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 pointer-events-none">
            <Zap size={14} className="text-white fill-current" />
          </div>
          <div className="flex flex-col pointer-events-none">
            <span className="text-white font-black text-xs uppercase tracking-widest">Mentor AI</span>
            <span className="text-[9px] text-[#00FFBB] font-bold animate-pulse uppercase">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(true)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <Minus size={14} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                <Zap size={12} className="text-cyan-400" />
              </div>
            )}
            <div className={`text-[11px] leading-relaxed rounded-2xl px-4 py-3 max-w-[85%] ${m.role === 'ai' ? 'bg-white/[0.04] border border-white/[0.08] text-slate-200' : 'bg-cyan-500 text-black font-bold'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
               <Zap size={12} className="text-cyan-400 animate-pulse" />
            </div>
            <div className="text-[11px] leading-relaxed rounded-2xl px-4 py-3 max-w-[85%] bg-white/[0.04] border border-white/[0.08] text-slate-400">
               <span className="animate-pulse">Processing signal...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus-within:border-cyan-500/40 transition-all">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && queryAI()}
            className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500 font-medium" 
            placeholder="Analyze ticker or pattern..." 
            disabled={loading}
          />
          <button 
            onClick={queryAI} 
            disabled={loading || !input.trim()}
            className="text-cyan-500 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MaximizeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
      <polyline points="15 3 21 3 21 9"></polyline>
      <polyline points="9 21 3 21 3 15"></polyline>
      <line x1="21" y1="3" x2="14" y2="10"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
  );
}
