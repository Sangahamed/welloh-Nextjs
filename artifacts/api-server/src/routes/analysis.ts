import { Router } from "express";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/analysis
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const analyses = await db.query.analysesTable.findMany({
      where: eq(analysesTable.userId, req.userId),
      orderBy: [desc(analysesTable.createdAt)],
    });

    res.json(
      analyses.map((a) => ({
        id: a.id,
        ticker: a.ticker,
        companyName: a.companyName,
        analysisType: a.analysisType,
        summary: a.summary,
        data: a.data,
        createdAt: a.createdAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error fetching analyses");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/analysis
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const { ticker, companyName, analysisType, summary, data } = req.body;
    if (!ticker || !companyName || !analysisType || !summary) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [analysis] = await db
      .insert(analysesTable)
      .values({
        userId: req.userId,
        ticker,
        companyName,
        analysisType,
        summary,
        data: data || null,
      })
      .returning();

    res.status(201).json({
      id: analysis.id,
      ticker: analysis.ticker,
      companyName: analysis.companyName,
      analysisType: analysis.analysisType,
      summary: analysis.summary,
      data: analysis.data,
      createdAt: analysis.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error saving analysis");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/analysis/:id
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const analysis = await db.query.analysesTable.findFirst({
      where: eq(analysesTable.id, id),
    });

    if (!analysis || analysis.userId !== req.userId) {
      res.status(404).json({ error: "Analysis not found" });
      return;
    }

    await db.delete(analysesTable).where(eq(analysesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting analysis");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
