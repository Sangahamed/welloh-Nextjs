import { Router } from "express";
import { db } from "@workspace/db";
import { watchlistsTable, watchlistItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function ensureWatchlist(userId: string) {
  let watchlist = await db.query.watchlistsTable.findFirst({
    where: eq(watchlistsTable.userId, userId),
  });
  if (!watchlist) {
    const [newWl] = await db
      .insert(watchlistsTable)
      .values({ userId })
      .returning();
    watchlist = newWl;
  }
  return watchlist;
}

// GET /api/watchlist
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const watchlist = await ensureWatchlist(req.userId);
    const items = await db.query.watchlistItemsTable.findMany({
      where: eq(watchlistItemsTable.watchlistId, watchlist.id),
    });

    res.json(
      items.map((i) => ({
        id: i.id,
        ticker: i.ticker,
        exchange: i.exchange,
        addedAt: i.addedAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error fetching watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/watchlist
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const { ticker, exchange } = req.body;
    if (!ticker || !exchange) {
      res.status(400).json({ error: "Missing ticker or exchange" });
      return;
    }

    const watchlist = await ensureWatchlist(req.userId);

    // Check if already in watchlist
    const existing = await db.query.watchlistItemsTable.findFirst({
      where: and(
        eq(watchlistItemsTable.watchlistId, watchlist.id),
        eq(watchlistItemsTable.ticker, ticker),
        eq(watchlistItemsTable.exchange, exchange)
      ),
    });

    if (existing) {
      res.status(200).json({
        id: existing.id,
        ticker: existing.ticker,
        exchange: existing.exchange,
        addedAt: existing.addedAt,
      });
      return;
    }

    const [item] = await db
      .insert(watchlistItemsTable)
      .values({ watchlistId: watchlist.id, ticker, exchange })
      .returning();

    res.status(201).json({
      id: item.id,
      ticker: item.ticker,
      exchange: item.exchange,
      addedAt: item.addedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error adding to watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/watchlist/:id
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const watchlist = await ensureWatchlist(req.userId);

    const item = await db.query.watchlistItemsTable.findFirst({
      where: and(
        eq(watchlistItemsTable.id, id),
        eq(watchlistItemsTable.watchlistId, watchlist.id)
      ),
    });

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    await db.delete(watchlistItemsTable).where(eq(watchlistItemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error removing watchlist item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
