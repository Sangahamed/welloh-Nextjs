import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./users";

export const analysesTable = pgTable("analysis_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: 'cascade' }),
  companyIdentifier: text("company_identifier").notNull(),
  comparisonIdentifier: text("comparison_identifier"),
  currency: text("currency"),
  analysisData: jsonb("analysis_data").notNull().default({}),
  newsData: jsonb("news_data").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable);
export const selectAnalysisSchema = createSelectSchema(analysesTable);
export type Analysis = typeof analysesTable.$inferSelect;
