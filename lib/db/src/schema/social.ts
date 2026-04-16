import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./users";

// Follow relationships (matches SQL 'follows' table or similar)
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    followerIdx: index("idx_follows_follower_id").on(table.followerId),
    followingIdx: index("idx_follows_following_id").on(table.followingId),
    followUnique: uniqueIndex("idx_follows_unique").on(table.followerId, table.followingId),
  })
);

// Activity feed
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(), // 'trade', 'prediction', 'badge', 'follow', 'comment'
    description: text("description").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_activities_user_id").on(table.userId),
    createdAtIdx: index("idx_activities_created_at").on(table.createdAt),
  })
);

// Trading rooms (virtual groups)
export const tradingRooms = pgTable(
  "trading_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").notNull().default(true),
    maxMembers: integer("max_members").default(100),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

// Trading room members
export const tradingRoomMembers = pgTable(
  "trading_room_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => tradingRooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // 'member', 'moderator', 'admin'
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roomIdx: index("idx_trading_room_members_room_id").on(table.roomId),
    userRoomIdx: index("idx_trading_room_members_user_id").on(table.userId),
    memberUnique: uniqueIndex("idx_trading_room_members_unique").on(table.roomId, table.userId),
  })
);

// Trading room messages
export const tradingRoomMessages = pgTable(
  "trading_room_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => tradingRooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    messageType: text("message_type").default("text"), // 'text', 'system', 'trade_alert'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roomIdx: index("idx_trading_room_messages_room_id").on(table.roomId),
    createdAtIdx: index("idx_trading_room_messages_created_at").on(table.createdAt),
  })
);

// Schemas
export const insertFollowsSchema = createInsertSchema(follows);
export const selectFollowsSchema = createSelectSchema(follows);

export const insertActivitiesSchema = createInsertSchema(activities);
export const selectActivitiesSchema = createSelectSchema(activities);

export const insertTradingRoomsSchema = createInsertSchema(tradingRooms);
export const selectTradingRoomsSchema = createSelectSchema(tradingRooms);

export const insertTradingRoomMembersSchema = createInsertSchema(tradingRoomMembers);
export const selectTradingRoomMembersSchema = createSelectSchema(tradingRoomMembers);

export const insertTradingRoomMessagesSchema = createInsertSchema(tradingRoomMessages);
export const selectTradingRoomMessagesSchema = createSelectSchema(tradingRoomMessages);

// Types
export type Follows = typeof follows.$inferSelect;
export type InsertFollows = z.infer<typeof insertFollowsSchema>;

export type Activities = typeof activities.$inferSelect;
export type InsertActivities = z.infer<typeof insertActivitiesSchema>;

export type TradingRooms = typeof tradingRooms.$inferSelect;
export type InsertTradingRooms = z.infer<typeof insertTradingRoomsSchema>;

export type TradingRoomMembers = typeof tradingRoomMembers.$inferSelect;
export type InsertTradingRoomMembers = z.infer<typeof insertTradingRoomMembersSchema>;

export type TradingRoomMessages = typeof tradingRoomMessages.$inferSelect;
export type InsertTradingRoomMessages = z.infer<typeof insertTradingRoomMessagesSchema>;