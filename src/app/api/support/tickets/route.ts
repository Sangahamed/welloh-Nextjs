import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  supportTickets,
  ticketMessages,
  insertSupportTicketsSchema,
} from '@workspace/db';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await db.query.supportTickets.findMany({
      where: eq(supportTickets.userId, userId),
      orderBy: [desc(supportTickets.createdAt)],
      with: {
        assignedToProfile: true,
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    logger.error(error, "Error fetching support tickets");
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
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

    const body = await request.json();
    const validation = insertSupportTicketsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId,
        subject: validation.data.subject,
        message: validation.data.message,
        category: validation.data.category || "general",
        priority: validation.data.priority || "normal",
      })
      .returning();

    // Create initial message
    await db.insert(ticketMessages).values({
      ticketId: ticket.id,
      senderId: userId,
      message: validation.data.message,
      isInternal: false,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    logger.error(error, "Error creating support ticket");
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 },
    );
  }
}
