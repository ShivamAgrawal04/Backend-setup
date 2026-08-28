// src/db/schema/users.ts

import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(), // Nullable for mobile-only users
  name: varchar('name', { length: 255 }), // Nullable initially for mobile-only users
  phone: varchar('phone', { length: 20 }).unique(), // Nullable for email/OAuth users
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'), // Null for social auth & OTP-only users
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockoutUntil: timestamp('lockout_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
