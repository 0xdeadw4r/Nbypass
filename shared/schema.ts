import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports both owner and regular users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isOwner: boolean("is_owner").notNull().default(false),
  credits: decimal("credits", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActive: timestamp("last_active"),
});

// System settings table - for owner to configure base URL and API key
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseUrl: text("base_url"),
  apiKey: text("api_key"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// UIDs table - tracks created UIDs
export const uids = pgTable("uids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  uidValue: text("uid_value").notNull(),
  duration: integer("duration").notNull(), // in hours
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // active, expired, deleted
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Activity logs table - tracks all operations
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // login, create_uid, delete_uid, update_uid, credit_add, credit_deduct
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  uids: many(uids),
  activityLogs: many(activityLogs),
}));

export const uidsRelations = relations(uids, ({ one }) => ({
  user: one(users, {
    fields: [uids.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
  isActive: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isOwner: z.boolean().optional().default(false),
  credits: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? "0" : String(val),
    z.string().refine(val => /^\d+(\.\d{1,2})?$/.test(val), "Credits must be a valid decimal number")
  ).optional().default("0"),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  baseUrl: true,
  apiKey: true,
});

// Client-side UID schema (without server-calculated fields)
export const insertUidSchema = createInsertSchema(uids).pick({
  userId: true,
  uidValue: true,
  duration: true,
}).extend({
  uidValue: z.string().min(6, "UID must be at least 6 characters").max(12, "UID must be at most 12 characters"),
  duration: z.number().positive(),
});

// Server-side UID schema (with all required fields)
export const createUidSchema = createInsertSchema(uids).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  planId: z.number().optional(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  action: true,
  details: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Update credit schema
export const updateCreditSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  operation: z.enum(["add", "deduct"]),
});

// Update UID value schema
export const updateUidValueSchema = z.object({
  newUidValue: z.string().min(6, "UID must be at least 6 characters").max(12, "UID must be at most 12 characters"),
});

// Infer types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Uid = typeof uids.$inferSelect;
export type InsertUid = z.infer<typeof insertUidSchema>;
export type CreateUid = z.infer<typeof createUidSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateCredit = z.infer<typeof updateCreditSchema>;
export type UpdateUidValue = z.infer<typeof updateUidValueSchema>;
