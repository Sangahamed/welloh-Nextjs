import { NextRequest, NextResponse } from "next/server";
import { MarketDataHub } from "@workspace/integrations/marketHub";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const timeframe = searchParams.get("timeframe") || 'daily';

    if (!ticker) {
      return NextResponse.json({ error: "ticker is required" }, { status: 400 });
    }

    const candles = await MarketDataHub.getCandles(ticker, timeframe);

    return NextResponse.json({
      ticker,
      timeframe,
      candles
    });
  } catch (err: any) {
    logger.error({ err }, "Candles API Error");
    return NextResponse.json({ error: err.message || "Failed to fetch candles" }, { status: 500 });
  }
}
