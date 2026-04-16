/**
 * Market WebSocket Service
 * Real-time market data updates via WebSocket connections
 */

import type { MarketUpdateMessage, WebSocketConnectionStatus, MarketAsset } from "@/types/market";

// WebSocket event types
export type WebSocketEventHandler = (data: MarketUpdateMessage) => void;
export type ConnectionStatusHandler = (status: WebSocketConnectionStatus) => void;

class MarketWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private connectionStatusHandlers: Set<ConnectionStatusHandler> = new Set();
  private subscribedSymbols: Set<string> = new Set();
  private connectionStatus: WebSocketConnectionStatus = {
    connected: false,
    lastPing: new Date().toISOString(),
    latency: 0,
    subscribedSymbols: [],
  };
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;

  constructor(wsUrl: string = "wss://api.welloh.com/ws") {
    this.url = wsUrl;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.connectionStatus.connected = true;
          this.connectionStatus.lastPing = new Date().toISOString();
          this.notifyConnectionStatus();
          this.startPingInterval();
          this.resubscribeSymbols();
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: MarketUpdateMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.connectionStatus.connected = false;
          this.notifyConnectionStatus();
          this.stopPingInterval();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.stopPingInterval();
    this.clearReconnectTimeout();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to market updates for specific symbols
   */
  subscribe(symbols: string[]) {
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "SUBSCRIBE",
        symbols,
      }));
    }
    
    this.updateConnectionStatus();
  }

  /**
   * Unsubscribe from market updates
   */
  unsubscribe(symbols: string[]) {
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "UNSUBSCRIBE",
        symbols,
      }));
    }
    
    this.updateConnectionStatus();
  }

  /**
   * Resubscribe to all symbols after reconnection
   */
  private resubscribeSymbols() {
    if (this.subscribedSymbols.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "SUBSCRIBE",
        symbols: Array.from(this.subscribedSymbols),
      }));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: MarketUpdateMessage) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    // Handle all messages with wildcard
    const allHandlers = this.eventHandlers.get("*");
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: WebSocketEventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Unregister event handler
   */
  off(eventType: string, handler: WebSocketEventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Register connection status handler
   */
  onConnectionStatusChange(handler: ConnectionStatusHandler) {
    this.connectionStatusHandlers.add(handler);
    // Immediately notify of current status
    handler(this.connectionStatus);
  }

  /**
   * Unregister connection status handler
   */
  offConnectionStatusChange(handler: ConnectionStatusHandler) {
    this.connectionStatusHandlers.delete(handler);
  }

  /**
   * Notify all connection status handlers
   */
  private notifyConnectionStatus() {
    this.connectionStatusHandlers.forEach(handler => handler(this.connectionStatus));
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus() {
    this.connectionStatus.subscribedSymbols = Array.from(this.subscribedSymbols);
    this.notifyConnectionStatus();
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval() {
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        this.ws.send(JSON.stringify({ type: "PING", timestamp: pingTime }));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle pong response and calculate latency
   */
  private handlePong(timestamp: number) {
    this.connectionStatus.latency = Date.now() - timestamp;
    this.connectionStatus.lastPing = new Date().toISOString();
    this.notifyConnectionStatus();
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout() {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Simulated WebSocket service for development/demo
class SimulatedMarketWebSocketService {
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private connectionStatusHandlers: Set<ConnectionStatusHandler> = new Set();
  private connected = false;
  private simulationInterval: number | null = null;
  private subscribedSymbols: Set<string> = new Set();
  
  private connectionStatus: WebSocketConnectionStatus = {
    connected: false,
    lastPing: new Date().toISOString(),
    latency: 50,
    subscribedSymbols: [],
  };

  connect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        this.connectionStatus.connected = true;
        this.notifyConnectionStatus();
        this.startSimulation();
        resolve();
      }, 500);
    });
  }

  disconnect() {
    this.connected = false;
    this.connectionStatus.connected = false;
    this.notifyConnectionStatus();
    this.stopSimulation();
  }

  subscribe(symbols: string[]) {
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    this.updateConnectionStatus();
  }

  unsubscribe(symbols: string[]) {
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
    this.updateConnectionStatus();
  }

  on(eventType: string, handler: WebSocketEventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: WebSocketEventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  onConnectionStatusChange(handler: ConnectionStatusHandler) {
    this.connectionStatusHandlers.add(handler);
    handler(this.connectionStatus);
  }

  offConnectionStatusChange(handler: ConnectionStatusHandler) {
    this.connectionStatusHandlers.delete(handler);
  }

  private notifyConnectionStatus() {
    this.connectionStatusHandlers.forEach(handler => handler(this.connectionStatus));
  }

  private updateConnectionStatus() {
    this.connectionStatus.subscribedSymbols = Array.from(this.subscribedSymbols);
    this.notifyConnectionStatus();
  }

  private startSimulation() {
    this.simulationInterval = window.setInterval(() => {
      if (!this.connected || this.subscribedSymbols.size === 0) return;

      // Simulate random price updates
      const symbols = Array.from(this.subscribedSymbols);
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      const changePercent = (Math.random() - 0.5) * 0.1; // Small random change
      const isPositive = changePercent >= 0;

      const message: MarketUpdateMessage = {
        type: "PRICE_UPDATE",
        symbol: randomSymbol,
        exchange: "SIMULATED",
        data: {
          changePercent: Math.round(changePercent * 1000) / 10,
          change: Math.round(Math.random() * 10) / 100,
        },
        timestamp: new Date().toISOString(),
      };

      this.handleMessage(message);
    }, 2000); // Update every 2 seconds
  }

  private stopSimulation() {
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private handleMessage(message: MarketUpdateMessage) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    const allHandlers = this.eventHandlers.get("*");
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  getStatus(): WebSocketConnectionStatus {
    return { ...this.connectionStatus };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Export appropriate service based on environment
const useSimulation = process.env.NODE_ENV === "development" || !process.env.WEBSOCKET_URL;

export const marketWebSocket = useSimulation 
  ? new SimulatedMarketWebSocketService()
  : new MarketWebSocketService(process.env.WEBSOCKET_URL || "wss://api.welloh.com/ws");

export default marketWebSocket;