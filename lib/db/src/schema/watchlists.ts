import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./users";

export const watchlistsTable = pgTable("watchlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const watchlistItemsTable = pgTable("watchlist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  watchlistId: uuid("watchlist_id").notNull().references(() => watchlistsTable.id, { onDelete: 'cascade' }),
  symbol: text("symbol").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(watchlistsTable);
export const selectWatchlistSchema = createSelectSchema(watchlistsTable);
export const insertWatchlistItemSchema = createInsertSchema(watchlistItemsTable);
export const selectWatchlistItemSchema = createSelectSchema(watchlistItemsTable);

export type Watchlist = typeof watchlistsTable.$inferSelect;
export type WatchlistItem = typeof watchlistItemsTable.$inferSelect;
