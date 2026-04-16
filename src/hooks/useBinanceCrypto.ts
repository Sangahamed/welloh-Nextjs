"use client";

import { useState, useEffect, useRef } from 'react';

export interface CryptoPrice {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  isUp: boolean;
}

export function useBinanceCrypto(symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']) {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Format symbols for Binance WS: btcusdt@ticker
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/ws/${streams}`;

    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.e === '24hrTicker') {
        const symbol = data.s;
        const price = parseFloat(data.c);
        const change = parseFloat(data.p);
        const changePct = parseFloat(data.P);
        
        setPrices(prev => ({
          ...prev,
          [symbol]: {
            symbol,
            price,
            change,
            changePct,
            isUp: change >= 0
          }
        }));
      }
    };

    ws.current.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [symbols]);

  return prices;
}
