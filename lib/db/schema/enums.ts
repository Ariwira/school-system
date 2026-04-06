import { pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['superadmin', 'user'])

export const instituteTypeEnum = pgEnum('institute_type', [
  'foundation',
  'school',
])

export const genderEnum = pgEnum('gender', ['male', 'female'])

export const departmentEnum = pgEnum('department', [
  'academic',
  'administration',
  'finance',
  'it',
  'hr',
  'other',
])

export const staffStatusEnum = pgEnum('staff_status', [
  'active',
  'inactive',
  'resigned',
])

export const studentStatusEnum = pgEnum('student_status', [
  'pending',
  'active',
  'graduated',
  'transferred',
  'dropped',
])

export const feeTypeEnum = pgEnum('fee_type', [
  'registration',
  'spp',
  'building',
  'uniform',
  'book',
  'activity',
  'other',
])

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'transfer',
  'virtual_account',
  'qris',
  'other',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'cancelled',
  'refunded',
])

export const transferMethodEnum = pgEnum('transfer_method', [
  'cash',
  'bank_transfer',
  'other',
])

export const transferStatusEnum = pgEnum('transfer_status', [
  'pending',
  'approved',
  'rejected',
  'cancelled',
])
