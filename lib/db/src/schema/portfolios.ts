import { pgTable, text, numeric, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./users";

export const portfoliosTable = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  initialBalance: numeric("initial_balance", { precision: 15, scale: 2 }).default("100000"),
  currentBalance: numeric("current_balance", { precision: 15, scale: 2 }).default("100000"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const holdingsTable = pgTable("holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfoliosTable.id, { onDelete: 'cascade' }),
  symbol: text("symbol").notNull(),
  shares: numeric("shares", { precision: 15, scale: 2 }).notNull(),
  averagePrice: numeric("average_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }), // Note: SQL uses generated column, Drizzle might just select it
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfoliosTable.id, { onDelete: 'cascade' }),
  symbol: text("symbol").notNull(),
  transactionType: text("transaction_type").notNull(), // buy, sell, short, cover
  orderType: text("order_type").default("market"), // market, limit, stop, stop_limit
  shares: numeric("shares", { precision: 15, scale: 2 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }),
  commission: numeric("commission", { precision: 8, scale: 2 }).default("0"),
  status: text("status").default("completed"), // pending, completed, cancelled, failed
  executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfoliosTable);
export const selectPortfolioSchema = createSelectSchema(portfoliosTable);
export const insertHoldingSchema = createInsertSchema(holdingsTable);
export const selectHoldingSchema = createSelectSchema(holdingsTable);
export const insertTransactionSchema = createInsertSchema(transactionsTable);
export const selectTransactionSchema = createSelectSchema(transactionsTable);

export type Portfolio = typeof portfoliosTable.$inferSelect;
export type Holding = typeof holdingsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
