import { logger } from "@/lib/logger";
import { cacheGet, cacheSet, checkRateLimit } from "./redis";

interface MarketQuote {
  ticker: string;
  exchange: string;
  price: number;
  change: number;
  changePct: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  volume?: number;
  realtime: boolean;
  source: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MarketDataHub {
  private static finnhubKey = process.env.FINNHUB_KEY;
  private static alphaVantageKey = process.env.ALPHA_VANTAGE_KEY;

  /**
   * Fetch a single quote from the appropriate source, with Cache & Rate Limiting
   */
  static async getQuote(ticker: string, exchange: string): Promise<MarketQuote> {
    const cacheKey = `quote:${ticker}:${exchange}`;
    // 1. Check cache first (saves API calls)
    const cached = await cacheGet<MarketQuote>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Check rate limit before fetching
    const rl = await checkRateLimit("market_quote_api");
    if (!rl.success) {
      logger.warn({ ticker }, "Rate limit exceeded for Market Data APIs");
      throw new Error("Rate limit exceeded for fetching market data.");
    }

    const isCrypto = exchange === 'BINANCE' || ticker.endsWith('USDT');
    
    let result: MarketQuote;
    if (isCrypto) {
      result = await this.getBinanceQuote(ticker);
    } else if (exchange === 'NYSE' || exchange === 'NASDAQ') {
      result = await this.getFinnhubQuote(ticker, exchange);
    } else {
      // Default to Alpha Vantage for Forex/Commodities
      result = await this.getAlphaVantageQuote(ticker, exchange);
    }

    // 3. Set Cache (30 seconds TTL for fast-moving markets, but prevents bursts)
    await cacheSet(cacheKey, result, 30);
    return result;
  }

  private static async getBinanceQuote(ticker: string): Promise<MarketQuote> {
    try {
      const symbol = ticker.toUpperCase();
      const resp = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const data = await resp.json();
      return {
        ticker: symbol,
        exchange: 'BINANCE',
        price: parseFloat(data.lastPrice),
        change: parseFloat(data.priceChange),
        changePct: parseFloat(data.priceChangePercent),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        realtime: true,
        source: 'Binance'
      };
    } catch (e) {
      throw new Error(`Binance fetch failed for ${ticker}`);
    }
  }

  private static async getFinnhubQuote(ticker: string, exchange: string): Promise<MarketQuote> {
    if (!this.finnhubKey) throw new Error("Finnhub key missing");
    try {
      const resp = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${this.finnhubKey}`);
      const data = await resp.json();
      return {
        ticker,
        exchange,
        price: data.c,
        change: data.d,
        changePct: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        realtime: true,
        source: 'Finnhub'
      };
    } catch (e) {
      throw new Error(`Finnhub fetch failed for ${ticker}`);
    }
  }

  private static async getAlphaVantageQuote(ticker: string, exchange: string): Promise<MarketQuote> {
    if (!this.alphaVantageKey) throw new Error("Alpha Vantage key missing");
    try {
      // Global Quote endpoint
      const resp = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${this.alphaVantageKey}`);
      const data = await resp.json();
      const quote = data["Global Quote"];
      return {
        ticker,
        exchange,
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePct: parseFloat(quote["10. change percent"]?.replace('%', '') || 0),
        high: parseFloat(quote["03. high"]),
        low: parseFloat(quote["04. low"]),
        volume: parseFloat(quote["06. volume"]),
        realtime: false, // AV global quote is typically 15m delayed
        source: 'Alpha Vantage'
      };
    } catch (e) {
      throw new Error(`Alpha Vantage fetch failed for ${ticker}`);
    }
  }

  /**
   * Fetch historical candlestick data
   */
  static async getCandles(ticker: string, timeframe: string = 'daily'): Promise<Candle[]> {
    const cacheKey = `candles:${ticker}:${timeframe}`;
    const cached = await cacheGet<Candle[]>(cacheKey);
    if (cached) return cached;

    const rl = await checkRateLimit("market_candles_api");
    if (!rl.success) {
      throw new Error("Rate limit exceeded for API.");
    }

    if (!this.alphaVantageKey) throw new Error("Alpha Vantage key missing");
    
    // Defaulting to Alpha Vantage as it's the most robust for time-series
    const func = timeframe === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
    const intervalArg = timeframe === 'daily' ? '' : '&interval=60min';
    
    try {
      const url = `https://www.alphavantage.co/query?function=${func}${intervalArg}&symbol=${ticker}&apikey=${this.alphaVantageKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      
      const timeSeriesKey = timeframe === 'daily' ? "Time Series (Daily)" : "Time Series (60min)";
      const series = data[timeSeriesKey];
      
      if (!series) return [];

      const result = Object.entries(series).map(([time, values]: [string, any]) => ({
        time: new Date(time).getTime(),
        open: parseFloat(values["1. open"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
        close: parseFloat(values["4. close"]),
        volume: parseFloat(values["5. volume"]),
      })).reverse(); // Return in chronological order
      
      // Cache historical data longer (e.g. 5 minutes)
      await cacheSet(cacheKey, result, 300);
      return result;
    } catch (e) {
      logger.error({ e, ticker }, "Failed to fetch historical candles");
      return [];
    }
  }
}
