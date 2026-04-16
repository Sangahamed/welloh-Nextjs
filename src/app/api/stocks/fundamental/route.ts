import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Fundamental Analysis API
 * Phase 6 - Analyse entreprise complète
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    
    if (!ticker) {
      return NextResponse.json({ error: "ticker is required" }, { status: 400 });
    }

    const finnhubKey = process.env.FINNHUB_KEY;
    
    // In a production app, we would fetch from multiple endpoints (Profile2, Metric, etc.)
    // For now, we simulate high-quality fundamental data based on the region.
    
    const isAfrica = ticker.includes('SNTS') || ticker.includes('SGBCI') || ticker.includes('ETIT');

    const fundamentalData = isAfrica ? {
        ticker,
        companyName: ticker === 'SNTS' ? 'Sonatel' : 'Societe Generale CI',
        marketCap: ticker === 'SNTS' ? '1,945B XOF' : '820B XOF',
        peRatio: '12.4',
        pbRatio: '2.1',
        dividendYield: '6.8%',
        eps: '1,540 XOF',
        revenueGrowth: '+12.5%',
        netMargin: '18.4%',
        description: `${ticker} is a leading operator in the West African financial/telecom markets, showing strong dividend yields and consistent revenue growth.`
    } : {
        ticker,
        companyName: ticker,
        marketCap: '2.84T USD',
        peRatio: '28.42',
        pbRatio: '14.5',
        dividendYield: '0.45%',
        eps: '6.42 USD',
        revenueGrowth: '+8.2%',
        netMargin: '24.1%',
        description: `Global leader in technology and services. High PE ratio reflects growth expectations in AI and hardware services.`
    };

    return NextResponse.json(fundamentalData);

  } catch (err) {
    logger.error({ err }, "Fundamental Analysis Fetch Error");
    return NextResponse.json({ error: "Failed to fetch fundamental data" }, { status: 500 });
  }
}
