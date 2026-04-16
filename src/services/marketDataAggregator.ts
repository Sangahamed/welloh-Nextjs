/**
 * Market Data Aggregator Service
 * Intelligent data aggregation with fallback providers for global markets
 */

import type {
  MarketAsset,
  MarketIndex,
  MarketRegion,
  GlobalMarketOverview,
  MarketDataConfig,
  DataSource,
  AfricanMarketConfig,
} from "@/types/market";

// Configuration for market data providers
const DEFAULT_CONFIG: MarketDataConfig = {
  primarySource: "YAHOO",
  fallbackSources: ["POLYGON", "ALPHA_VANTAGE", "TWELVE_DATA"],
  refreshInterval: 30000, // 30 seconds
  maxRetries: 3,
  timeout: 10000, // 10 seconds
};

// African market configurations
const AFRICAN_MARKETS: AfricanMarketConfig[] = [
  {
    exchange: "BRVM",
    symbol: "^BRVM",
    updateFrequency: 60, // 1 hour delay for African markets
    cacheEnabled: true,
  },
  {
    exchange: "JSE",
    symbol: "^J203",
    updateFrequency: 15, // 15 minutes for JSE
    cacheEnabled: true,
  },
  {
    exchange: "NSE",
    symbol: "^NGSEINDX",
    updateFrequency: 60,
    cacheEnabled: true,
  },
  {
    exchange: "EGX",
    symbol: "^CASE30",
    updateFrequency: 60,
    cacheEnabled: true,
  },
];

// Global market indices by region
const GLOBAL_INDICES: Record<MarketRegion, Array<{ symbol: string; name: string; exchange: string }>> = {
  AFRICA: [
    { symbol: "^BRVM", name: "BRVM Composite", exchange: "BRVM" },
    { symbol: "^J203", name: "FTSE/JSE All Share", exchange: "JSE" },
    { symbol: "^NGSEINDX", name: "NSE All-Share", exchange: "NSE" },
    { symbol: "^CASE30", name: "EGX 30", exchange: "EGX" },
  ],
  EUROPE: [
    { symbol: "^FTSE", name: "FTSE 100", exchange: "LSE" },
    { symbol: "^FCHI", name: "CAC 40", exchange: "Euronext" },
    { symbol: "^GDAXI", name: "DAX", exchange: "XETRA" },
    { symbol: "^STOXX50E", name: "EURO STOXX 50", exchange: "Euronext" },
  ],
  ASIA: [
    { symbol: "^N225", name: "Nikkei 225", exchange: "TSE" },
    { symbol: "^HSI", name: "Hang Seng", exchange: "HKEX" },
    { symbol: "^SSEC", name: "Shanghai Composite", exchange: "SSE" },
    { symbol: "^BSESN", name: "S&P BSE Sensex", exchange: "BSE" },
  ],
  AMERICA: [
    { symbol: "^DJI", name: "Dow Jones", exchange: "NYSE" },
    { symbol: "^GSPC", name: "S&P 500", exchange: "NYSE" },
    { symbol: "^IXIC", name: "NASDAQ Composite", exchange: "NASDAQ" },
    { symbol: "^RUT", name: "Russell 2000", exchange: "NYSE" },
  ],
  OCEANIA: [
    { symbol: "^AXJO", name: "S&P/ASX 200", exchange: "ASX" },
    { symbol: "^NZ50", name: "S&P/NZX 50", exchange: "NZX" },
  ],
};

// Cache for market data
const marketDataCache = new Map<string, { data: MarketAsset; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache

/**
 * Simulate fetching data from different providers
 * In production, these would be actual API calls
 */
async function fetchFromProvider(
  symbol: string,
  provider: DataSource
): Promise<MarketAsset | null> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100));

  // Simulate provider availability (90% success rate for demo)
  if (Math.random() > 0.9) {
    return null;
  }

  // Generate realistic mock data
  const basePrice = Math.random() * 1000 + 50;
  const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
  const change = basePrice * (changePercent / 100);

  return {
    symbol,
    name: `${symbol} Index`,
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    region: getRegionForSymbol(symbol),
    exchange: getExchangeForSymbol(symbol),
    currency: getCurrencyForRegion(getRegionForSymbol(symbol)),
    volume: Math.floor(Math.random() * 10000000),
    lastUpdated: new Date().toISOString(),
    dataSource: provider,
    isDelayed: isDelayedMarket(symbol),
    delayMinutes: isDelayedMarket(symbol) ? 15 : 0,
  };
}

/**
 * Intelligent data fetching with fallback chain
 */
async function fetchMarketData(symbol: string): Promise<MarketAsset | null> {
  // Check cache first
  const cached = marketDataCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Check if it's an African market (special handling)
  const africanConfig = AFRICAN_MARKETS.find((m) => m.symbol === symbol);
  if (africanConfig) {
    return fetchAfricanMarketData(africanConfig);
  }

  // Try primary source first, then fallbacks
  const sources: DataSource[] = [
    DEFAULT_CONFIG.primarySource,
    ...DEFAULT_CONFIG.fallbackSources,
  ];

  for (const source of sources) {
    try {
      const data = await fetchFromProvider(symbol, source);
      if (data) {
        // Update cache
        marketDataCache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${source}:`, error);
      continue;
    }
  }

  // If all providers failed, try to use stale cache
  if (cached) {
    console.warn(`Using stale cache for ${symbol}`);
    return cached.data;
  }

  return null;
}

/**
 * Special handling for African markets with delayed data
 */
async function fetchAfricanMarketData(config: AfricanMarketConfig): Promise<MarketAsset | null> {
  // Check cache with longer TTL for African markets
  const cached = marketDataCache.get(config.symbol);
  if (cached && Date.now() - cached.timestamp < config.updateFrequency * 60 * 1000) {
    return cached.data;
  }

  try {
    // Simulate scraping or API call for African markets
    const data = await fetchFromProvider(config.symbol, "LOCAL_SCRAPER");
    if (data) {
      data.isDelayed = true;
      data.delayMinutes = config.updateFrequency;
      marketDataCache.set(config.symbol, { data, timestamp: Date.now() });
      return data;
    }
  } catch (error) {
    console.warn(`Failed to fetch African market ${config.exchange}:`, error);
  }

  // Return mock data for demo purposes
  const mockData = generateAfricanMarketMockData(config);
  marketDataCache.set(config.symbol, { data: mockData, timestamp: Date.now() });
  return mockData;
}

/**
 * Generate mock data for African markets (for demo)
 */
function generateAfricanMarketMockData(config: AfricanMarketConfig): MarketAsset {
  const basePrice = Math.random() * 5000 + 1000;
  const changePercent = (Math.random() - 0.5) * 3;
  const change = basePrice * (changePercent / 100);

  return {
    symbol: config.symbol,
    name: `${config.exchange} Composite`,
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    region: "AFRICA",
    exchange: config.exchange,
    currency: getCurrencyForExchange(config.exchange),
    volume: Math.floor(Math.random() * 5000000),
    lastUpdated: new Date().toISOString(),
    dataSource: "LOCAL_SCRAPER",
    isDelayed: true,
    delayMinutes: config.updateFrequency,
  };
}

/**
 * Get region for a symbol
 */
function getRegionForSymbol(symbol: string): MarketRegion {
  for (const [region, indices] of Object.entries(GLOBAL_INDICES)) {
    if (indices.some((i) => i.symbol === symbol)) {
      return region as MarketRegion;
    }
  }
  return "AMERICA"; // Default
}

/**
 * Get exchange for a symbol
 */
function getExchangeForSymbol(symbol: string): string {
  for (const indices of Object.values(GLOBAL_INDICES)) {
    const found = indices.find((i) => i.symbol === symbol);
    if (found) return found.exchange;
  }
  return "UNKNOWN";
}

/**
 * Get currency for a region
 */
function getCurrencyForRegion(region: MarketRegion): string {
  const currencyMap: Record<MarketRegion, string> = {
    AFRICA: "USD", // Mixed, but using USD for simplicity
    EUROPE: "EUR",
    ASIA: "USD", // Mixed
    AMERICA: "USD",
    OCEANIA: "AUD",
  };
  return currencyMap[region] || "USD";
}

/**
 * Get currency for specific exchange
 */
function getCurrencyForExchange(exchange: string): string {
  const currencyMap: Record<string, string> = {
    BRVM: "XOF", // West African CFA franc
    JSE: "ZAR", // South African Rand
    NSE: "NGN", // Nigerian Naira
    EGX: "EGP", // Egyptian Pound
  };
  return currencyMap[exchange] || "USD";
}

/**
 * Check if a market typically has delayed data
 */
function isDelayedMarket(symbol: string): boolean {
  return AFRICAN_MARKETS.some((m) => m.symbol === symbol);
}

/**
 * Get global market overview
 */
export async function getGlobalMarketOverview(): Promise<GlobalMarketOverview> {
  const timestamp = new Date().toISOString();
  const regions: MarketRegion[] = ["AFRICA", "EUROPE", "ASIA", "AMERICA", "OCEANIA"];
  
  // Fetch all indices
  const allIndicesPromises = Object.entries(GLOBAL_INDICES).flatMap(([region, indices]) =>
    indices.map(async (index) => {
      const data = await fetchMarketData(index.symbol);
      if (data) {
        return {
          ...data,
          region: region as MarketRegion,
        } as MarketIndex;
      }
      return null;
    })
  );

  const allIndices = (await Promise.all(allIndicesPromises)).filter(
    (i): i is MarketIndex => i !== null
  );

  // Calculate region performance
  const regionPerformance = regions.map((region) => {
    const regionIndices = allIndices.filter((i) => i.region === region);
    const performance = regionIndices.length > 0
      ? regionIndices.reduce((sum, i) => sum + i.changePercent, 0) / regionIndices.length
      : 0;

    const sortedByChange = [...regionIndices].sort((a, b) => b.changePercent - a.changePercent);

    return {
      region,
      performance: Math.round(performance * 100) / 100,
      topGainer: sortedByChange[0],
      topLoser: sortedByChange[sortedByChange.length - 1],
      activeMarkets: regionIndices.length,
      totalMarkets: GLOBAL_INDICES[region].length,
    };
  });

  // Get top gainers and losers across all markets
  const sortedByChange = allIndices.sort((a, b) => b.changePercent - a.changePercent);
  const topGainers = sortedByChange.slice(0, 5);
  const topLosers = sortedByChange.slice(-5).reverse();

  // Most active by volume
  const mostActive = [...allIndices]
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 5);

  return {
    timestamp,
    regions: regionPerformance,
    topGainers,
    topLosers,
    mostActive,
    indices: allIndices,
  };
}

/**
 * Get market data for a specific region
 */
export async function getMarketByRegion(region: MarketRegion): Promise<MarketIndex[]> {
  const indices = GLOBAL_INDICES[region] || [];
  const promises = indices.map(async (index) => {
    const data = await fetchMarketData(index.symbol);
    if (data) {
      return { ...data, region } as MarketIndex;
    }
    return null;
  });

  return (await Promise.all(promises)).filter((i): i is MarketIndex => i !== null);
}

/**
 * Search for a symbol across all markets
 */
export async function searchGlobalSymbol(query: string): Promise<MarketAsset[]> {
  const results: MarketAsset[] = [];
  const allSymbols = Object.values(GLOBAL_INDICES).flatMap((indices) =>
    indices.map((i) => i.symbol)
  );

  const matchingSymbols = allSymbols.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  for (const symbol of matchingSymbols.slice(0, 10)) {
    const data = await fetchMarketData(symbol);
    if (data) {
      results.push(data);
    }
  }

  return results;
}

/**
 * Get detailed asset information
 */
export async function getAssetDetails(symbol: string): Promise<MarketAsset | null> {
  return fetchMarketData(symbol);
}

/**
 * Clear market data cache
 */
export function clearMarketCache(): void {
  marketDataCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: marketDataCache.size,
    entries: Array.from(marketDataCache.keys()),
  };
}