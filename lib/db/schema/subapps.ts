import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { institutes } from './institutes'

export const subapps = pgTable('subapps', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  type: text('type').notNull(),
  name: text('name'),
  image: text('image'),
  instituteId: uuid('institute_id').references(() => institutes.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Subapp = typeof subapps.$inferSelect
export type NewSubapp = typeof subapps.$inferInsert
