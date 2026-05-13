import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { logger } from "@/lib/logger";
import { MarketDataHub } from "@workspace/integrations/marketHub";
import { checkRateLimit } from "@workspace/integrations/redis";
import { getApiAuth, unauthorizedResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiAuth();
    if (!auth) return unauthorizedResponse();
    const { userId } = auth;

    const { success } = await checkRateLimit(`mentor_ai_${userId}`);
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded for Mentor AI" }, { status: 429 });
    }

    const { message, context } = await request.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    const genAI = new GoogleGenAI({ apiKey });
    const systemPrompt = `You are "Mentor AI", a premium financial advisor on the Welloh trading platform. Your tone is professional, high-tech, and encouraging. Do NOT mention "Google" or "Gemini". Provide actionable trading suggestions based on the user's current holdings and market data. If the user asks for the price or analysis of a specific asset, use the get_market_quote tool to fetch real-time data. If the asset is a cryptocurrency, the exchange should be 'BINANCE'. For US stocks, use 'NYSE' or 'NASDAQ'. User's Current Context: ${JSON.stringify(context || {})}.`;

    const getMarketQuoteDeclaration = {
      name: "get_market_quote",
      description: "Get the current market price and 24h change for a given stock or cryptocurrency ticker.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          ticker: { type: Type.STRING, description: "The ticker symbol (e.g. BTCUSDT, AAPL, TSLA)" },
          exchange: { type: Type.STRING, description: "The exchange to search on (e.g., BINANCE, NYSE, NASDAQ)" },
        },
        required: ["ticker", "exchange"],
      },
    };

    let chatSession = [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser message: " + message }] }];
    let response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: chatSession as any,
      config: { tools: [{ functionDeclarations: [getMarketQuoteDeclaration] }] },
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const call = calls[0];
      if (call.name === "get_market_quote") {
        const { ticker, exchange } = call.args as any;
        let toolResultData;
        try {
          const quote = await MarketDataHub.getQuote(ticker, exchange);
          toolResultData = { success: true, quote };
        } catch (e: any) {
          toolResultData = { success: false, error: e.message };
        }
        chatSession.push({ role: "model", parts: [{ functionCall: call }] as any });
        chatSession.push({ role: "user", parts: [{ functionResponse: { name: call.name, response: toolResultData } }] as any });
        response = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: chatSession as any,
          config: { tools: [{ functionDeclarations: [getMarketQuoteDeclaration] }] },
        });
      }
    }

    const text = response.text || "";
    return NextResponse.json({ reply: text, author: 'Mentor AI', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Mentor AI Error");
    return NextResponse.json({ error: "Failed to reach Mentor AI" }, { status: 500 });
  }
}