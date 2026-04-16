// Global Market Types for Welloh Trading Platform
// Supports multi-region markets with fallback data providers

export type MarketRegion = "AFRICA" | "EUROPE" | "ASIA" | "AMERICA" | "OCEANIA";

export type MarketSubRegion = 
  | "WEST_AFRICA" 
  | "SOUTH_AFRICA" 
  | "EAST_AFRICA" 
  | "NORTH_AFRICA"
  | "WESTERN_EUROPE"
  | "EASTERN_EUROPE"
  | "NORTHERN_EUROPE"
  | "SOUTHERN_EUROPE"
  | "EAST_ASIA"
  | "SOUTHEAST_ASIA"
  | "SOUTH_ASIA"
  | "CENTRAL_ASIA"
  | "NORTH_AMERICA"
  | "SOUTH_AMERICA"
  | "CENTRAL_AMERICA"
  | "AUSTRALIA_NZ"
  | "PACIFIC";

export type DataSource = "YAHOO" | "POLYGON" | "ALPHA_VANTAGE" | "TWELVE_DATA" | "LOCAL_SCRAPER" | "MANUAL";

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  region: MarketRegion;
  subRegion?: MarketSubRegion;
  exchange: string;
  currency: string;
  marketCap?: number;
  volume?: number;
  lastUpdated: string;
  dataSource: DataSource;
  isDelayed?: boolean;
  delayMinutes?: number;
}

export interface MarketIndex extends MarketAsset {
  components?: string[]; // List of component symbols
  high52w?: number;
  low52w?: number;
  ytdChange?: number;
}

export interface RegionPerformance {
  region: MarketRegion;
  performance: number;
  topGainer?: MarketAsset;
  topLoser?: MarketAsset;
  activeMarkets: number;
  totalMarkets: number;
}

export interface MarketHeatmapData {
  symbol: string;
  name: string;
  changePercent: number;
  marketCap?: number;
  sector?: string;
  region: MarketRegion;
}

export interface GlobalMarketOverview {
  timestamp: string;
  regions: RegionPerformance[];
  topGainers: MarketAsset[];
  topLosers: MarketAsset[];
  mostActive: MarketAsset[];
  indices: MarketIndex[];
}

export interface MarketDataConfig {
  primarySource: DataSource;
  fallbackSources: DataSource[];
  refreshInterval: number; // in milliseconds
  maxRetries: number;
  timeout: number;
}

export interface AfricanMarketConfig {
  exchange: string;
  symbol: string;
  scraperUrl?: string;
  apiEndpoint?: string;
  updateFrequency: number; // minutes
  cacheEnabled: boolean;
}

// WebSocket message types for real-time updates
export interface MarketUpdateMessage {
  type: "PRICE_UPDATE" | "VOLUME_UPDATE" | "NEW_DATA" | "CONNECTION_STATUS";
  symbol: string;
  exchange: string;
  data: Partial<MarketAsset>;
  timestamp: string;
}

export interface WebSocketConnectionStatus {
  connected: boolean;
  lastPing: string;
  latency: number;
  subscribedSymbols: string[];
}