/**
 * African Market Service
 * Specialized service for African stock exchanges with scraping and caching
 */

import type { MarketAsset, MarketIndex, AfricanMarketConfig } from "@/types/market";

// African market configurations
export const AFRICAN_MARKET_CONFIGS: AfricanMarketConfig[] = [
  // West Africa
  {
    exchange: "BRVM",
    symbol: "^BRVM",
    scraperUrl: "https://www.brvm.org/market/data",
    updateFrequency: 15, // 15 minutes
    cacheEnabled: true,
  },
  // South Africa
  {
    exchange: "JSE",
    symbol: "^J203",
    scraperUrl: "https://www.jse.co.za/market-data",
    updateFrequency: 15, // 15 minutes
    cacheEnabled: true,
  },
  // East Africa
  {
    exchange: "NSE",
    symbol: "^NGSEINDX",
    scraperUrl: "https://www.nse.com.ng/market-data",
    updateFrequency: 15, // 15 minutes
    cacheEnabled: true,
  },
  // North Africa
  {
    exchange: "EGX",
    symbol: "^CASE30",
    scraperUrl: "https://www.egx.com.eg/market-data",
    updateFrequency: 15, // 15 minutes
    cacheEnabled: true,
  },
  // Additional African exchanges
  {
    exchange: "NSE",
    symbol: "^NASI",
    scraperUrl: "https://www.nse.co.ke/market-data",
    updateFrequency: 15, // 15 minutes
    cacheEnabled: true,
  },
  {
    exchange: "USE",
    symbol: "^USE",
    scraperUrl: "https://www.use.or.ug/market-data",
    updateFrequency: 15, // 15 minutes
    cacheEnabled: true,
  },
];

// Cache for African market data with extended TTL
const africanMarketCache = new Map<string, { data: MarketAsset; timestamp: number; source: string }>();

// Historical data storage for African markets (for charts)
const historicalDataCache = new Map<string, Array<{ date: string; price: number; volume: number }>>();

/**
 * Simulate scraping African market data
 * In production, this would use puppeteer/cheerio for actual scraping
 */
async function scrapeAfricanMarket(config: AfricanMarketConfig): Promise<Partial<MarketAsset> | null> {
  // Simulate scraping delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Simulate scraping success rate (85% for demo)
  if (Math.random() > 0.85) {
    return null;
  }

  // Generate realistic data based on exchange characteristics
  const exchangeCharacteristics = getExchangeCharacteristics(config.exchange);
  
  const basePrice = exchangeCharacteristics.basePrice + (Math.random() - 0.5) * exchangeCharacteristics.volatility;
  const changePercent = (Math.random() - 0.5) * exchangeCharacteristics.volatilityPercent;
  const change = basePrice * (changePercent / 100);

  return {
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: Math.floor(Math.random() * exchangeCharacteristics.maxVolume),
    isDelayed: true,
    delayMinutes: config.updateFrequency,
  };
}

/**
 * Get exchange-specific characteristics for realistic data generation
 */
function getExchangeCharacteristics(exchange: string) {
  const characteristics: Record<string, { basePrice: number; volatility: number; volatilityPercent: number; maxVolume: number }> = {
    BRVM: { basePrice: 180, volatility: 20, volatilityPercent: 2, maxVolume: 500000 },
    JSE: { basePrice: 75000, volatility: 2000, volatilityPercent: 1.5, maxVolume: 15000000 },
    NSE: { basePrice: 50000, volatility: 1500, volatilityPercent: 2.5, maxVolume: 8000000 },
    EGX: { basePrice: 18000, volatility: 500, volatilityPercent: 2, maxVolume: 10000000 },
    USE: { basePrice: 2500, volatility: 100, volatilityPercent: 3, maxVolume: 1000000 },
  };

  return characteristics[exchange] || { basePrice: 1000, volatility: 50, volatilityPercent: 2, maxVolume: 1000000 };
}

/**
 * Get currency for African exchange
 */
function getCurrencyForExchange(exchange: string): string {
  const currencyMap: Record<string, string> = {
    BRVM: "XOF", // West African CFA franc
    JSE: "ZAR", // South African Rand
    NSE: "NGN", // Nigerian Naira (or KES for Kenya)
    EGX: "EGP", // Egyptian Pound
    USE: "UGX", // Ugandan Shilling
  };
  return currencyMap[exchange] || "USD";
}

/**
 * Get region name for African exchange
 */
function getRegionName(exchange: string): string {
  const regionMap: Record<string, string> = {
    BRVM: "WEST_AFRICA",
    JSE: "SOUTH_AFRICA",
    NSE: "EAST_AFRICA",
    EGX: "NORTH_AFRICA",
    USE: "EAST_AFRICA",
  };
  return regionMap[exchange] || "AFRICA";
}

/**
 * Fetch African market data with caching
 */
export async function fetchAfricanMarketData(
  exchange: string
): Promise<MarketAsset | null> {
  const config = AFRICAN_MARKET_CONFIGS.find(c => c.exchange === exchange);
  if (!config) {
    console.error(`No configuration found for exchange: ${exchange}`);
    return null;
  }

  // Check cache first
  const cached = africanMarketCache.get(exchange);
  const cacheTTL = config.updateFrequency * 60 * 1000; // Convert minutes to milliseconds
  
  if (cached && (Date.now() - cached.timestamp < cacheTTL)) {
    return cached.data;
  }

  try {
    // Try scraping
    const scrapedData = await scrapeAfricanMarket(config);
    
    if (scrapedData) {
      const marketData: MarketAsset = {
        symbol: config.symbol,
        name: `${exchange} Composite Index`,
        price: scrapedData.price || 0,
        change: scrapedData.change || 0,
        changePercent: scrapedData.changePercent || 0,
        region: "AFRICA",
        subRegion: getRegionName(exchange) as any,
        exchange,
        currency: getCurrencyForExchange(exchange),
        volume: scrapedData.volume,
        lastUpdated: new Date().toISOString(),
        dataSource: "LOCAL_SCRAPER",
        isDelayed: true,
        delayMinutes: config.updateFrequency,
      };

      // Update cache
      africanMarketCache.set(exchange, {
        data: marketData,
        timestamp: Date.now(),
        source: config.scraperUrl || "mock",
      });

      // Update historical data
      updateHistoricalData(exchange, marketData);

      return marketData;
    }
  } catch (error) {
    console.warn(`Scraping failed for ${exchange}:`, error);
  }

  // Fallback to cached data if available (even if stale)
  if (cached) {
    console.warn(`Using stale cache for ${exchange}`);
    return {
      ...cached.data,
      isDelayed: true,
      delayMinutes: config.updateFrequency + Math.floor((Date.now() - cached.timestamp) / 60000),
    };
  }

  // Last resort: generate mock data for demo
  return generateMockAfricanMarketData(config);
}

/**
 * Generate mock data for African markets (for demo/testing)
 */
function generateMockAfricanMarketData(config: AfricanMarketConfig): MarketAsset {
  const chars = getExchangeCharacteristics(config.exchange);
  const basePrice = chars.basePrice + (Math.random() - 0.5) * chars.volatility;
  const changePercent = (Math.random() - 0.5) * chars.volatilityPercent;
  const change = basePrice * (changePercent / 100);

  const marketData: MarketAsset = {
    symbol: config.symbol,
    name: `${config.exchange} Composite Index`,
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    region: "AFRICA",
    subRegion: getRegionName(config.exchange) as any,
    exchange: config.exchange,
    currency: getCurrencyForExchange(config.exchange),
    volume: Math.floor(Math.random() * chars.maxVolume),
    lastUpdated: new Date().toISOString(),
    dataSource: "MANUAL",
    isDelayed: true,
    delayMinutes: config.updateFrequency,
  };

  // Cache the mock data
  africanMarketCache.set(config.exchange, {
    data: marketData,
    timestamp: Date.now(),
    source: "mock",
  });

  return marketData;
}

/**
 * Update historical data for an exchange
 */
function updateHistoricalData(exchange: string, data: MarketAsset): void {
  const historical = historicalDataCache.get(exchange) || [];
  
  // Add new data point
  historical.push({
    date: data.lastUpdated,
    price: data.price,
    volume: data.volume || 0,
  });

  // Keep only last 100 data points
  if (historical.length > 100) {
    historical.splice(0, historical.length - 100);
  }

  historicalDataCache.set(exchange, historical);
}

/**
 * Get historical data for African markets
 */
export function getAfricanMarketHistorical(
  exchange: string,
  days: number = 30
): Array<{ date: string; price: number; volume: number }> {
  const historical = historicalDataCache.get(exchange) || [];
  
  // If not enough data, generate some mock historical data
  if (historical.length < days) {
    generateMockHistoricalData(exchange, days);
    return historicalDataCache.get(exchange) || [];
  }

  // Return last N days
  return historical.slice(-days);
}

/**
 * Generate mock historical data for charts
 */
function generateMockHistoricalData(exchange: string, days: number): void {
  const config = AFRICAN_MARKET_CONFIGS.find(c => c.exchange === exchange);
  if (!config) return;

  const chars = getExchangeCharacteristics(exchange);
  const historical = historicalDataCache.get(exchange) || [];
  
  // Generate historical data points
  let currentPrice = chars.basePrice;
  const now = new Date();
  
  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random walk with drift
    const change = (Math.random() - 0.48) * chars.volatility * 0.3;
    currentPrice = Math.max(currentPrice + change, chars.basePrice * 0.5);
    
    historical.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(Math.random() * chars.maxVolume),
    });
  }

  historicalDataCache.set(exchange, historical);
}

/**
 * Get all African markets overview
 */
export async function getAfricanMarketsOverview(): Promise<{
  markets: MarketAsset[];
  summary: {
    totalMarkets: number;
    advancing: number;
    declining: number;
    unchanged: number;
    avgChange: number;
  };
}> {
  const markets: MarketAsset[] = [];
  
  // Fetch data for all configured exchanges
  const promises = AFRICAN_MARKET_CONFIGS.map(config => 
    fetchAfricanMarketData(config.exchange)
  );

  const results = await Promise.all(promises);
  
  for (const market of results) {
    if (market) {
      markets.push(market);
    }
  }

  // Calculate summary statistics
  const advancing = markets.filter(m => m.changePercent > 0).length;
  const declining = markets.filter(m => m.changePercent < 0).length;
  const unchanged = markets.filter(m => m.changePercent === 0).length;
  const avgChange = markets.reduce((sum, m) => sum + m.changePercent, 0) / markets.length;

  return {
    markets,
    summary: {
      totalMarkets: markets.length,
      advancing,
      declining,
      unchanged,
      avgChange: Math.round(avgChange * 100) / 100,
    },
  };
}

/**
 * Get specific African market index
 */
export async function getAfricanMarketIndex(exchange: string): Promise<MarketIndex | null> {
  const market = await fetchAfricanMarketData(exchange);
  if (!market) return null;

  return {
    ...market,
    components: getMarketComponents(exchange),
  } as MarketIndex;
}

/**
 * Get top components for an African exchange (mock data)
 */
function getMarketComponents(exchange: string): string[] {
  const components: Record<string, string[]> = {
    BRVM: ["SONATEL", "Ecobank", "SGSI", "SICOR", "AIR COTE D'IVOIRE"],
    JSE: ["NPN", "PRX", "FSR", "ANG", "SHP"],
    NSE: ["MTNN", "DANGCEM", "BUACEMENT", "ZENITHBANK", "GTCO"],
    EGX: ["COMI", "HRHO", "ESRS", "SWDY", "TMGH"],
    USE: ["EABL", "SCBK", "DTK", "UMEM", "NCMG"],
  };

  return components[exchange] || [];
}

/**
 * Clear African market cache
 */
export function clearAfricanMarketCache(): void {
  africanMarketCache.clear();
  historicalDataCache.clear();
}

/**
 * Get cache status for African markets
 */
export function getAfricanMarketCacheStatus(): {
  exchange: string;
  cached: boolean;
  age: number;
  source: string;
}[] {
  return AFRICAN_MARKET_CONFIGS.map(config => {
    const cached = africanMarketCache.get(config.exchange);
    return {
      exchange: config.exchange,
      cached: !!cached,
      age: cached ? Math.floor((Date.now() - cached.timestamp) / 60000) : -1,
      source: cached?.source || "none",
    };
  });
}