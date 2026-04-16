import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { cacheGet, cacheSet, checkRateLimit } from "@workspace/integrations/redis";

/**
 * Yahoo Finance Proxy API
 * Objective: Fetch real-time (delayed) stock data from YF.
 * Phase 1 - Source Principale
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    
    if (!ticker) {
      return NextResponse.json({ error: "ticker is required" }, { status: 400 });
    }

    const { success } = await checkRateLimit(request.headers.get("x-forwarded-for") || "anonymous_yf_user");
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded for Yahoo Finance proxy" }, { status: 429 });
    }

    const cacheKey = `yf_quote:${ticker}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached);

    // YF v8 Chart API (Publicly accessible for most stocks)
    // Note: Use .SA, .PA, etc. for international markets if needed.
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`YF API responded with ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    const indicators = result.indicators.quote[0];
    
    // Extract latest valid price
    const prices = indicators.close.filter((p: any) => p !== null);
    const currentPrice = prices[prices.length - 1] || meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePct = (change / previousClose) * 100;

    const finalData = {
      ticker: meta.symbol,
      exchange: meta.exchangeName,
      price: currentPrice,
      change,
      changePct,
      currency: meta.currency,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      realtime: true,
      source: 'Yahoo Finance'
    };

    await cacheSet(cacheKey, finalData, 15); // Cache for 15s to bypass throttling
    return NextResponse.json(finalData);

  } catch (err) {
    logger.error({ err }, "Yahoo Finance Fetch Error");
    return NextResponse.json({ error: "Failed to fetch from Yahoo Finance" }, { status: 500 });
  }
}
