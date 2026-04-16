import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { supportTickets, ticketMessages } from '@workspace/db';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticketId = id;
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Verify ticket ownership
    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, ticketId),
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.userId !== userId) {
      return NextResponse.json(
        { error: "Not authorized to access this ticket" },
        { status: 403 },
      );
    }

    // Update ticket status if it was resolved
    if (
      ticket &&
      (ticket.status === "resolved" || ticket.status === "closed")
    ) {
      await db
        .update(supportTickets)
        .set({ status: "open" })
        .where(eq(supportTickets.id, ticketId));
    }

    const [msg] = await db
      .insert(ticketMessages)
      .values({
        ticketId: ticketId,
        senderId: userId,
        message: message,
        isInternal: false,
      })
      .returning();

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    logger.error(error, "Error sending ticket message");
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
