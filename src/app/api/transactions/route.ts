import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { portfoliosTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const portfolio = await ensurePortfolio(userId);

    const txs = await db.query.transactionsTable.findMany({
      where: eq(transactionsTable.portfolioId, portfolio.id),
      orderBy: [desc(transactionsTable.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json(
      txs.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        transactionType: t.transactionType,
        shares: parseFloat(t.shares || "0"),
        price: parseFloat(t.price || "0"),
        totalValue: parseFloat(t.totalValue || "0"),
        commission: parseFloat(t.commission || "0"),
        status: t.status,
        createdAt: t.createdAt,
      })),
    );
  } catch (err) {
    logger.error({ err }, "Error fetching transactions");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
