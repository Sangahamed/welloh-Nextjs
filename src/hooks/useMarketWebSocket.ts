/**
 * useMarketWebSocket Hook
 * React hook for real-time market data updates
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { marketWebSocket } from "@/services/marketWebSocket";
import type { MarketUpdateMessage, WebSocketConnectionStatus } from "@/types/market";

interface UseMarketWebSocketOptions {
  symbols?: string[];
  autoConnect?: boolean;
  onPriceUpdate?: (symbol: string, data: Partial<MarketUpdateMessage["data"]>) => void;
}

export function useMarketWebSocket(options: UseMarketWebSocketOptions = {}) {
  const {
    symbols = [],
    autoConnect = true,
    onPriceUpdate,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>({
    connected: false,
    lastPing: new Date().toISOString(),
    latency: 0,
    subscribedSymbols: [],
  });

  const [lastUpdates, setLastUpdates] = useState<Map<string, MarketUpdateMessage>>(new Map());
  const onPriceUpdateRef = useRef(onPriceUpdate);

  // Update ref when callback changes
  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  // Handle price updates
  const handlePriceUpdate = useCallback((message: MarketUpdateMessage) => {
    setLastUpdates(prev => new Map(prev).set(message.symbol, message));
    onPriceUpdateRef.current?.(message.symbol, message.data);
  }, []);

  // Connect and set up event listeners
  useEffect(() => {
    if (autoConnect) {
      marketWebSocket.connect().catch(console.error);
    }

    // Set up event handlers
    marketWebSocket.on("PRICE_UPDATE", handlePriceUpdate);
    marketWebSocket.onConnectionStatusChange(setConnectionStatus);

    return () => {
      marketWebSocket.off("PRICE_UPDATE", handlePriceUpdate);
      marketWebSocket.offConnectionStatusChange(setConnectionStatus);
    };
  }, [autoConnect, handlePriceUpdate]);

  // Subscribe to symbols
  useEffect(() => {
    if (symbols.length > 0 && connectionStatus.connected) {
      marketWebSocket.subscribe(symbols);
    }

    return () => {
      if (symbols.length > 0) {
        marketWebSocket.unsubscribe(symbols);
      }
    };
  }, [symbols, connectionStatus.connected]);

  // Get latest update for a symbol
  const getLatestUpdate = useCallback((symbol: string): MarketUpdateMessage | undefined => {
    return lastUpdates.get(symbol);
  }, [lastUpdates]);

  // Disconnect
  const disconnect = useCallback(() => {
    marketWebSocket.disconnect();
  }, []);

  return {
    connected: connectionStatus.connected,
    latency: connectionStatus.latency,
    subscribedSymbols: connectionStatus.subscribedSymbols,
    getLatestUpdate,
    disconnect,
  };
}

// Hook for a single symbol
export function useSingleMarketUpdate(symbol: string) {
  const [data, setData] = useState<MarketUpdateMessage | null>(null);

  useEffect(() => {
    const handleUpdate = (message: MarketUpdateMessage) => {
      if (message.symbol === symbol) {
        setData(message);
      }
    };

    marketWebSocket.on("PRICE_UPDATE", handleUpdate);
    marketWebSocket.subscribe([symbol]);

    return () => {
      marketWebSocket.off("PRICE_UPDATE", handleUpdate);
      marketWebSocket.unsubscribe([symbol]);
    };
  }, [symbol]);

  return data;
}

// Hook for multiple symbols
export function useMultipleMarketUpdates(symbolList: string[]) {
  const [updates, setUpdates] = useState<Map<string, MarketUpdateMessage>>(new Map());

  useEffect(() => {
    const handleUpdate = (message: MarketUpdateMessage) => {
      setUpdates(prev => new Map(prev).set(message.symbol, message));
    };

    marketWebSocket.on("PRICE_UPDATE", handleUpdate);
    marketWebSocket.subscribe(symbolList);

    return () => {
      marketWebSocket.off("PRICE_UPDATE", handleUpdate);
      marketWebSocket.unsubscribe(symbolList);
    };
  }, [symbolList]);

  return updates;
}