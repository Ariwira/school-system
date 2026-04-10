import { numeric, pgTable, smallint, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { feeTypeEnum } from './enums'

export const fees = pgTable(
  'fees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    feeType: feeTypeEnum('fee_type').notNull(),
    year: smallint('year').notNull(),
    semester: smallint('semester').notNull().default(1), // 1 = Ganjil, 2 = Genap
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('fees_type_year_semester_unique').on(table.feeType, table.year, table.semester)],
)

export type Fee = typeof fees.$inferSelect
export type NewFee = typeof fees.$inferInsert
