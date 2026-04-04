import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const watchlistsTable = pgTable("watchlists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchlistItemsTable = pgTable("watchlist_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  watchlistId: integer("watchlist_id").notNull(),
  ticker: text("ticker").notNull(),
  exchange: text("exchange").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(watchlistsTable);
export const insertWatchlistItemSchema = createInsertSchema(watchlistItemsTable);

export type Watchlist = typeof watchlistsTable.$inferSelect;
export type WatchlistItem = typeof watchlistItemsTable.$inferSelect;
