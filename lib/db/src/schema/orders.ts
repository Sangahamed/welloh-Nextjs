import { pgTable, text, numeric, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { portfoliosTable } from "./portfolios";

export const orderTypeEnum = pgEnum("order_type", [
  "MARKET", 
  "LIMIT", 
  "STOP_LOSS", 
  "TAKE_PROFIT", 
  "OCO", 
  "TRAILING_STOP"
]);

export const orderSideEnum = pgEnum("order_side", ["BUY", "SELL"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING", 
  "FILLED", 
  "CANCELLED", 
  "FAILED"
]);

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfoliosTable.id, { onDelete: 'cascade' }),
  ticker: text("ticker").notNull(),
  exchange: text("exchange").notNull(),
  type: orderTypeEnum("type").notNull(),
  side: orderSideEnum("side").notNull(),
  shares: numeric("shares", { precision: 15, scale: 4 }).notNull(),
  price: numeric("price", { precision: 15, scale: 4 }), // Target price
  stopPrice: numeric("stop_price", { precision: 15, scale: 4 }), // For Stop-Loss/OCO
  status: orderStatusEnum("status").notNull().default("PENDING"),
  filledAt: timestamp("filled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable);
export const selectOrderSchema = createSelectSchema(ordersTable);

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
