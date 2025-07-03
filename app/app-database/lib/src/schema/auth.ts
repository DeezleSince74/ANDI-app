import { 
  pgTable, 
  pgSchema, 
  uuid, 
  varchar, 
  boolean, 
  timestamp,
  pgEnum,
  index,
  foreignKey
} from 'drizzle-orm/pg-core';

// Create auth schema
export const authSchema = pgSchema('auth');

// Enums
export const userRoleEnum = pgEnum('user_role', ['teacher', 'coach', 'admin']);

// Auth Schema Tables
export const users = authSchema.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('teacher'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
  isActiveIdx: index('idx_users_is_active').on(table.isActive),
}));

export const passwordResetTokens = authSchema.table('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_password_reset_tokens_user_id').on(table.userId),
  expiresAtIdx: index('idx_password_reset_tokens_expires_at').on(table.expiresAt),
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: 'password_reset_tokens_user_id_fkey'
  }).onDelete('cascade'),
}));

// Type exports for better developer experience
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;