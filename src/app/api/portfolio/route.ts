import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { portfoliosTable, holdingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from '@/lib/logger';
import { generateStockQuote, findStock } from '@/lib/stockData';

async function ensurePortfolio(userId: string) {
  let portfolio = await db.query.portfoliosTable.findFirst({
    where: eq(portfoliosTable.userId, userId),
  });
  if (!portfolio) {
    const [newPortfolio] = await db
      .insert(portfoliosTable)
      .values({ 
        userId, 
        name: "Main Portfolio",
        currentBalance: "100000", 
        initialBalance: "100000" 
      })
      .returning();
    portfolio = newPortfolio;
  }
  return portfolio;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolio = await ensurePortfolio(userId);
    const holdings = await db.query.holdingsTable.findMany({
      where: eq(holdingsTable.portfolioId, portfolio.id),
    });

    const holdingsWithPrices = holdings.map((h: any) => {
      // Assuming symbol matches ticker/name from mock data
      const stock = findStock(h.symbol, "US"); 
      const quote = stock ? generateStockQuote(stock) : null;
      const currentPrice = quote?.price ?? parseFloat(h.averagePrice);
      const shares = parseFloat(h.shares);
      const averagePrice = parseFloat(h.averagePrice);
      const currentValue = shares * currentPrice;
      const gainLoss = currentValue - (shares * averagePrice);
      const gainLossPct = averagePrice > 0 ? (gainLoss / (shares * averagePrice)) * 100 : 0;

      return {
        id: h.id,
        symbol: h.symbol,
        shares,
        averagePrice,
        currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        gainLoss: parseFloat(gainLoss.toFixed(2)),
        gainLossPct: parseFloat(gainLossPct.toFixed(2)),
      };
    });

    return NextResponse.json({
      id: portfolio.id,
      name: portfolio.name,
      currentBalance: parseFloat(portfolio.currentBalance || "0"),
      initialBalance: parseFloat(portfolio.initialBalance || "0"),
      holdings: holdingsWithPrices,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching portfolio");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
