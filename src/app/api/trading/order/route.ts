import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { portfoliosTable, holdingsTable, transactionsTable, ordersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Welloh Trading Engine API
 * Supports MARKET execution and PENDING advanced orders (LIMIT, STOP_LOSS, TAKE_PROFIT, OCO, TRAILING_STOP)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      symbol: symbolFromRequest, // Renamed from ticker
      ticker, // Fallback for old clients
      exchange, 
      type, // MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT, OCO, TRAILING_STOP
      side, // BUY, SELL
      shares,
      price: manualPrice, // Used as target price for limit/advanced
      stopPrice // Used for stop_loss, trailing stop, or secondary trigger for OCO
    } = await request.json();

    const symbol = symbolFromRequest || ticker;

    if (!symbol || !exchange || !type || !side || !shares) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Portfolio Verification
    const portfolio = await db.query.portfoliosTable.findFirst({
      where: eq(portfoliosTable.userId, userId),
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Sell validation (ensure they have shares before even placing a LIMIT or STOP sell)
    if (side === "SELL") {
      const existing = await db.query.holdingsTable.findFirst({
        where: and(eq(holdingsTable.portfolioId, portfolio.id), eq(holdingsTable.symbol, symbol))
      });
      if (!existing || parseFloat(existing.shares || "0") < shares) {
        return NextResponse.json({ error: "Insufficient shares to place sell order" }, { status: 400 });
      }
    }

    // For Advanced Orders (Non-Market), just record them to the DB holding queue
    if (type !== "MARKET") {
      const orderTotalCost = manualPrice ? (parseFloat(manualPrice) * shares) : 0;
      
      // If BUY limit, lock funds immediately to ensure solvency upon execution
      if (side === "BUY") {
        if (parseFloat(portfolio.currentBalance || "0") < orderTotalCost) {
          return NextResponse.json({ error: "Insufficient funds for this Limit/Advanced order" }, { status: 400 });
        }
      }

      await db.transaction(async (tx) => {
        // Create the PENDING order
        await tx.insert(ordersTable).values({
          portfolioId: portfolio.id,
          ticker: symbol, // Table still uses 'ticker' for compatibility or symbol? Oh I checked orders.ts it has ticker.
          exchange,
          type: type as any,
          side: side as any,
          shares: String(shares),
          price: manualPrice ? String(manualPrice) : null,
          stopPrice: stopPrice ? String(stopPrice) : null,
          status: "PENDING"
        });

        // Deduct locked cash for buys
        if (side === "BUY") {
           await tx.update(portfoliosTable)
             .set({ currentBalance: sql`${portfoliosTable.currentBalance} - ${orderTotalCost}` })
             .where(eq(portfoliosTable.id, portfolio.id));
        }
      });

      return NextResponse.json({
        success: true,
        message: `${type} order created successfully and queued for execution.`,
        status: "PENDING"
      });
    }

    // -------------------------------------------------------------
    // MARKET ORDER (Instant Execution)
    // -------------------------------------------------------------
    
    // Get Current Market Price via internal API
    let spotPrice = 0;
    try {
      const origin = new URL(request.url).origin;
      const yfResponse = await fetch(`${origin}/api/stocks/yf?ticker=${symbol}`);
      if (yfResponse.ok) {
        const yfData = await yfResponse.json();
        spotPrice = yfData.price;
      }
    } catch (e) {
      logger.warn({ symbol, error: e }, "Failed to fetch real price for market order, using fallback");
      spotPrice = manualPrice || 100;
    }

    const feeRate = 0.001; // 0.1% fees
    const slippage = 0.001; // 0.1% slippage 
    const executionPrice = side === "BUY" ? spotPrice * (1 + slippage) : spotPrice * (1 - slippage);
    const commission = executionPrice * shares * feeRate;
    const totalCost = (executionPrice * shares) + (side === "BUY" ? commission : -commission);

    if (side === "BUY" && parseFloat(portfolio.currentBalance || "0") < totalCost) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    // Execution
    return await db.transaction(async (tx) => {
      
      // 1. Log to Orders as FILLED
      await tx.insert(ordersTable).values({
        portfolioId: portfolio.id,
        ticker: symbol,
        exchange,
        type: "MARKET",
        side: side as any,
        shares: String(shares),
        price: String(executionPrice),
        status: "FILLED",
        filledAt: sql`now()`
      });

      // 2. Adjust Balance
      const cashAdjustment = side === "BUY" 
        ? sql`${portfoliosTable.currentBalance} - ${totalCost}` 
        : sql`${portfoliosTable.currentBalance} + ${totalCost}`;
        
      await tx.update(portfoliosTable)
        .set({ currentBalance: cashAdjustment })
        .where(eq(portfoliosTable.id, portfolio.id));

      // 3. Adjust Holdings
      if (side === "BUY") {
        const existing = await tx.query.holdingsTable.findFirst({
          where: and(eq(holdingsTable.portfolioId, portfolio.id), eq(holdingsTable.symbol, symbol))
        });

        if (existing) {
          const newShares = parseFloat(existing.shares || "0") + shares;
          const newAvgPrice = (parseFloat(existing.averagePrice || "0") * parseFloat(existing.shares || "0") + executionPrice * shares) / newShares;
          await tx.update(holdingsTable)
            .set({ shares: String(newShares), averagePrice: String(newAvgPrice), updatedAt: sql`now()` })
            .where(eq(holdingsTable.id, existing.id));
        } else {
          await tx.insert(holdingsTable).values({
            portfolioId: portfolio.id,
            symbol: symbol,
            shares: String(shares),
            averagePrice: String(executionPrice)
          });
        }
      } else {
        const existing = await tx.query.holdingsTable.findFirst({
          where: and(eq(holdingsTable.portfolioId, portfolio.id), eq(holdingsTable.symbol, symbol))
        });
        const remainingShares = parseFloat(existing!.shares || "0") - shares;
        if (remainingShares <= 0) {
          await tx.delete(holdingsTable).where(eq(holdingsTable.id, existing!.id));
        } else {
          await tx.update(holdingsTable)
            .set({ shares: String(remainingShares), updatedAt: sql`now()` })
            .where(eq(holdingsTable.id, existing!.id));
        }
      }

      // 4. Log Transaction
      await tx.insert(transactionsTable).values({
        portfolioId: portfolio.id,
        symbol: symbol,
        transactionType: side.toLowerCase(), // buy, sell
        shares: String(shares),
        price: String(executionPrice),
        totalValue: String(totalCost),
        commission: String(commission),
        status: "completed"
      });

      return NextResponse.json({
        success: true,
        executionPrice,
        shares,
        totalCost,
        commission,
        status: "FILLED"
      });
    });

  } catch (err: any) {
    logger.error({ err }, "Trading Engine Error");
    return NextResponse.json({ error: err.message || "Failed to process order" }, { status: 500 });
  }
}
