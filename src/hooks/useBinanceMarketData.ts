"use client";

import { useState, useEffect, useRef } from 'react';

export interface CryptoDepth {
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][];
}

export interface CryptoTrade {
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

/**
 * useBinanceMarketData
 * Provides real-time ticker, trades, and orderbook (Phase 1)
 */
export function useBinanceMarketData(symbol: string = 'BTCUSDT') {
  const [ticker, setTicker] = useState<any>(null);
  const [trades, setTrades] = useState<CryptoTrade[]>([]);
  const [depth, setDepth] = useState<CryptoDepth>({ bids: [], asks: [] });
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbol) return;
    const lowerSymbol = symbol.toLowerCase();
    
    // Multi-stream: ticker, trades, partial depth (5 levels)
    const streams = [`${lowerSymbol}@ticker`, `${lowerSymbol}@trade`, `${lowerSymbol}@depth5@100ms`].join('/');
    const url = `wss://stream.binance.com:9443/ws/${streams}`;

    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Ticker logic
      if (data.e === '24hrTicker') {
        setTicker({
          price: parseFloat(data.c),
          changePct: parseFloat(data.P),
          isUp: parseFloat(data.P) >= 0,
        });
      }
      
      // Trades logic
      if (data.e === 'trade') {
        const trade = {
          price: parseFloat(data.p),
          quantity: parseFloat(data.q),
          time: data.T,
          isBuyerMaker: data.m,
        };
        setTrades(prev => [trade, ...prev].slice(0, 10)); // Keep last 10
      }

      // Depth logic (Partial Book)
      if (data.bids && data.asks) {
        setDepth({
          bids: data.bids.slice(0, 5),
          asks: data.asks.slice(0, 5)
        });
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [symbol]);

  return { ticker, trades, depth };
}
