import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from '@/lib/stockData';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const exchange = searchParams.get("exchange");
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const results = searchStocks(query, exchange || undefined);
    return NextResponse.json(
      results.map((s) => ({
        ticker: s.ticker,
        exchange: s.exchange,
        companyName: s.companyName,
        sector: s.sector,
        currency: s.currency,
      })),
    );
  } catch (err) {
    logger.error({ err }, "Error searching stocks");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
