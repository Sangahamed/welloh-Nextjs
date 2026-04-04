import { Router } from "express";
import { db } from "@workspace/db";
import { portfoliosTable, holdingsTable, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateStockQuote, findStock } from "../lib/stockData";

const router = Router();

// Ensure portfolio exists for user
async function ensurePortfolio(userId: string) {
  let portfolio = await db.query.portfoliosTable.findFirst({
    where: eq(portfoliosTable.userId, userId),
  });
  if (!portfolio) {
    const [newPortfolio] = await db
      .insert(portfoliosTable)
      .values({ userId, cashBalance: "100000", initialCapital: "100000" })
      .returning();
    portfolio = newPortfolio;
  }
  return portfolio;
}

// GET /api/portfolio
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const portfolio = await ensurePortfolio(req.userId);
    const holdings = await db.query.holdingsTable.findMany({
      where: eq(holdingsTable.portfolioId, portfolio.id),
    });

    const holdingsWithPrices = holdings.map((h) => {
      const stock = findStock(h.ticker, h.exchange);
      const quote = stock ? generateStockQuote(stock) : null;
      const currentPrice = quote?.price ?? parseFloat(h.purchasePrice);
      const shares = parseFloat(h.shares);
      const purchasePrice = parseFloat(h.purchasePrice);
      const currentValue = shares * currentPrice;
      const gainLoss = currentValue - shares * purchasePrice;
      const gainLossPct = (gainLoss / (shares * purchasePrice)) * 100;

      return {
        id: h.id,
        ticker: h.ticker,
        exchange: h.exchange,
        shares,
        purchasePrice,
        currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        gainLoss: parseFloat(gainLoss.toFixed(2)),
        gainLossPct: parseFloat(gainLossPct.toFixed(2)),
      };
    });

    res.json({
      id: portfolio.id,
      cashBalance: parseFloat(portfolio.cashBalance),
      initialCapital: parseFloat(portfolio.initialCapital),
      holdings: holdingsWithPrices,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching portfolio");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/portfolio/summary
router.get("/summary", requireAuth, async (req: any, res) => {
  try {
    const portfolio = await ensurePortfolio(req.userId);
    const holdings = await db.query.holdingsTable.findMany({
      where: eq(holdingsTable.portfolioId, portfolio.id),
    });
    const transactions = await db.query.transactionsTable.findMany({
      where: eq(transactionsTable.portfolioId, portfolio.id),
    });

    const cashBalance = parseFloat(portfolio.cashBalance);
    const initialCapital = parseFloat(portfolio.initialCapital);

    let holdingsValue = 0;
    for (const h of holdings) {
      const stock = findStock(h.ticker, h.exchange);
      const quote = stock ? generateStockQuote(stock) : null;
      const price = quote?.price ?? parseFloat(h.purchasePrice);
      holdingsValue += parseFloat(h.shares) * price;
    }

    const totalValue = cashBalance + holdingsValue;
    const totalGainLoss = totalValue - initialCapital;
    const totalGainLossPct = (totalGainLoss / initialCapital) * 100;

    // Calculate win rate from sell transactions
    const sells = transactions.filter((t) => t.type === "SELL");
    let wins = 0;
    for (const sell of sells) {
      // Find the average purchase price for this ticker
      const buys = transactions.filter(
        (t) => t.type === "BUY" && t.ticker === sell.ticker && t.exchange === sell.exchange
      );
      if (buys.length > 0) {
        const avgBuyPrice =
          buys.reduce((sum, b) => sum + parseFloat(b.price), 0) / buys.length;
        if (parseFloat(sell.price) > avgBuyPrice) wins++;
      }
    }
    const winRate = sells.length > 0 ? (wins / sells.length) * 100 : 0;

    res.json({
      totalValue: parseFloat(totalValue.toFixed(2)),
      cashBalance: parseFloat(cashBalance.toFixed(2)),
      holdingsValue: parseFloat(holdingsValue.toFixed(2)),
      totalGainLoss: parseFloat(totalGainLoss.toFixed(2)),
      totalGainLossPct: parseFloat(totalGainLossPct.toFixed(2)),
      initialCapital,
      winRate: parseFloat(winRate.toFixed(1)),
      totalTrades: transactions.length,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching portfolio summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/portfolio/trade
router.post("/trade", requireAuth, async (req: any, res) => {
  try {
    const { ticker, exchange, type, shares, price } = req.body;
    if (!ticker || !exchange || !type || !shares || !price) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const numShares = parseFloat(shares);
    const numPrice = parseFloat(price);
    const FEE_RATE = 0.001; // 0.1%
    const SLIPPAGE_RATE = 0.0005; // 0.05%

    const slippageMultiplier = type === "BUY" ? 1 + SLIPPAGE_RATE : 1 - SLIPPAGE_RATE;
    const effectivePrice = numPrice * slippageMultiplier;
    const grossTotal = numShares * effectivePrice;
    const fees = parseFloat((grossTotal * FEE_RATE).toFixed(4));
    const total = type === "BUY" ? grossTotal + fees : grossTotal - fees;

    const portfolio = await ensurePortfolio(req.userId);
    const cashBalance = parseFloat(portfolio.cashBalance);

    if (type === "BUY") {
      if (total > cashBalance) {
        res.status(400).json({ error: "Insufficient funds" });
        return;
      }

      // Update or create holding
      const existing = await db.query.holdingsTable.findFirst({
        where: and(
          eq(holdingsTable.portfolioId, portfolio.id),
          eq(holdingsTable.ticker, ticker),
          eq(holdingsTable.exchange, exchange)
        ),
      });

      if (existing) {
        const existingShares = parseFloat(existing.shares);
        const existingPrice = parseFloat(existing.purchasePrice);
        const newShares = existingShares + numShares;
        const avgPrice = (existingShares * existingPrice + numShares * effectivePrice) / newShares;
        await db
          .update(holdingsTable)
          .set({ shares: newShares.toString(), purchasePrice: avgPrice.toString() })
          .where(eq(holdingsTable.id, existing.id));
      } else {
        await db.insert(holdingsTable).values({
          portfolioId: portfolio.id,
          ticker,
          exchange,
          shares: numShares.toString(),
          purchasePrice: effectivePrice.toString(),
        });
      }

      const newBalance = cashBalance - total;
      await db
        .update(portfoliosTable)
        .set({ cashBalance: newBalance.toFixed(4) })
        .where(eq(portfoliosTable.id, portfolio.id));

      const [transaction] = await db
        .insert(transactionsTable)
        .values({
          portfolioId: portfolio.id,
          ticker,
          exchange,
          type: "BUY",
          shares: numShares.toString(),
          price: effectivePrice.toString(),
          fees: fees.toString(),
        })
        .returning();

      res.json({
        success: true,
        message: `Bought ${numShares} shares of ${ticker} at ${effectivePrice.toFixed(2)}`,
        transaction: {
          id: transaction.id,
          ticker: transaction.ticker,
          exchange: transaction.exchange,
          type: transaction.type,
          shares: parseFloat(transaction.shares),
          price: parseFloat(transaction.price),
          total,
          fees,
          timestamp: transaction.timestamp,
        },
        newCashBalance: parseFloat(newBalance.toFixed(2)),
      });
    } else if (type === "SELL") {
      const existing = await db.query.holdingsTable.findFirst({
        where: and(
          eq(holdingsTable.portfolioId, portfolio.id),
          eq(holdingsTable.ticker, ticker),
          eq(holdingsTable.exchange, exchange)
        ),
      });

      if (!existing || parseFloat(existing.shares) < numShares) {
        res.status(400).json({ error: "Insufficient shares" });
        return;
      }

      const remainingShares = parseFloat(existing.shares) - numShares;
      if (remainingShares < 0.0001) {
        await db.delete(holdingsTable).where(eq(holdingsTable.id, existing.id));
      } else {
        await db
          .update(holdingsTable)
          .set({ shares: remainingShares.toString() })
          .where(eq(holdingsTable.id, existing.id));
      }

      const proceeds = grossTotal - fees;
      const newBalance = cashBalance + proceeds;
      await db
        .update(portfoliosTable)
        .set({ cashBalance: newBalance.toFixed(4) })
        .where(eq(portfoliosTable.id, portfolio.id));

      const [transaction] = await db
        .insert(transactionsTable)
        .values({
          portfolioId: portfolio.id,
          ticker,
          exchange,
          type: "SELL",
          shares: numShares.toString(),
          price: effectivePrice.toString(),
          fees: fees.toString(),
        })
        .returning();

      res.json({
        success: true,
        message: `Sold ${numShares} shares of ${ticker} at ${effectivePrice.toFixed(2)}`,
        transaction: {
          id: transaction.id,
          ticker: transaction.ticker,
          exchange: transaction.exchange,
          type: transaction.type,
          shares: parseFloat(transaction.shares),
          price: parseFloat(transaction.price),
          total: proceeds,
          fees,
          timestamp: transaction.timestamp,
        },
        newCashBalance: parseFloat(newBalance.toFixed(2)),
      });
    } else {
      res.status(400).json({ error: "Invalid trade type" });
    }
  } catch (err) {
    req.log.error({ err }, "Error executing trade");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
