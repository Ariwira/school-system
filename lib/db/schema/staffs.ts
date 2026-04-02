import { date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { departmentEnum, genderEnum, staffStatusEnum } from './enums'
import { institutes } from './institutes'
import { users } from './users'

export const staffs = pgTable('staffs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }).unique(),
  instituteId: uuid('institute_id').notNull().references(() => institutes.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  nik: text('nik').unique(),
  staffNumber: text('staff_number').notNull().unique(),
  phone: text('phone').notNull().unique(),
  email: text('email').notNull().unique(),
  gender: genderEnum('gender').notNull(),
  dob: date('dob').notNull(),
  pob: text('pob'),
  department: departmentEnum('department').notNull(),
  joinDate: date('join_date'),
  status: staffStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Staff = typeof staffs.$inferSelect
export type NewStaff = typeof staffs.$inferInsert
