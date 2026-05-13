import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { ai } from "@workspace/integrations-gemini-ai";
import { findStock, generateStockQuote } from '@/lib/stockData';
import { getApiAuth, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();

    const { ticker, exchange, companyName, analysisType, compareTo } = await request.json();
    if (!ticker || !exchange || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stock = findStock(ticker, exchange);
    const quote = stock ? generateStockQuote(stock) : null;

    let prompt = analysisType === "comparison" && compareTo
      ? `Perform a detailed comparative financial analysis of **${companyName} (${ticker})** vs **${compareTo}** listed on ${exchange}. Compare business model, financial metrics, market position, growth catalysts, valuation. Current price: ${quote?.price ?? "N/A"} ${quote?.currency ?? ""}`
      : `Perform a comprehensive investment analysis of **${companyName} (${ticker})** on ${exchange}. Include: company overview, financial performance, key metrics, market analysis, growth catalysts, risks, investment outlook. Current price: ${quote?.price ?? "N/A"} ${quote?.currency ?? ""}`;

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            const stream = await ai.models.generateContentStream({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              config: { maxOutputTokens: 8192 },
            });
            for await (const chunk of stream) {
              if (chunk.text) controller.enqueue(`data: ${JSON.stringify({ content: chunk.text })}\n\n`);
            }
            controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);
            controller.close();
          } catch (err) {
            controller.enqueue(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
            controller.close();
          }
        },
      }),
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } }
    );
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}