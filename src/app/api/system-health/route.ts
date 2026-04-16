import { NextRequest, NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { systemHealth, insertSystemHealthSchema } from '@workspace/db';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Get latest health records for each service
    const healthRecords = await db.execute(sql`
      SELECT DISTINCT ON (service_name)
        id, service_name, status, latency_ms, error_rate, metadata, recorded_at
      FROM system_health
      ORDER BY service_name, recorded_at DESC
    `);

    const services = healthRecords.rows.map((row: any) => ({
      serviceName: row.service_name,
      status: row.status,
      latencyMs: row.latency_ms ? parseInt(row.latency_ms as string) : null,
      errorRate: row.error_rate ? parseFloat(row.error_rate as string) : 0,
      metadata: row.metadata,
      recordedAt: row.recorded_at,
    }));

    // Calculate overall health
    const allOperational = services.every((s) => s.status === "operational");
    const anyDown = services.some((s) => s.status === "down");
    const overallStatus = anyDown
      ? "critical"
      : allOperational
        ? "healthy"
        : "degraded";

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      summary: {
        total: services.length,
        operational: services.filter((s) => s.status === "operational").length,
        degraded: services.filter((s) => s.status === "degraded").length,
        down: services.filter((s) => s.status === "down").length,
        maintenance: services.filter((s) => s.status === "maintenance").length,
      },
    });
  } catch (error) {
    logger.error(error, "Error fetching system health");
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch system health",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = insertSystemHealthSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const [record] = await db
      .insert(systemHealth)
      .values(validation.data)
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    logger.error(error, "Error recording health status");
    return NextResponse.json(
      { error: "Failed to record health status" },
      { status: 500 },
    );
  }
}
