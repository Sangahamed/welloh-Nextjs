import { NextResponse } from "next/server";
import { getMarketOverview } from '@/lib/stockData';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const markets = getMarketOverview();
    return NextResponse.json(markets);
  } catch (err) {
    logger.error({ err }, "Error fetching market overview");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
