import { pgTable, text, integer, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey(), // Supabase auth user ID (UUID)
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  country: text("country"),
  institution: text("institution"),
  role: text("role").default("user"),
  league: text("league").default("bronze"),
  level: integer("level").notNull().default(1),
  experiencePoints: integer("experience_points").default(0),
  totalProfitLoss: numeric("total_profit_loss", { precision: 15, scale: 2 }).default("0"),
  totalTrades: integer("total_trades").default(0),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable);
export const selectProfileSchema = createSelectSchema(profilesTable);
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
