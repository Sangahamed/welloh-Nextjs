import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from '@/lib/logger';

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
    const analysis = await db.query.analysesTable.findFirst({
      where: eq(analysesTable.id, id),
    });

    if (!analysis || analysis.userId !== userId) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    await db.delete(analysesTable).where(eq(analysesTable.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Error deleting analysis");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
