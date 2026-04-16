import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  numeric,
  integer,
  index,
  uniqueIndex,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./users";

// Enums
export const badgeCategoryEnum = pgEnum("badge_category", [
  "trading",
  "prediction",
  "social",
  "learning",
  "achievement",
]);

export const leagueTierEnum = pgEnum("league_tier", [
  "bronze",
  "silver",
  "gold",
  "sapphire",
  "diamond",
  "legend",
]);

// Badges definitions
export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description").notNull(),
    category: text("category").notNull(), // Matching SQL (no enum in SQL schema found for category)
    icon: text("icon"),
    criteria: jsonb("criteria").notNull().$type<Record<string, unknown>>(),
    points: integer("points").default(0),
    rarity: text("rarity").default("common"), // common, uncommon, rare, epic, legendary
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

// User badges
export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_user_badges_user_id").on(table.userId),
    userBadgeUnique: uniqueIndex("idx_user_badges_unique").on(table.userId, table.badgeId),
  })
);

// Leaderboard entries
export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // daily, weekly, monthly, all_time
    pnlScore: numeric("pnl_score", { precision: 10, scale: 2 }).default("0"),
    compositeScore: numeric("composite_score", { precision: 10, scale: 2 }).notNull(),
    rank: integer("rank"),
    winRate: numeric("win_rate", { precision: 5, scale: 2 }).default("0"),
    totalTrades: integer("total_trades").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    periodIdx: index("idx_leaderboard_entries_period").on(table.period),
    scoreIdx: index("idx_leaderboard_entries_score").on(table.compositeScore),
    userIdx: index("idx_leaderboard_entries_user_id").on(table.userId),
    userPeriodUnique: uniqueIndex("idx_leaderboard_user_period").on(table.userId, table.period),
  })
);

// Trading streaks
export const tradingStreaks = pgTable(
  "trading_streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastWinDate: date("last_win_date"),
    lastLossDate: date("last_loss_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_trading_streaks_user_id").on(table.userId),
  })
);

// Schemas
export const insertBadgesSchema = createInsertSchema(badges);
export const selectBadgesSchema = createSelectSchema(badges);

export const insertUserBadgesSchema = createInsertSchema(userBadges);
export const selectUserBadgesSchema = createSelectSchema(userBadges);

export const insertLeaderboardEntriesSchema = createInsertSchema(leaderboardEntries);
export const selectLeaderboardEntriesSchema = createSelectSchema(leaderboardEntries);

export const insertTradingStreaksSchema = createInsertSchema(tradingStreaks);
export const selectTradingStreaksSchema = createSelectSchema(tradingStreaks);

// Types
export type Badges = typeof badges.$inferSelect;
export type InsertBadges = z.infer<typeof insertBadgesSchema>;

export type UserBadges = typeof userBadges.$inferSelect;
export type InsertUserBadges = z.infer<typeof insertUserBadgesSchema>;

export type LeaderboardEntries = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntries = z.infer<typeof insertLeaderboardEntriesSchema>;

export type TradingStreaks = typeof tradingStreaks.$inferSelect;
export type InsertTradingStreaks = z.infer<typeof insertTradingStreaksSchema>;