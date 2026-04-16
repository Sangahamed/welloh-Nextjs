import { NextResponse } from "next/server";
import { db } from "@workspace/db";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const portfolios = await db.query.portfoliosTable.findMany({ limit: 20 });
    const holdings = await db.query.holdingsTable.findMany({ limit: 50 });
    const transactions = await db.query.transactionsTable.findMany({ limit: 50 });

    return NextResponse.json({ portfolios, holdings, transactions }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
