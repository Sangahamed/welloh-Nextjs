import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { ai } from "@workspace/integrations-gemini-ai";
import { findStock, generateStockQuote } from "../lib/stockData";

const router = Router();

const MENTOR_SYSTEM_PROMPT = `You are WelloAI, an expert financial mentor specialized in global markets with deep expertise in African financial markets (BRVM, JSE, NSE, EGX, ZLECAF impacts).

You help aspiring traders understand:
- Investment strategies and risk management
- African market dynamics, regulations, and opportunities
- How to analyze financial statements and company metrics
- Portfolio diversification and performance optimization
- Macroeconomic factors affecting African markets

You are educational, encouraging, and precise. You give actionable insights backed by financial theory. You never give specific investment advice, but provide frameworks for analysis.

Always structure your responses clearly with headers and bullet points when appropriate. Respond in the same language as the user.`;

// GET /api/gemini/conversations
router.get("/conversations", requireAuth, async (req: any, res) => {
  try {
    const convs = await db.query.conversations.findMany({
      where: eq(conversations.userId, req.userId),
      orderBy: [asc(conversations.createdAt)],
    });
    res.json(
      convs.map((c: any) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error listing conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/gemini/conversations
router.post("/conversations", requireAuth, async (req: any, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const [conv] = await db
      .insert(conversations)
      .values({ title, userId: req.userId })
      .returning();
    res.status(201).json({ id: conv.id, title: conv.title, createdAt: conv.createdAt });
  } catch (err) {
    req.log.error({ err }, "Error creating conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/gemini/conversations/:id
router.get("/conversations/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
    if (!conv || (conv as any).userId !== req.userId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const msgs = await db.query.messages.findMany({
      where: eq(messages.conversationId, id),
      orderBy: [asc(messages.createdAt)],
    });
    res.json({
      id: conv.id,
      title: (conv as any).title,
      createdAt: conv.createdAt,
      messages: msgs.map((m: any) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/gemini/conversations/:id
router.delete("/conversations/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
    if (!conv || (conv as any).userId !== req.userId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/gemini/conversations/:id/messages (SSE streaming)
router.post("/conversations/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const convId = parseInt(req.params.id);
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, convId),
    });
    if (!conv || (conv as any).userId !== req.userId) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
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

    const chatMessages = history.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: MENTOR_SYSTEM_PROMPT,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messages).values({
      conversationId: convId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error sending message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

// POST /api/gemini/analyze (SSE streaming stock analysis)
router.post("/analyze", requireAuth, async (req: any, res) => {
  try {
    const { ticker, exchange, companyName, analysisType, compareTo } = req.body;
    if (!ticker || !exchange || !companyName) {
      res.status(400).json({ error: "Missing required fields" });
      return;
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error in stock analysis");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

// POST /api/gemini/mentor (quick mentor chat SSE)
router.post("/mentor", requireAuth, async (req: any, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error in mentor chat");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
