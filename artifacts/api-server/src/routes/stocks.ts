import { Router } from "express";
import { findStock, generateStockQuote, getMarketOverview, searchStocks } from "../lib/stockData";

const router = Router();

// GET /api/stocks/quote?ticker=AAPL&exchange=NYSE
router.get("/quote", async (req: any, res) => {
  try {
    const { ticker, exchange } = req.query as { ticker: string; exchange: string };
    if (!ticker || !exchange) {
      res.status(400).json({ error: "ticker and exchange are required" });
      return;
    }

    const stock = findStock(ticker, exchange);
    if (!stock) {
      res.status(404).json({ error: "Stock not found" });
      return;
    }

    const quote = generateStockQuote(stock);
    res.json(quote);
  } catch (err) {
    req.log.error({ err }, "Error fetching stock quote");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stocks/search?query=apple&exchange=NYSE
router.get("/search", async (req: any, res) => {
  try {
    const { query, exchange } = req.query as { query: string; exchange?: string };
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const results = searchStocks(query, exchange);
    res.json(results.map((s) => ({
      ticker: s.ticker,
      exchange: s.exchange,
      companyName: s.companyName,
      sector: s.sector,
      currency: s.currency,
    })));
  } catch (err) {
    req.log.error({ err }, "Error searching stocks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/stocks/markets
router.get("/markets", async (req: any, res) => {
  try {
    const markets = getMarketOverview();
    res.json(markets);
  } catch (err) {
    req.log.error({ err }, "Error fetching market overview");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
