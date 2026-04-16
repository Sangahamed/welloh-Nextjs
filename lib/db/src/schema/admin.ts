import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  numeric,
  index,
  inet,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./users";

// System settings (key-value configuration)
export const systemSettings = pgTable(
  "system_settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

// Feature flags
export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    enabled: boolean("enabled").notNull().default(false),
    rolloutPercentage: integer("rollout_percentage").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

// Admin logs (audit trail)
export const adminLogs = pgTable(
  "admin_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: 'cascade' }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(), 
    targetId: uuid("target_id"),
    details: jsonb("details"),
    ipAddress: inet("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    adminIdx: index("idx_admin_logs_admin_id").on(table.adminId),
    createdAtIdx: index("idx_admin_logs_created_at").on(table.createdAt),
  })
);

// Reports (user flagging system)
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: 'cascade' }),
    targetType: text("target_type").notNull(), // 'user', 'prediction', 'trade', 'message'
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    description: text("description"),
    status: text("status").notNull().default("pending"), // pending, investigating, resolved, dismissed
    reviewedBy: uuid("reviewed_by").references(() => profilesTable.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("idx_reports_status").on(table.status),
    targetTypeIdx: index("idx_reports_target_type").on(table.targetType),
  })
);

// Support tickets
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    category: text("category").notNull(), // general, technical, billing, feature_request, bug_report
    priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
    status: text("status").notNull().default("open"), // open, in_progress, waiting_for_user, resolved, closed
    assignedTo: uuid("assigned_to").references(() => profilesTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index("idx_support_tickets_status").on(table.status),
    userIdx: index("idx_support_tickets_user_id").on(table.userId),
    priorityIdx: index("idx_support_tickets_priority").on(table.priority),
    createdAtIdx: index("idx_support_tickets_created_at").on(table.createdAt),
  })
);

// Ticket messages
export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ticketIdx: index("idx_ticket_messages_ticket_id").on(table.ticketId),
  })
);

// System health metrics
export const systemHealth = pgTable(
  "system_health",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceName: text("service_name").notNull(),
    status: text("status").notNull(), // healthy, degraded, unhealthy, down
    responseTimeMs: integer("response_time_ms"),
    errorRate: numeric("error_rate", { precision: 5, scale: 2 }),
    uptimePercentage: numeric("uptime_percentage", { precision: 5, scale: 2 }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    details: jsonb("details"),
  },
  (table) => ({
    serviceIdx: index("idx_system_health_service_name").on(table.serviceName),
    recordedIdx: index("idx_system_health_recorded_at").on(table.recordedAt),
    statusIdx: index("idx_system_health_status").on(table.status),
  })
);

// Schemas
export const insertSystemSettingsSchema = createInsertSchema(systemSettings);
export const selectSystemSettingsSchema = createSelectSchema(systemSettings);

export const insertFeatureFlagsSchema = createInsertSchema(featureFlags);
export const selectFeatureFlagsSchema = createSelectSchema(featureFlags);

export const insertAdminLogsSchema = createInsertSchema(adminLogs);
export const selectAdminLogsSchema = createSelectSchema(adminLogs);

export const insertReportsSchema = createInsertSchema(reports);
export const selectReportsSchema = createSelectSchema(reports);

export const insertSupportTicketsSchema = createInsertSchema(supportTickets);
export const selectSupportTicketsSchema = createSelectSchema(supportTickets);

export const insertTicketMessagesSchema = createInsertSchema(ticketMessages);
export const selectTicketMessagesSchema = createSelectSchema(ticketMessages);

export const insertSystemHealthSchema = createInsertSchema(systemHealth);
export const selectSystemHealthSchema = createSelectSchema(systemHealth);

// Types
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export type FeatureFlags = typeof featureFlags.$inferSelect;
export type InsertFeatureFlags = z.infer<typeof insertFeatureFlagsSchema>;

export type AdminLogs = typeof adminLogs.$inferSelect;
export type InsertAdminLogs = z.infer<typeof insertAdminLogsSchema>;

export type Reports = typeof reports.$inferSelect;
export type InsertReports = z.infer<typeof insertReportsSchema>;

export type SupportTickets = typeof supportTickets.$inferSelect;
export type InsertSupportTickets = z.infer<typeof insertSupportTicketsSchema>;

export type TicketMessages = typeof ticketMessages.$inferSelect;
export type InsertTicketMessages = z.infer<typeof insertTicketMessagesSchema>;

export type SystemHealth = typeof systemHealth.$inferSelect;
export type InsertSystemHealth = z.infer<typeof insertSystemHealthSchema>;