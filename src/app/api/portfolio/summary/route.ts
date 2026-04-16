import { getUserId } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import {
  portfoliosTable,
  holdingsTable,
  transactionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { generateStockQuote, findStock } from "@/lib/stockData";

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
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolio = await ensurePortfolio(userId);
    const holdings = await db.query.holdingsTable.findMany({
      where: eq(holdingsTable.portfolioId, portfolio.id),
    });
    const transactions = await db.query.transactionsTable.findMany({
      where: eq(transactionsTable.portfolioId, portfolio.id),
    });

    const currentBalance = parseFloat(portfolio.currentBalance || "0");
    const initialBalance = parseFloat(portfolio.initialBalance || "0");

    let holdingsValue = 0;
    for (const h of holdings) {
      const stock = findStock(h.symbol, "US");
      const quote = stock ? generateStockQuote(stock) : null;
      const price = quote?.price ?? parseFloat(h.averagePrice || "0");
      holdingsValue += parseFloat(h.shares || "0") * price;
    }

    const totalValue = currentBalance + holdingsValue;
    const totalGainLoss = totalValue - initialBalance;
    const totalGainLossPct = initialBalance > 0 ? (totalGainLoss / initialBalance) * 100 : 0;

    // Calculate win rate from sell transactions
    const sells = transactions.filter((t) => t.transactionType?.toUpperCase() === "SELL");
    let wins = 0;
    for (const sell of sells) {
      // Find the average purchase price for this symbol
      const buys = transactions.filter(
        (t) =>
          t.transactionType?.toUpperCase() === "BUY" &&
          t.symbol === sell.symbol
      );
      if (buys.length > 0) {
        const avgBuyPrice =
          buys.reduce((sum, b) => sum + parseFloat(b.price || "0"), 0) / buys.length;
        if (parseFloat(sell.price || "0") > avgBuyPrice) wins++;
      }
    }
    const winRate = sells.length > 0 ? (wins / sells.length) * 100 : 0;

    return NextResponse.json({
      id: portfolio.id,
      name: portfolio.name,
      totalValue: parseFloat(totalValue.toFixed(2)),
      currentBalance: parseFloat(currentBalance.toFixed(2)),
      holdingsValue: parseFloat(holdingsValue.toFixed(2)),
      totalGainLoss: parseFloat(totalGainLoss.toFixed(2)),
      totalGainLossPct: parseFloat(totalGainLossPct.toFixed(2)),
      initialBalance,
      winRate: parseFloat(winRate.toFixed(1)),
      totalTrades: transactions.length,
    });
  } catch (err: any) {
    logger.error({ err }, "Error fetching portfolio summary");
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
