import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Multi-Stock Comparison API
 * Phase 6 - Comparaison multi-entreprises
 */
export async function POST(request: NextRequest) {
  try {
    const { tickers } = await request.json(); // Array of tickers
    
    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json({ error: "tickers array is required" }, { status: 400 });
    }

    const comparisonData = tickers.map(ticker => {
        const isAfrica = ticker.includes('.CI') || ticker.includes('SNTS');
        return {
            ticker,
            marketCap: isAfrica ? '1,945B XOF' : '2.84T USD',
            peRatio: isAfrica ? 12.4 : 28.4,
            dividendYield: isAfrica ? '6.8%' : '0.45%',
            revenueGrowth: isAfrica ? '12.5%' : '8.2%',
            netMargin: isAfrica ? '18.4%' : '24.1%',
            score: isAfrica ? 78 : 85 // Talent ID score for this asset
        };
    });

    return NextResponse.json(comparisonData);

  } catch (err) {
    logger.error({ err }, "Market Comparison Error");
    return NextResponse.json({ error: "Failed to compare stocks" }, { status: 500 });
  }
}
