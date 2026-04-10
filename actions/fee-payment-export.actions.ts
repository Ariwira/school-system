'use server'

import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { requireSubappAccess, requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { feePayments, fees, students, institutes, subapps } from '@/lib/db/schema'
import { paymentMethodValues, paymentStatusValues } from '@/lib/validations/fee-payment'
import { z } from 'zod'

const exportFeePaymentsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(paymentStatusValues).optional(),
  paymentMethod: z.enum(paymentMethodValues).optional(),
  feeYear: z.number().int().optional(),
})

export type ExportFeePaymentRow = {
  studentName: string
  studentNumber: string
  nisn: string
  feeType: string
  feeYear: number
  feeSemester: number
  feeAmount: string
  amountPaid: string
  paymentMethod: string
  status: string
  receipt: string | null
  paidDatetime: Date
}

export type ExportFeePaymentsResult =
  | {
      success: true
      data: ExportFeePaymentRow[]
      schoolName: string
      period: string
    }
  | { success: false; error: string }

/**
 * Mengambil SEMUA data pembayaran SPP sesuai filter aktif (tanpa paginasi) untuk keperluan ekspor.
 * Khusus School Admin — data diisolasi per institusi.
 */
export async function getFeePaymentsForExport(
  filters: {
    search?: string
    status?: string
    paymentMethod?: string
    feeYear?: number
  },
  subAppKey: string,
): Promise<ExportFeePaymentsResult> {
  const { subapp } = await requireSubappAccess(subAppKey)

  if (subapp.type !== 'school') {
    return { success: false, error: 'Akses ditolak. Halaman ini hanya untuk sub-aplikasi sekolah.' }
  }

  const scopedInstituteId = subapp.instituteId
  if (!scopedInstituteId) {
    return { success: false, error: 'Institusi tidak ditemukan untuk sub-aplikasi ini.' }
  }

  const parsed = exportFeePaymentsSchema.safeParse({
    search: filters.search || undefined,
    status: filters.status || undefined,
    paymentMethod: filters.paymentMethod || undefined,
    feeYear: filters.feeYear,
  })

  if (!parsed.success) {
    return { success: false, error: 'Parameter filter tidak valid.' }
  }

  const { search, status, paymentMethod, feeYear } = parsed.data

  try {
    // Ambil nama sekolah
    const institute = await db
      .select({ name: institutes.name })
      .from(institutes)
      .where(eq(institutes.id, scopedInstituteId))
      .limit(1)

    const schoolName = institute[0]?.name ?? 'Sekolah'

    const conditions = [eq(students.instituteId, scopedInstituteId)]

    if (status) {
      conditions.push(eq(feePayments.status, status as 'pending' | 'paid' | 'cancelled' | 'refunded'))
    }

    if (paymentMethod) {
      conditions.push(
        eq(
          feePayments.paymentMethod,
          paymentMethod as 'cash' | 'transfer' | 'virtual_account' | 'qris' | 'other',
        ),
      )
    }

    if (feeYear) {
      conditions.push(eq(fees.year, feeYear))
    }

    if (search) {
      const searchCondition = or(
        ilike(students.name, `%${search}%`),
        ilike(students.studentNumber, `%${search}%`),
      )
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    const rows = await db
      .select({
        studentName: students.name,
        studentNumber: students.studentNumber,
        nisn: students.nisn,
        feeType: fees.feeType,
        feeYear: fees.year,
        feeSemester: fees.semester,
        feeAmount: fees.amount,
        amountPaid: feePayments.amountPaid,
        paymentMethod: feePayments.paymentMethod,
        status: feePayments.status,
        receipt: feePayments.receipt,
        paidDatetime: feePayments.paidDatetime,
      })
      .from(feePayments)
      .innerJoin(students, eq(feePayments.studentId, students.id))
      .innerJoin(fees, eq(feePayments.feeId, fees.id))
      .where(and(...conditions))
      .orderBy(desc(feePayments.paidDatetime))

    // Tentukan periode dari filter aktif
    const period = feeYear ? String(feeYear) : 'Semua Tahun'

    const data: ExportFeePaymentRow[] = rows.map((row) => ({
      studentName: row.studentName,
      studentNumber: row.studentNumber,
      nisn: row.nisn,
      feeType: row.feeType,
      feeYear: row.feeYear,
      feeSemester: row.feeSemester,
      feeAmount: row.feeAmount,
      amountPaid: row.amountPaid,
      paymentMethod: row.paymentMethod,
      status: row.status,
      receipt: row.receipt,
      paidDatetime: row.paidDatetime,
    }))

    return { success: true, data, schoolName, period }
  } catch {
    return { success: false, error: 'Gagal mengambil data untuk ekspor. Silakan coba lagi.' }
  }
}
