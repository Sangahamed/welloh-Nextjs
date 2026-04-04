import { Router } from "express";
import { db } from "@workspace/db";
import { portfoliosTable, transactionsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { findStock, generateStockQuote } from "../lib/stockData";
import { eq } from "drizzle-orm";

const router = Router();

async function computeLeaderboard(limit: number) {
  const portfolios = await db.query.portfoliosTable.findMany({ limit: 100 });
  const entries = [];

  for (const p of portfolios) {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, p.userId),
    });
    const transactions = await db.query.transactionsTable.findMany({
      where: eq(transactionsTable.portfolioId, p.id),
    });

    const cashBalance = parseFloat(p.cashBalance);
    const initialCapital = parseFloat(p.initialCapital);

    // Rough portfolio value estimate
    const totalReturn = cashBalance - initialCapital;
    const returnPct = (totalReturn / initialCapital) * 100;

    const sells = transactions.filter((t) => t.type === "SELL");
    let wins = 0;
    for (const sell of sells) {
      const buys = transactions.filter(
        (t) => t.type === "BUY" && t.ticker === sell.ticker && t.exchange === sell.exchange
      );
      if (buys.length > 0) {
        const avgBuyPrice = buys.reduce((sum, b) => sum + parseFloat(b.price), 0) / buys.length;
        if (parseFloat(sell.price) > avgBuyPrice) wins++;
      }
    }
    const winRate = sells.length > 0 ? (wins / sells.length) * 100 : 50;

    // Simplified Sharpe ratio simulation
    const sharpeRatio = returnPct > 0 ? parseFloat((returnPct / 15 + Math.random() * 0.5).toFixed(2)) : parseFloat((returnPct / 20).toFixed(2));

    // Composite score: PnL 50% + WinRate 20% + Sharpe 30%
    const score = returnPct * 0.5 + winRate * 0.2 + sharpeRatio * 30;

    entries.push({
      userId: p.userId,
      displayName: user?.displayName || `Trader_${p.userId.slice(0, 6)}`,
      score: parseFloat(score.toFixed(2)),
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      returnPct: parseFloat(returnPct.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(1)),
      totalTrades: transactions.length,
      sharpeRatio,
      country: user?.country || null,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}

// GET /api/leaderboard
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const entries = await computeLeaderboard(limit);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Error fetching leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/leaderboard/me
router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const entries = await computeLeaderboard(200);
    const me = entries.find((e) => e.userId === req.userId);
    if (!me) {
      res.json({
        rank: entries.length + 1,
        userId: req.userId,
        displayName: "You",
        score: 0,
        totalReturn: 0,
        returnPct: 0,
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 0,
        country: null,
      });
      return;
    }
    res.json(me);
  } catch (err) {
    req.log.error({ err }, "Error fetching user rank");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
