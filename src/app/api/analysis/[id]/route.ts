import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from '@/lib/logger';
import { getApiAuth, unauthorizedResponse } from '@/lib/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();
    const { userId } = auth;

    const analysis = await db.query.analysesTable.findFirst({
      where: eq(analysesTable.id, id),
    });

    if (!analysis || analysis.userId !== userId) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    await db.delete(analysesTable).where(eq(analysesTable.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Error deleting analysis");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}