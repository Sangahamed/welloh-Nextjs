import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import {
  portfoliosTable,
  holdingsTable,
  transactionsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from '@/lib/logger';

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol: symbolReq, ticker, exchange, type, shares, price } = await request.json();
    const symbol = symbolReq || ticker;

    if (!symbol || !type || !shares || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const numShares = parseFloat(shares);
    const numPrice = parseFloat(price);
    const FEE_RATE = 0.001; // 0.1%
    const SLIPPAGE_RATE = 0.0005; // 0.05%

    const slippageMultiplier = type === "BUY" ? 1 + SLIPPAGE_RATE : 1 - SLIPPAGE_RATE;
    const effectivePrice = numPrice * slippageMultiplier;
    const grossTotal = numShares * effectivePrice;
    const commission = parseFloat((grossTotal * FEE_RATE).toFixed(4));
    const total = type === "BUY" ? grossTotal + commission : grossTotal - commission;

    const portfolio = await ensurePortfolio(userId);
    const currentBalance = parseFloat(portfolio.currentBalance || "0");

    if (type === "BUY") {
      if (total > currentBalance) {
        return NextResponse.json(
          { error: "Insufficient funds" },
          { status: 400 },
        );
      }

      const existing = await db.query.holdingsTable.findFirst({
        where: and(
          eq(holdingsTable.portfolioId, portfolio.id),
          eq(holdingsTable.symbol, symbol)
        ),
      });

      if (existing) {
        const existingShares = parseFloat(existing.shares || "0");
        const existingPrice = parseFloat(existing.averagePrice || "0");
        const newShares = existingShares + numShares;
        const avgPrice = (existingShares * existingPrice + numShares * effectivePrice) / newShares;
        await db
          .update(holdingsTable)
          .set({
            shares: newShares.toFixed(4),
            averagePrice: avgPrice.toFixed(4),
          })
          .where(eq(holdingsTable.id, existing.id));
      } else {
        await db.insert(holdingsTable).values({
          portfolioId: portfolio.id,
          symbol,
          shares: numShares.toFixed(4),
          averagePrice: effectivePrice.toFixed(4),
        });
      }

      const newBalance = currentBalance - total;
      await db
        .update(portfoliosTable)
        .set({ currentBalance: newBalance.toFixed(4) })
        .where(eq(portfoliosTable.id, portfolio.id));

      const [transaction] = await db
        .insert(transactionsTable)
        .values({
          portfolioId: portfolio.id,
          symbol,
          transactionType: "BUY",
          shares: numShares.toFixed(4),
          price: effectivePrice.toFixed(4),
          commission: commission.toFixed(4),
          totalValue: total.toFixed(4),
          status: "completed"
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: `Bought ${numShares} shares of ${symbol} at ${effectivePrice.toFixed(2)}`,
        transaction,
        newBalance,
      });
    } else if (type === "SELL") {
      const existing = await db.query.holdingsTable.findFirst({
        where: and(
          eq(holdingsTable.portfolioId, portfolio.id),
          eq(holdingsTable.symbol, symbol)
        ),
      });

      if (!existing || parseFloat(existing.shares || "0") < numShares) {
        return NextResponse.json(
          { error: "Insufficient shares" },
          { status: 400 },
        );
      }

      const remainingShares = parseFloat(existing.shares || "0") - numShares;
      if (remainingShares < 0.0001) {
        await db.delete(holdingsTable).where(eq(holdingsTable.id, existing.id));
      } else {
        await db
          .update(holdingsTable)
          .set({ shares: remainingShares.toFixed(4) })
          .where(eq(holdingsTable.id, existing.id));
      }

      const proceeds = grossTotal - commission;
      const newBalance = currentBalance + proceeds;
      await db
        .update(portfoliosTable)
        .set({ currentBalance: newBalance.toFixed(4) })
        .where(eq(portfoliosTable.id, portfolio.id));

      const [transaction] = await db
        .insert(transactionsTable)
        .values({
          portfolioId: portfolio.id,
          symbol,
          transactionType: "SELL",
          shares: numShares.toFixed(4),
          price: effectivePrice.toFixed(4),
          commission: commission.toFixed(4),
          totalValue: proceeds.toFixed(4),
          status: "completed"
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: `Sold ${numShares} shares of ${symbol} at ${effectivePrice.toFixed(2)}`,
        transaction,
        newBalance,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid trade type" },
        { status: 400 },
      );
    }
  } catch (err) {
    logger.error({ err }, "Error executing trade");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
