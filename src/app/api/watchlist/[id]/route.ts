import { NextResponse } from "next/server";
import { db } from "@workspace/db";
import { watchlistsTable, watchlistItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from '@/lib/logger';
import { getApiAuth, unauthorizedResponse } from '@/lib/api-auth';

async function ensureWatchlist(userId: string) {
  let watchlist = await db.query.watchlistsTable.findFirst({ where: eq(watchlistsTable.userId, userId) });
  if (!watchlist) {
    const [wl] = await db.insert(watchlistsTable).values({ userId }).returning();
    watchlist = wl;
  }
  return watchlist;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();
    const { userId } = auth;

    const watchlist = await ensureWatchlist(userId);

    const item = await db.query.watchlistItemsTable.findFirst({
      where: and(
        eq(watchlistItemsTable.id, idParam),
        eq(watchlistItemsTable.watchlistId, watchlist.id),
      ),
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await db.delete(watchlistItemsTable).where(eq(watchlistItemsTable.id, idParam));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logger.error({ err }, "Error removing watchlist item");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}