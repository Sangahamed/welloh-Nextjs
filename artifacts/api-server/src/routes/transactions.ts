import { Router } from "express";
import { db } from "@workspace/db";
import { portfoliosTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/transactions
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const portfolio = await db.query.portfoliosTable.findFirst({
      where: eq(portfoliosTable.userId, req.userId),
    });

    if (!portfolio) {
      res.json([]);
      return;
    }

    const txs = await db.query.transactionsTable.findMany({
      where: eq(transactionsTable.portfolioId, portfolio.id),
      orderBy: [desc(transactionsTable.timestamp)],
      limit,
      offset,
    });

    res.json(
      txs.map((t) => ({
        id: t.id,
        ticker: t.ticker,
        exchange: t.exchange,
        type: t.type,
        shares: parseFloat(t.shares),
        price: parseFloat(t.price),
        total: parseFloat(t.shares) * parseFloat(t.price),
        fees: parseFloat(t.fees),
        timestamp: t.timestamp,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error fetching transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
