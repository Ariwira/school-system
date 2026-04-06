import { pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'
import { subapps } from './subapps'

export const userSubapps = pgTable(
  'user_subapps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subappId: uuid('subapp_id')
      .notNull()
      .references(() => subapps.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex().on(t.userId, t.subappId)],
)

export type UserSubapp = typeof userSubapps.$inferSelect
export type NewUserSubapp = typeof userSubapps.$inferInsert
