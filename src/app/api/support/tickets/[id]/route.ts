import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { supportTickets, ticketMessages } from '@workspace/db';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticketId = id;

    const ticket = await db.query.supportTickets.findFirst({
      where: and(
        eq(supportTickets.id, ticketId),
        eq(supportTickets.userId, userId),
      ),
      with: {
        messages: {
          orderBy: [desc(ticketMessages.createdAt)],
        },
        assignedToProfile: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    logger.error(error, "Error fetching ticket");
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 },
    );
  }
}
