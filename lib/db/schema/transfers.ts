import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { transferMethodEnum, transferStatusEnum } from './enums'
import { institutes } from './institutes'
import { staffs } from './staffs'

export const transfers = pgTable('transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  transferFromId: uuid('transfer_from_id').notNull().references(() => institutes.id, { onDelete: 'restrict' }),
  transferToId: uuid('transfer_to_id').notNull().references(() => institutes.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  issuerId: uuid('issuer_id').notNull().references(() => staffs.id, { onDelete: 'restrict' }),
  senderId: uuid('sender_id').notNull().references(() => staffs.id, { onDelete: 'restrict' }),
  receiverId: uuid('receiver_id').references(() => staffs.id, { onDelete: 'set null' }),
  approverId: uuid('approver_id').references(() => staffs.id, { onDelete: 'set null' }),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  status: transferStatusEnum('status').notNull().default('pending'),
  transferMethod: transferMethodEnum('transfer_method').notNull(),
  receipt: text('receipt'),
  receiptFile: text('receipt_file'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Transfer = typeof transfers.$inferSelect
export type NewTransfer = typeof transfers.$inferInsert
