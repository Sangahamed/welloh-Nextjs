import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { systemHealth } from '@workspace/db';
import { sql } from "drizzle-orm";
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> },
) {
    const { service } = await params;
  try {
    const serviceName = service;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const records = await db
      .select()
      .from(systemHealth)
      .where(sql`service_name = ${serviceName}`)
      .orderBy(desc(systemHealth.recordedAt))
      .limit(limit);

    return NextResponse.json({
      service: serviceName,
      records: records.map((r) => ({
        status: r.status,
        latencyMs: r.latencyMs,
        errorRate: r.errorRate,
        recordedAt: r.recordedAt,
      })),
    });
  } catch (error) {
    logger.error(error, "Error fetching health history");
    return NextResponse.json(
      { error: "Failed to fetch health history" },
      { status: 500 },
    );
  }
}
