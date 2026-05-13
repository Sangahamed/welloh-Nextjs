import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { portfoliosTable, holdingsTable, transactionsTable, ordersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getApiAuth, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();
    const { userId } = auth;

    const { symbol: symbolFromRequest, ticker, exchange, type, side, shares, price: manualPrice, stopPrice } = await request.json();
    const symbol = symbolFromRequest || ticker;

    if (!symbol || !exchange || !type || !side || !shares) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const portfolio = await db.query.portfoliosTable.findFirst({ where: eq(portfoliosTable.userId, userId) });
    if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

    if (side === "SELL") {
      const existing = await db.query.holdingsTable.findFirst({
        where: and(eq(holdingsTable.portfolioId, portfolio.id), eq(holdingsTable.symbol, symbol)),
      });
      if (!existing || parseFloat(existing.shares || "0") < shares) {
        return NextResponse.json({ error: "Insufficient shares to place sell order" }, { status: 400 });
      }
    }

    // Ordre avancé (non MARKET) → enregistrer en PENDING
    if (type !== "MARKET") {
      const orderTotalCost = manualPrice ? parseFloat(manualPrice) * shares : 0;
      if (side === "BUY" && parseFloat(portfolio.currentBalance || "0") < orderTotalCost) {
        return NextResponse.json({ error: "Insufficient funds for this order" }, { status: 400 });
      }
      await db.transaction(async (tx) => {
        await tx.insert(ordersTable).values({
          portfolioId: portfolio.id, ticker: symbol, exchange, type: type as any, side: side as any,
          shares: String(shares), price: manualPrice ? String(manualPrice) : null,
          stopPrice: stopPrice ? String(stopPrice) : null, status: "PENDING",
        });
        if (side === "BUY") {
          await tx.update(portfoliosTable)
            .set({ currentBalance: sql`${portfoliosTable.currentBalance} - ${orderTotalCost}` })
            .where(eq(portfoliosTable.id, portfolio.id));
        }
      });
      return NextResponse.json({ success: true, message: `${type} order created and queued.`, status: "PENDING" });
    }

    // Ordre MARKET → exécution immédiate
    let spotPrice = 0;
    try {
      const origin = new URL(request.url).origin;
      const yfResponse = await fetch(`${origin}/api/stocks/yf?ticker=${symbol}`);
      if (yfResponse.ok) {
        const yfData = await yfResponse.json();
        spotPrice = yfData.price;
      }
    } catch {
      spotPrice = manualPrice || 100;
    }
    if (!spotPrice) spotPrice = manualPrice || 100;

    const feeRate = 0.001;
    const slippage = 0.001;
    const executionPrice = side === "BUY" ? spotPrice * (1 + slippage) : spotPrice * (1 - slippage);
    const commission = executionPrice * shares * feeRate;
    const totalCost = executionPrice * shares + (side === "BUY" ? commission : -commission);

    if (side === "BUY" && parseFloat(portfolio.currentBalance || "0") < totalCost) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    return await db.transaction(async (tx) => {
      await tx.insert(ordersTable).values({
        portfolioId: portfolio.id, ticker: symbol, exchange, type: "MARKET", side: side as any,
        shares: String(shares), price: String(executionPrice), status: "FILLED", filledAt: sql`now()`,
      });

      const cashAdjustment = side === "BUY"
        ? sql`${portfoliosTable.currentBalance} - ${totalCost}`
        : sql`${portfoliosTable.currentBalance} + ${totalCost}`;
      await tx.update(portfoliosTable).set({ currentBalance: cashAdjustment }).where(eq(portfoliosTable.id, portfolio.id));

      if (side === "BUY") {
        const existing = await tx.query.holdingsTable.findFirst({
          where: and(eq(holdingsTable.portfolioId, portfolio.id), eq(holdingsTable.symbol, symbol)),
        });
        if (existing) {
          const newShares = parseFloat(existing.shares || "0") + shares;
          const newAvgPrice = (parseFloat(existing.averagePrice || "0") * parseFloat(existing.shares || "0") + executionPrice * shares) / newShares;
          await tx.update(holdingsTable).set({ shares: String(newShares), averagePrice: String(newAvgPrice), updatedAt: sql`now()` }).where(eq(holdingsTable.id, existing.id));
        } else {
          await tx.insert(holdingsTable).values({ portfolioId: portfolio.id, symbol, shares: String(shares), averagePrice: String(executionPrice) });
        }
      } else {
        const existing = await tx.query.holdingsTable.findFirst({
          where: and(eq(holdingsTable.portfolioId, portfolio.id), eq(holdingsTable.symbol, symbol)),
        });
        const remainingShares = parseFloat(existing!.shares || "0") - shares;
        if (remainingShares <= 0) {
          await tx.delete(holdingsTable).where(eq(holdingsTable.id, existing!.id));
        } else {
          await tx.update(holdingsTable).set({ shares: String(remainingShares), updatedAt: sql`now()` }).where(eq(holdingsTable.id, existing!.id));
        }
      }

      await tx.insert(transactionsTable).values({
        portfolioId: portfolio.id, symbol, transactionType: side.toLowerCase(),
        shares: String(shares), price: String(executionPrice), totalValue: String(totalCost),
        commission: String(commission), status: "completed",
      });

      return NextResponse.json({ success: true, executionPrice, shares, totalCost, commission, status: "FILLED" });
    });
  } catch (err: any) {
    logger.error({ err }, "Trading Engine Error");
    return NextResponse.json({ error: err.message || "Failed to process order" }, { status: 500 });
  }
}