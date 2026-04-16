import { getUserId } from "@/lib/auth-utils";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';

async function ensureUser(userId: string) {
  let user = await db.query.profilesTable.findFirst({
    where: eq(profilesTable.id, userId),
  });
  if (!user) {
    const [newUser] = await db
      .insert(profilesTable)
      .values({
        id: userId,
        displayName: `Trader_${userId.slice(0, 6)}`,
        level: 1,
      })
      .returning();
    user = newUser;
  }
  return user;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureUser(userId);
    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      country: user.country,
      institution: user.institution,
      role: user.role,
      league: user.league,
      level: user.level,
      experiencePoints: user.experiencePoints,
      totalProfitLoss: user.totalProfitLoss,
      totalTrades: user.totalTrades,
      winRate: user.winRate,
      createdAt: user.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching profile");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await ensureUser(userId);

    const updates: Record<string, any> = {};
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.username !== undefined) updates.username = body.username;
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.country !== undefined) updates.country = body.country;
    if (body.institution !== undefined) updates.institution = body.institution;

    const [updated] = await db
      .update(profilesTable)
      .set(updates)
      .where(eq(profilesTable.id, userId))
      .returning();

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      country: updated.country,
      institution: updated.institution,
      role: updated.role,
      league: updated.league,
      level: updated.level,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "Error updating profile");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
