import { NextRequest, NextResponse } from "next/server";
import { MarketDataHub } from "@workspace/integrations/marketHub";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const exchange = searchParams.get("exchange") || 'NYSE';
    
    if (!ticker) {
      return NextResponse.json(
        { error: "ticker is required" },
        { status: 400 },
      );
    }

    try {
      const quote = await MarketDataHub.getQuote(ticker, exchange);
      return NextResponse.json(quote);
    } catch (e: any) {
      logger.error({ ticker, error: e }, "Hub fetch failed");
      return NextResponse.json({ error: e.message || "Market data unavailable" }, { status: 502 });
    }
  } catch (err) {
    logger.error({ err }, "Error in quote API");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
