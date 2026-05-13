import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { ai } from "@workspace/integrations-gemini-ai";
import { getApiAuth, unauthorizedResponse } from '@/lib/api-auth';

const MENTOR_SYSTEM_PROMPT = `You are WelloAI, an expert financial mentor specialized in global markets with deep expertise in African financial markets. Help aspiring traders understand investment strategies, risk management, African market dynamics, portfolio optimization. Be educational, encouraging, precise. Never give specific investment advice but provide frameworks. Respond in the same language as the user.`;

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();

    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            const stream = await ai.models.generateContentStream({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: message }] }],
              config: { maxOutputTokens: 8192, systemInstruction: MENTOR_SYSTEM_PROMPT },
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