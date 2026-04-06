import { boolean, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { instituteTypeEnum } from './enums'

export const institutes = pgTable('institutes', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  name: text('name').notNull().unique(),
  address: text('address').notNull(),
  phone: text('phone').notNull().unique(),
  email: text('email').unique(),
  image: text('image'),
  establishedYear: smallint('established_year'),
  type: instituteTypeEnum('type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Institute = typeof institutes.$inferSelect
export type NewInstitute = typeof institutes.$inferInsert
