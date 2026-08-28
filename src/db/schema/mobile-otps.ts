// src/db/schema/mobile-otps.ts

import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const mobileOtps = pgTable('mobile_otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull(),
  otpHash: text('otp_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type MobileOtp = typeof mobileOtps.$inferSelect;
export type NewMobileOtp = typeof mobileOtps.$inferInsert;
