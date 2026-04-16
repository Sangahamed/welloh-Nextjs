import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { portfoliosTable, transactionsTable, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from '@/lib/logger';

async function computeLeaderboard(limit: number) {
  const portfolios = await db.query.portfoliosTable.findMany({ limit: 100 });
  const entries = [];

  for (const p of portfolios) {
    const user = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.id, p.userId),
    });
    const transactions = await db.query.transactionsTable.findMany({
      where: eq(transactionsTable.portfolioId, p.id),
    });

    const currentBalance = parseFloat(p.currentBalance || "0");
    const initialBalance = parseFloat(p.initialBalance || "0");

    // Rough portfolio value estimate
    const totalReturn = currentBalance - initialBalance;
    const returnPct = initialBalance > 0 ? (totalReturn / initialBalance) * 100 : 0;

    const sells = transactions.filter((t) => t.transactionType?.toUpperCase() === "SELL");
    let wins = 0;
    for (const sell of sells) {
      const buys = transactions.filter(
        (t) =>
          t.transactionType?.toUpperCase() === "BUY" &&
          t.symbol === sell.symbol
      );
      if (buys.length > 0) {
        const avgBuyPrice =
          buys.reduce((sum, b) => sum + parseFloat(b.price || "0"), 0) / buys.length;
        if (parseFloat(sell.price || "0") > avgBuyPrice) wins++;
      }
    }
    const winRate = sells.length > 0 ? (wins / sells.length) * 100 : 50;

    // Simplified Sharpe ratio simulation
    const sharpeRatio =
      returnPct > 0
        ? parseFloat((returnPct / 15 + Math.random() * 0.5).toFixed(2))
        : parseFloat((returnPct / 20).toFixed(2));

    // Composite score: PnL 50% + WinRate 20% + Sharpe 30%
    const score = returnPct * 0.5 + winRate * 0.2 + sharpeRatio * 30;

    entries.push({
      userId: p.userId,
      displayName: user?.displayName || `Trader_${p.userId.slice(0, 6)}`,
      avatarUrl: user?.avatarUrl || null,
      score: parseFloat(score.toFixed(2)),
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      returnPct: parseFloat(returnPct.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(1)),
      totalTrades: transactions.length,
      sharpeRatio,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await computeLeaderboard(200);
    const me = entries.find((e) => e.userId === userId);
    if (!me) {
      return NextResponse.json({
        rank: entries.length + 1,
        userId,
        displayName: "You",
        score: 0,
        totalReturn: 0,
        returnPct: 0,
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 0,
      });
    }
    return NextResponse.json(me);
  } catch (err) {
    logger.error({ err }, "Error fetching user rank");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
