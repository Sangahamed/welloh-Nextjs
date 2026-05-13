import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from '@/lib/logger';
import { getApiAuth, unauthorizedResponse } from '@/lib/api-auth';

export async function GET() {
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();
    const { userId } = auth;

    const analyses = await db.query.analysesTable.findMany({
      where: eq(analysesTable.userId, userId),
      orderBy: [desc(analysesTable.createdAt)],
    });

    return NextResponse.json(
      analyses.map((a) => ({
        id: a.id,
        ticker: a.ticker,
        companyName: a.companyName,
        analysisType: a.analysisType,
        summary: a.summary,
        data: a.data,
        createdAt: a.createdAt,
      }))
    );
  } catch (err) {
    logger.error({ err }, "Error fetching analyses");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();
    const { userId } = auth;

    const { ticker, companyName, analysisType, summary, data } = await request.json();
    if (!ticker || !companyName || !analysisType || !summary) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [analysis] = await db.insert(analysesTable).values({
      userId, ticker, companyName, analysisType, summary, data: data || null,
    }).returning();

    return NextResponse.json({ id: analysis.id, ticker: analysis.ticker, companyName: analysis.companyName, analysisType: analysis.analysisType, summary: analysis.summary, data: analysis.data, createdAt: analysis.createdAt }, { status: 201 });
  } catch (err) {
    logger.error({ err }, "Error saving analysis");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}