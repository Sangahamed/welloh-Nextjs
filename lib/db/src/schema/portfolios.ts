import { pgTable, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfoliosTable = pgTable("portfolios", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull().unique(),
  cashBalance: numeric("cash_balance", { precision: 15, scale: 4 }).notNull().default("100000"),
  initialCapital: numeric("initial_capital", { precision: 15, scale: 4 }).notNull().default("100000"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const holdingsTable = pgTable("holdings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  portfolioId: integer("portfolio_id").notNull(),
  ticker: text("ticker").notNull(),
  exchange: text("exchange").notNull(),
  shares: numeric("shares", { precision: 15, scale: 4 }).notNull(),
  purchasePrice: numeric("purchase_price", { precision: 15, scale: 4 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactionsTable = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  portfolioId: integer("portfolio_id").notNull(),
  ticker: text("ticker").notNull(),
  exchange: text("exchange").notNull(),
  type: text("type").notNull(), // BUY | SELL
  shares: numeric("shares", { precision: 15, scale: 4 }).notNull(),
  price: numeric("price", { precision: 15, scale: 4 }).notNull(),
  fees: numeric("fees", { precision: 15, scale: 4 }).notNull().default("0"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfoliosTable);
export const insertHoldingSchema = createInsertSchema(holdingsTable);
export const insertTransactionSchema = createInsertSchema(transactionsTable);

export type Portfolio = typeof portfoliosTable.$inferSelect;
export type Holding = typeof holdingsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
