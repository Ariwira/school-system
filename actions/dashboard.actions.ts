'use server'

import { and, count, eq, gte, lte, or, sum } from 'drizzle-orm'
import Decimal from 'decimal.js'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import {
  feePayments,
  institutes,
  staffs,
  students,
  transfers,
} from '@/lib/db/schema'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type SuperadminStats = {
  totalInstitutes: number
  totalStaffs: number
  totalActiveStudents: number
  totalPendingTransfers: number
  totalSppThisMonth: string
}

export type FoundationStats = {
  totalFoundationStaffs: number
  totalOutgoingPendingTransfers: number
  totalIncomingPendingTransfers: number
  totalTransferredThisMonth: string
}

export type SchoolStats = {
  totalActiveStudents: number
  totalPendingStudents: number
  totalUnpaidSppThisMonth: number
  totalIncomingPendingTransfers: number
}

/**
 * Statistik global untuk superadmin dashboard.
 * Mengambil data dari seluruh institusi tanpa pembatasan.
 */
export async function getSuperadminStats(): Promise<ActionResult<SuperadminStats>> {
  await requireRole(['superadmin'])

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [
      totalInstitutesResult,
      totalStaffsResult,
      totalActiveStudentsResult,
      totalPendingTransfersResult,
      totalSppResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(institutes),
      db.select({ count: count() }).from(staffs).where(eq(staffs.status, 'active')),
      db.select({ count: count() }).from(students).where(eq(students.status, 'active')),
      db.select({ count: count() }).from(transfers).where(eq(transfers.status, 'pending')),
      db
        .select({ total: sum(feePayments.amountPaid) })
        .from(feePayments)
        .where(
          and(
            eq(feePayments.status, 'paid'),
            gte(feePayments.paidDatetime, startOfMonth),
            lte(feePayments.paidDatetime, endOfMonth),
          ),
        ),
    ])

    const rawTotal = totalSppResult[0]?.total ?? '0'
    const totalSppThisMonth = new Decimal(rawTotal || '0').toFixed(2)

    return {
      success: true,
      data: {
        totalInstitutes: totalInstitutesResult[0]?.count ?? 0,
        totalStaffs: totalStaffsResult[0]?.count ?? 0,
        totalActiveStudents: totalActiveStudentsResult[0]?.count ?? 0,
        totalPendingTransfers: totalPendingTransfersResult[0]?.count ?? 0,
        totalSppThisMonth,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil statistik superadmin.' }
  }
}

/**
 * Statistik untuk foundation admin dashboard.
 * Di-scope ke yayasan (institusi) milik subapp yang diakses.
 */
export async function getFoundationStats(
  subAppKey: string,
): Promise<ActionResult<FoundationStats>> {
  const { subapp } = await requireSubappAccess(subAppKey)

  if (!subapp.instituteId) {
    return { success: false, error: 'Yayasan belum memiliki institusi yang terkait.' }
  }

  const instituteId = subapp.instituteId

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [
      totalFoundationStaffsResult,
      totalOutgoingPendingResult,
      totalIncomingPendingResult,
      totalTransferredResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(staffs)
        .where(
          and(eq(staffs.instituteId, instituteId), eq(staffs.status, 'active')),
        ),
      db
        .select({ count: count() })
        .from(transfers)
        .where(
          and(
            eq(transfers.transferFromId, instituteId),
            eq(transfers.status, 'pending'),
          ),
        ),
      db
        .select({ count: count() })
        .from(transfers)
        .where(
          and(
            eq(transfers.transferToId, instituteId),
            eq(transfers.status, 'pending'),
          ),
        ),
      db
        .select({ total: sum(transfers.amount) })
        .from(transfers)
        .where(
          and(
            or(
              eq(transfers.transferFromId, instituteId),
              eq(transfers.transferToId, instituteId),
            ),
            eq(transfers.status, 'approved'),
            gte(transfers.approvedAt, startOfMonth),
            lte(transfers.approvedAt, endOfMonth),
          ),
        ),
    ])

    const rawTotal = totalTransferredResult[0]?.total ?? '0'
    const totalTransferredThisMonth = new Decimal(rawTotal || '0').toFixed(2)

    return {
      success: true,
      data: {
        totalFoundationStaffs: totalFoundationStaffsResult[0]?.count ?? 0,
        totalOutgoingPendingTransfers: totalOutgoingPendingResult[0]?.count ?? 0,
        totalIncomingPendingTransfers: totalIncomingPendingResult[0]?.count ?? 0,
        totalTransferredThisMonth,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil statistik yayasan.' }
  }
}

/**
 * Statistik untuk school admin dashboard.
 * Di-scope ke sekolah (institusi) milik subapp yang diakses.
 */
export async function getSchoolStats(
  subAppKey: string,
): Promise<ActionResult<SchoolStats>> {
  const { subapp } = await requireSubappAccess(subAppKey)

  if (!subapp.instituteId) {
    return { success: false, error: 'Sekolah belum memiliki institusi yang terkait.' }
  }

  const instituteId = subapp.instituteId

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [
      totalActiveStudentsResult,
      totalPendingStudentsResult,
      totalUnpaidSppResult,
      totalIncomingPendingResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(students)
        .where(
          and(
            eq(students.instituteId, instituteId),
            eq(students.status, 'active'),
          ),
        ),
      db
        .select({ count: count() })
        .from(students)
        .where(
          and(
            eq(students.instituteId, instituteId),
            eq(students.status, 'pending'),
          ),
        ),
      // SPP belum dibayar bulan ini = pembayaran berstatus pending yang dibuat bulan ini
      db
        .select({ count: count() })
        .from(feePayments)
        .innerJoin(students, eq(feePayments.studentId, students.id))
        .where(
          and(
            eq(students.instituteId, instituteId),
            eq(feePayments.status, 'pending'),
            gte(feePayments.createdAt, startOfMonth),
            lte(feePayments.createdAt, endOfMonth),
          ),
        ),
      db
        .select({ count: count() })
        .from(transfers)
        .where(
          and(
            eq(transfers.transferToId, instituteId),
            eq(transfers.status, 'pending'),
          ),
        ),
    ])

    return {
      success: true,
      data: {
        totalActiveStudents: totalActiveStudentsResult[0]?.count ?? 0,
        totalPendingStudents: totalPendingStudentsResult[0]?.count ?? 0,
        totalUnpaidSppThisMonth: totalUnpaidSppResult[0]?.count ?? 0,
        totalIncomingPendingTransfers: totalIncomingPendingResult[0]?.count ?? 0,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil statistik sekolah.' }
  }
}
