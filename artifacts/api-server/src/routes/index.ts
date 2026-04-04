import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portfolioRouter from "./portfolio";
import transactionsRouter from "./transactions";
import watchlistRouter from "./watchlist";
import stocksRouter from "./stocks";
import leaderboardRouter from "./leaderboard";
import analysisRouter from "./analysis";
import geminiRouter from "./gemini";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/portfolio", portfolioRouter);
router.use("/transactions", transactionsRouter);
router.use("/watchlist", watchlistRouter);
router.use("/stocks", stocksRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/analysis", analysisRouter);
router.use("/gemini", geminiRouter);
router.use("/users", usersRouter);

export default router;
