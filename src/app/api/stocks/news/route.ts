import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Real-time Market News API
 * Phase 6 - News Temps Réel
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    
    // Using Finnhub as news source if available, otherwise fallback to mock
    const finnhubKey = process.env.FINNHUB_KEY;
    const url = ticker 
      ? `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=2024-01-01&to=2024-12-31&token=${finnhubKey}`
      : `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`;

    if (finnhubKey) {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data.slice(0, 10)); // Top 10 news
      }
    }

    // Fallback Mock News
    const mockNews = [
      {
        id: 1,
        headline: "Sonatel reports 15% growth in mobile data revenue",
        summary: "The West African telecom giant continues to lead the BRVM with strong financials.",
        url: "#",
        datetime: Date.now() / 1000 - 3600,
        image: "https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=200&h=120&auto=format&fit=crop",
        source: "BRVM Echo"
      },
      {
        id: 2,
        headline: "Bitcoin crosses $65k as institutional interest surges",
        summary: "Spot ETF inflows reach record highs according to latest blockchain data.",
        url: "#",
        datetime: Date.now() / 1000 - 7200,
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=200&h=120&auto=format&fit=crop",
        source: "CryptoGlobal"
      },
      {
        id: 3,
        headline: "JPMorgan upgrades Nigeria bank outlook",
        summary: "Following series of currency reforms, Nigerian banks see improved liquidity.",
        url: "#",
        datetime: Date.now() / 1000 - 10800,
        image: "https://images.unsplash.com/photo-1611974717483-36005370390f?q=80&w=200&h=120&auto=format&fit=crop",
        source: "Africa Finance Review"
      }
    ];

    return NextResponse.json(mockNews);

  } catch (err) {
    logger.error({ err }, "Market News Fetch Error");
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
