import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { paymentMethodEnum, paymentStatusEnum } from './enums'
import { fees } from './fees'
import { students } from './students'

export const feePayments = pgTable('fee_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  feeId: uuid('fee_id').notNull().references(() => fees.id, { onDelete: 'restrict' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'restrict' }),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull(),
  receipt: text('receipt'),
  receiptFile: text('receipt_file'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paidDatetime: timestamp('paid_datetime', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type FeePayment = typeof feePayments.$inferSelect
export type NewFeePayment = typeof feePayments.$inferInsert
