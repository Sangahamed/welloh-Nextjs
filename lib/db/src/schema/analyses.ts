import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").notNull(),
  ticker: text("ticker").notNull(),
  companyName: text("company_name").notNull(),
  analysisType: text("analysis_type").notNull(),
  summary: text("summary").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable);
export type Analysis = typeof analysesTable.$inferSelect;
