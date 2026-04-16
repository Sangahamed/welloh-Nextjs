import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { ai } from "@workspace/integrations-gemini-ai";
import { findStock, generateStockQuote } from '@/lib/stockData';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticker, exchange, companyName, analysisType, compareTo } =
      await request.json();
    if (!ticker || !exchange || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const stock = findStock(ticker, exchange);
    const quote = stock ? generateStockQuote(stock) : null;

    let prompt = "";
    if (analysisType === "comparison" && compareTo) {
      prompt = `Perform a detailed comparative financial analysis of **${companyName} (${ticker})** vs **${compareTo}** listed on ${exchange}.

Compare across:
1. **Business Model & Competitive Position**
2. **Key Financial Metrics** (Revenue growth, margins, P/E, EV/EBITDA)
3. **Market Position & Market Share**
4. **Growth Catalysts & Risks**
5. **Valuation Assessment**
6. **Investment Verdict**: Which is the stronger buy and why?

Current price of ${ticker}: ${quote?.price ?? "N/A"} ${quote?.currency ?? ""}
52-week range: ${quote?.low ?? "N/A"} - ${quote?.high ?? "N/A"}

Be precise, data-driven, and provide clear recommendations.`;
    } else {
      prompt = `Perform a comprehensive investment analysis of **${companyName} (${ticker})** listed on ${exchange}.

Structure your analysis as follows:

## Company Overview
Brief description of the business model and market position.

## Financial Performance
- Revenue trends and growth drivers
- Profitability metrics (margins, ROE, ROIC)
- Balance sheet health and debt levels
- Cash flow generation

## Key Metrics
- Current valuation ratios (P/E, P/B, EV/EBITDA)
- Dividend yield (if applicable)
- Earnings per share trend

## Market Analysis
- Competitive landscape
- Industry tailwinds and headwinds
- Regulatory environment (especially if African market)

## Growth Catalysts
Top 3-5 potential catalysts for stock appreciation

## Key Risks
Top 3-5 risks investors should monitor

## Investment Outlook
- 12-month price target range
- Overall rating: Strong Buy / Buy / Hold / Sell / Strong Sell
- Summary recommendation

Current data:
- Price: ${quote?.price ?? "N/A"} ${quote?.currency ?? ""}
- Day change: ${quote?.changePct ?? "N/A"}%
- Volume: ${quote?.volume?.toLocaleString() ?? "N/A"}

Provide analysis as if you are a senior equity research analyst. Be specific and insightful.`;
    }

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
              const text = chunk.text;
              if (text) {
                controller.enqueue(
                  `data: ${JSON.stringify({ content: text })}\n\n`,
                );
              }
            }

            controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);
            controller.close();
          } catch (err) {
            logger.error({ err }, "Error in stock analysis stream");
            controller.enqueue(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`,
            );
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  } catch (err) {
    logger.error({ err }, "Error in stock analysis");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
