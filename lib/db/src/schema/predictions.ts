import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  numeric,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./users";

// Predictions table
export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    options: jsonb("options").notNull().$type<Array<any>>(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    settlementDate: timestamp("settlement_date", { withTimezone: true }),
    settlementValue: text("settlement_value"),
    status: text("status").notNull().default("active"), // active, resolved, cancelled
    totalVolume: numeric("total_volume", { precision: 15, scale: 2 }).default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    creatorIdx: index("idx_predictions_creator_id").on(table.creatorId),
    statusIdx: index("idx_predictions_status").on(table.status),
    endDateIdx: index("idx_predictions_end_date").on(table.endDate),
  })
);

// Bets table
export const bets = pgTable(
  "bets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    predictionId: uuid("prediction_id")
      .notNull()
      .references(() => predictions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    optionIndex: integer("option_index").notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    odds: numeric("odds", { precision: 8, scale: 4 }).notNull(),
    outcome: text("outcome").default("pending"), // win, loss, pending
    payout: numeric("payout", { precision: 15, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (table) => ({
    predictionIdx: index("idx_bets_prediction_id").on(table.predictionId),
    userIdx: index("idx_bets_user_id").on(table.userId),
  })
);

// Prediction orderbook
export const predictionOrderbook = pgTable(
  "prediction_orderbook",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    predictionId: uuid("prediction_id")
      .notNull()
      .references(() => predictions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    optionIndex: integer("option_index").notNull(),
    orderType: text("order_type").notNull(), // buy, sell
    price: numeric("price", { precision: 8, scale: 4 }).notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    filledAmount: numeric("filled_amount", { precision: 15, scale: 2 }).default("0"),
    status: text("status").notNull().default("open"), // open, filled, cancelled
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    predictionIdx: index("idx_prediction_orderbook_prediction_id").on(table.predictionId),
    statusIdx: index("idx_prediction_orderbook_status").on(table.status),
  })
);

// Prediction chat messages
export const predictionChats = pgTable(
  "prediction_chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    predictionId: uuid("prediction_id")
      .notNull()
      .references(() => predictions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    predictionIdx: index("idx_prediction_chats_prediction_id").on(table.predictionId),
  })
);

// Schemas
export const insertPredictionSchema = createInsertSchema(predictions);
export const selectPredictionSchema = createSelectSchema(predictions);
export const insertBetSchema = createInsertSchema(bets);
export const selectBetSchema = createSelectSchema(bets);
export const insertOrderbookSchema = createInsertSchema(predictionOrderbook);
export const selectOrderbookSchema = createSelectSchema(predictionOrderbook);
export const insertPredictionChatSchema = createInsertSchema(predictionChats);
export const selectPredictionChatSchema = createSelectSchema(predictionChats);

// Types
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type PredictionOrderbook = typeof predictionOrderbook.$inferSelect;
export type InsertPredictionOrderbook = z.infer<typeof insertOrderbookSchema>;
export type PredictionChat = typeof predictionChats.$inferSelect;
export type InsertPredictionChat = z.infer<typeof insertPredictionChatSchema>;