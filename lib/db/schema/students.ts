import { date, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { genderEnum, studentStatusEnum } from './enums'
import { institutes } from './institutes'

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  instituteId: uuid('institute_id').notNull().references(() => institutes.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  nik: text('nik').unique(),
  nisn: text('nisn').notNull().unique(),
  studentNumber: text('student_number').notNull().unique(),
  dob: date('dob'),
  pob: text('pob'),
  gender: genderEnum('gender').notNull(),
  phone: text('phone').unique(),
  email: text('email').unique(),
  generationYear: smallint('generation_year').notNull(),
  admissionDate: date('admission_date').notNull(),
  status: studentStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Student = typeof students.$inferSelect
export type NewStudent = typeof students.$inferInsert
