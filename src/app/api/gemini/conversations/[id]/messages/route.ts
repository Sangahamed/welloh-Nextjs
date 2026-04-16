import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
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

    const convId = id;
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, convId),
    });
    if (!conv || conv.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 },
      );
    }

    // Save user message
    await db.insert(messages).values({
      conversationId: convId,
      role: "user",
      content,
    });

    // Get history
    const history = await db.query.messages.findMany({
      where: eq(messages.conversationId, convId),
      orderBy: [asc(messages.createdAt)],
    });

    const chatMessages = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            const stream = await ai.models.generateContentStream({
              model: "gemini-2.0-flash",
              contents: chatMessages,
              config: {
                maxOutputTokens: 8192,
                systemInstruction: MENTOR_SYSTEM_PROMPT,
              },
            });

            let fullResponse = "";

            for await (const chunk of stream) {
              const text = chunk.text;
              if (text) {
                fullResponse += text;
                controller.enqueue(
                  `data: ${JSON.stringify({ content: text })}\n\n`,
                );
              }
            }

            // Save assistant message
            await db.insert(messages).values({
              conversationId: convId,
              role: "assistant",
              content: fullResponse,
            });

            controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);
            controller.close();
          } catch (err) {
            logger.error({ err }, "Error in streaming response");
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
    logger.error({ err }, "Error sending message");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
