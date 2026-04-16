import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = idParam;
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
    if (!conv || conv.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const msgs = await db.query.messages.findMany({
      where: eq(messages.conversationId, id),
      orderBy: [asc(messages.createdAt)],
    });
    return NextResponse.json({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      messages: msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Error getting conversation");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = idParam;
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
    if (!conv || conv.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Error deleting conversation");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
