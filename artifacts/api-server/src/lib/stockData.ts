// Simulated stock data generator for realistic market simulation

export interface StockInfo {
  ticker: string;
  exchange: string;
  companyName: string;
  sector: string;
  currency: string;
  basePrice: number;
  region: string;
}

export const STOCK_DATABASE: StockInfo[] = [
  // NYSE
  { ticker: "AAPL", exchange: "NYSE", companyName: "Apple Inc.", sector: "Technology", currency: "USD", basePrice: 189.5, region: "North America" },
  { ticker: "MSFT", exchange: "NYSE", companyName: "Microsoft Corporation", sector: "Technology", currency: "USD", basePrice: 415.2, region: "North America" },
  { ticker: "AMZN", exchange: "NYSE", companyName: "Amazon.com Inc.", sector: "Consumer Cyclical", currency: "USD", basePrice: 178.9, region: "North America" },
  { ticker: "GOOGL", exchange: "NYSE", companyName: "Alphabet Inc.", sector: "Technology", currency: "USD", basePrice: 165.3, region: "North America" },
  { ticker: "JPM", exchange: "NYSE", companyName: "JPMorgan Chase & Co.", sector: "Financial Services", currency: "USD", basePrice: 198.4, region: "North America" },
  { ticker: "JNJ", exchange: "NYSE", companyName: "Johnson & Johnson", sector: "Healthcare", currency: "USD", basePrice: 147.8, region: "North America" },
  { ticker: "BRK.B", exchange: "NYSE", companyName: "Berkshire Hathaway Inc.", sector: "Financial Services", currency: "USD", basePrice: 392.1, region: "North America" },
  { ticker: "V", exchange: "NYSE", companyName: "Visa Inc.", sector: "Financial Services", currency: "USD", basePrice: 276.5, region: "North America" },
  // NASDAQ
  { ticker: "TSLA", exchange: "NASDAQ", companyName: "Tesla Inc.", sector: "Automotive", currency: "USD", basePrice: 242.3, region: "North America" },
  { ticker: "NVDA", exchange: "NASDAQ", companyName: "NVIDIA Corporation", sector: "Technology", currency: "USD", basePrice: 875.4, region: "North America" },
  { ticker: "META", exchange: "NASDAQ", companyName: "Meta Platforms Inc.", sector: "Technology", currency: "USD", basePrice: 524.6, region: "North America" },
  { ticker: "NFLX", exchange: "NASDAQ", companyName: "Netflix Inc.", sector: "Entertainment", currency: "USD", basePrice: 628.9, region: "North America" },
  // BRVM (West African markets)
  { ticker: "SNTS", exchange: "BRVM", companyName: "Sonatel SA", sector: "Telecommunications", currency: "XOF", basePrice: 14500, region: "Africa" },
  { ticker: "SGBCI", exchange: "BRVM", companyName: "Société Générale Côte d'Ivoire", sector: "Financial Services", currency: "XOF", basePrice: 9800, region: "Africa" },
  { ticker: "SIVC", exchange: "BRVM", companyName: "Air Côte d'Ivoire", sector: "Transportation", currency: "XOF", basePrice: 1850, region: "Africa" },
  { ticker: "ETIT", exchange: "BRVM", companyName: "Ecobank Transnational Inc.", sector: "Financial Services", currency: "XOF", basePrice: 14.5, region: "Africa" },
  { ticker: "BICI", exchange: "BRVM", companyName: "BICICI - Banque Internationale", sector: "Financial Services", currency: "XOF", basePrice: 7600, region: "Africa" },
  { ticker: "TOTAL", exchange: "BRVM", companyName: "Total Côte d'Ivoire", sector: "Energy", currency: "XOF", basePrice: 2100, region: "Africa" },
  // JSE (Johannesburg Stock Exchange)
  { ticker: "NPN", exchange: "JSE", companyName: "Naspers Limited", sector: "Technology", currency: "ZAR", basePrice: 3280, region: "Africa" },
  { ticker: "MTN", exchange: "JSE", companyName: "MTN Group Limited", sector: "Telecommunications", currency: "ZAR", basePrice: 125.4, region: "Africa" },
  { ticker: "SHP", exchange: "JSE", companyName: "Shoprite Holdings Ltd", sector: "Retail", currency: "ZAR", basePrice: 230.8, region: "Africa" },
  { ticker: "ANG", exchange: "JSE", companyName: "AngloGold Ashanti Ltd", sector: "Mining", currency: "ZAR", basePrice: 342.5, region: "Africa" },
  { ticker: "BIL", exchange: "JSE", companyName: "BHP Group Limited", sector: "Mining", currency: "ZAR", basePrice: 572.3, region: "Africa" },
  { ticker: "FSR", exchange: "JSE", companyName: "FirstRand Limited", sector: "Financial Services", currency: "ZAR", basePrice: 76.9, region: "Africa" },
  // NSE (Nigeria Stock Exchange)
  { ticker: "DANGCEM", exchange: "NSE", companyName: "Dangote Cement Plc", sector: "Materials", currency: "NGN", basePrice: 482.5, region: "Africa" },
  { ticker: "GTCO", exchange: "NSE", companyName: "Guaranty Trust Holding Co.", sector: "Financial Services", currency: "NGN", basePrice: 42.3, region: "Africa" },
  { ticker: "AIRTELAFRI", exchange: "NSE", companyName: "Airtel Africa Plc", sector: "Telecommunications", currency: "NGN", basePrice: 1248.0, region: "Africa" },
  { ticker: "ZENITHBANK", exchange: "NSE", companyName: "Zenith Bank Plc", sector: "Financial Services", currency: "NGN", basePrice: 34.5, region: "Africa" },
  // EGX (Egyptian Exchange)
  { ticker: "COMI", exchange: "EGX", companyName: "Commercial International Bank", sector: "Financial Services", currency: "EGP", basePrice: 56.8, region: "Africa" },
  { ticker: "HRHO", exchange: "EGX", companyName: "Herfy Food Services", sector: "Consumer Goods", currency: "EGP", basePrice: 12.3, region: "Africa" },
];

const MARKET_INDICES = [
  { name: "Dow Jones", exchange: "NYSE", region: "North America", currency: "USD", baseValue: 38650 },
  { name: "NASDAQ Composite", exchange: "NASDAQ", region: "North America", currency: "USD", baseValue: 16420 },
  { name: "BRVM Composite", exchange: "BRVM", region: "Africa", currency: "XOF", baseValue: 218.4 },
  { name: "JSE All Share", exchange: "JSE", region: "Africa", currency: "ZAR", baseValue: 78420 },
  { name: "Nigerian Stock Exchange", exchange: "NSE", region: "Africa", currency: "NGN", baseValue: 98540 },
  { name: "Egyptian Exchange", exchange: "EGX", region: "Africa", currency: "EGP", baseValue: 24680 },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getSimulatedPrice(basePrice: number, ticker: string, daysAgo: number = 0): number {
  const seed = ticker.charCodeAt(0) * 137 + ticker.charCodeAt(1) * 37 + daysAgo * 17;
  const dailyChange = (seededRandom(seed) - 0.48) * 0.03;
  return basePrice * Math.pow(1 + dailyChange, daysAgo);
}

export function generateStockQuote(stock: StockInfo) {
  const today = Date.now();
  const dayMs = 86400000;
  const baseNow = getSimulatedPrice(stock.basePrice, stock.ticker, 0);
  const baseYesterday = getSimulatedPrice(stock.basePrice, stock.ticker, 1);
  const price = parseFloat((baseNow * (0.995 + seededRandom(today / dayMs) * 0.01)).toFixed(4));
  const previousClose = parseFloat(baseYesterday.toFixed(4));
  const change = parseFloat((price - previousClose).toFixed(4));
  const changePct = parseFloat(((change / previousClose) * 100).toFixed(2));
  const high = parseFloat((price * (1 + seededRandom(today / dayMs + 1) * 0.02)).toFixed(4));
  const low = parseFloat((price * (1 - seededRandom(today / dayMs + 2) * 0.02)).toFixed(4));
  const open = parseFloat((previousClose * (1 + (seededRandom(today / dayMs + 3) - 0.5) * 0.01)).toFixed(4));
  const volume = Math.floor(seededRandom(today / dayMs + 4) * 5000000 + 500000);

  const historicalData = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today - i * dayMs);
    const dateStr = d.toISOString().split("T")[0];
    const p = getSimulatedPrice(stock.basePrice, stock.ticker, i);
    historicalData.push({
      date: dateStr,
      price: parseFloat(p.toFixed(4)),
      volume: Math.floor(seededRandom(i * 31 + stock.ticker.charCodeAt(0)) * 5000000 + 100000),
    });
  }

  return {
    ticker: stock.ticker,
    exchange: stock.exchange,
    companyName: stock.companyName,
    currency: stock.currency,
    price,
    change,
    changePct,
    high,
    low,
    open,
    previousClose,
    volume,
    historicalData,
  };
}

export function getMarketOverview() {
  const today = Date.now();
  const dayMs = 86400000;
  return MARKET_INDICES.map((idx) => {
    const seed = idx.exchange.charCodeAt(0) * 77 + today / dayMs;
    const changePct = parseFloat(((seededRandom(seed) - 0.47) * 2.5).toFixed(2));
    const value = parseFloat((idx.baseValue * (1 + changePct / 100)).toFixed(2));
    const change = parseFloat((value - idx.baseValue).toFixed(2));
    return {
      name: idx.name,
      exchange: idx.exchange,
      value,
      change,
      changePct,
      region: idx.region,
      currency: idx.currency,
    };
  });
}

export function searchStocks(query: string, exchange?: string): StockInfo[] {
  const q = query.toLowerCase();
  return STOCK_DATABASE.filter((s) => {
    const matchesQuery =
      s.ticker.toLowerCase().includes(q) ||
      s.companyName.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q);
    const matchesExchange = !exchange || s.exchange === exchange;
    return matchesQuery && matchesExchange;
  }).slice(0, 20);
}

export function findStock(ticker: string, exchange: string): StockInfo | undefined {
  return STOCK_DATABASE.find((s) => s.ticker === ticker && s.exchange === exchange);
}
