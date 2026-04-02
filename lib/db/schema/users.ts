import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userRoleEnum } from './enums'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  password: text('password'),
  avatar: text('avatar'),
  role: userRoleEnum('role').notNull().default('school'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
