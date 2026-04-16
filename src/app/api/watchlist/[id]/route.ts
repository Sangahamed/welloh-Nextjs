import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@workspace/db";
import { watchlistsTable, watchlistItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from '@/lib/logger';

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = idParam;
    const watchlist = await ensureWatchlist(userId);

    const item = await db.query.watchlistItemsTable.findFirst({
      where: and(
        eq(watchlistItemsTable.id, id),
        eq(watchlistItemsTable.watchlistId, watchlist.id),
      ),
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await db.delete(watchlistItemsTable).where(eq(watchlistItemsTable.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logger.error({ err }, "Error removing watchlist item");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
