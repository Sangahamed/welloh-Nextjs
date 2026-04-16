import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { ai } from "@workspace/integrations-gemini-ai";

const MENTOR_SYSTEM_PROMPT = `You are WelloAI, an expert financial mentor specialized in global markets with deep expertise in African financial markets (BRVM, JSE, NSE, EGX, ZLECAF impacts).

You help aspiring traders understand:
- Investment strategies and risk management
- African market dynamics, regulations, and opportunities
- How to analyze financial statements and company metrics
- Portfolio diversification and performance optimization
- Macroeconomic factors affecting African markets

You are educational, encouraging, and precise. You give actionable insights backed by financial theory. You never give specific investment advice, but provide frameworks for analysis.

Always structure your responses clearly with headers and bullet points when appropriate. Respond in the same language as the user.`;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            const stream = await ai.models.generateContentStream({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: message }] }],
              config: {
                maxOutputTokens: 8192,
                systemInstruction: MENTOR_SYSTEM_PROMPT,
              },
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
            logger.error({ err }, "Error in mentor chat stream");
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
    logger.error({ err }, "Error in mentor chat");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
