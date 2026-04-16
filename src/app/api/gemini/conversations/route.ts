import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { conversations } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convs = await db.query.conversations.findMany({
      where: eq(conversations.userId, userId),
      orderBy: [asc(conversations.createdAt)],
    });
    return NextResponse.json(
      convs.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
      })),
    );
  } catch (err) {
    logger.error({ err }, "Error listing conversations");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const [conv] = await db
      .insert(conversations)
      .values({ title, userId })
      .returning();
    return NextResponse.json(
      { id: conv.id, title: conv.title, createdAt: conv.createdAt },
      { status: 201 },
    );
  } catch (err) {
    logger.error({ err }, "Error creating conversation");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
