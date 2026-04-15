'use server'

import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { feePayments, fees, institutes, staffs, students } from '@/lib/db/schema'
import { sendPaymentConfirmedEmail } from '@/lib/email'
import {
  createFeePaymentSchema,
  getFeePaymentsSchema,
  type CreateFeePaymentInput,
  type GetFeePaymentsInput,
  type FeePaymentRow,
  type ActionResult,
} from '@/lib/validations/fee-payment'

function revalidateFeePaymentPaths(subAppKey?: string) {
  revalidatePath('/superadmin/fee-payments')
  if (subAppKey) {
    revalidatePath(`/school/${subAppKey}/fee-payments`)
  }
}

/**
 * Mengambil daftar pembayaran SPP dengan paginasi dan filter opsional.
 * Superadmin dapat melihat semua data; school hanya data di institusinya.
 */
export async function getFeePayments(
  input: Partial<GetFeePaymentsInput> = {},
  subAppKey?: string,
): Promise<ActionResult<{ data: FeePaymentRow[]; total: number; page: number; perPage: number }>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak. Halaman ini hanya untuk sub-aplikasi sekolah.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
    scopedInstituteId = input.instituteId
  }

  const parsed = getFeePaymentsSchema.safeParse({
    page: input.page ?? 1,
    perPage: input.perPage ?? 10,
    search: input.search,
    status: input.status,
    paymentMethod: input.paymentMethod,
    feeYear: input.feeYear,
    instituteId: scopedInstituteId,
  })

  if (!parsed.success) {
    return { success: false, error: 'Parameter tidak valid.' }
  }

  const { page, perPage, search, status, paymentMethod, feeYear } = parsed.data
  const offset = (page - 1) * perPage

  try {
    const conditions = []

    if (scopedInstituteId) {
      conditions.push(eq(students.instituteId, scopedInstituteId))
    }

    if (status) {
      conditions.push(eq(feePayments.status, status))
    }

    if (paymentMethod) {
      conditions.push(eq(feePayments.paymentMethod, paymentMethod))
    }

    if (feeYear) {
      conditions.push(eq(fees.year, feeYear))
    }

    if (search) {
      conditions.push(
        or(
          ilike(students.name, `%${search}%`),
          ilike(students.studentNumber, `%${search}%`),
        ),
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: feePayments.id,
        studentId: feePayments.studentId,
        studentName: students.name,
        studentNumber: students.studentNumber,
        feeId: feePayments.feeId,
        feeType: fees.feeType,
        feeYear: fees.year,
        feeSemester: fees.semester,
        feeAmount: fees.amount,
        amountPaid: feePayments.amountPaid,
        paymentMethod: feePayments.paymentMethod,
        receipt: feePayments.receipt,
        receiptFile: feePayments.receiptFile,
        status: feePayments.status,
        paidDatetime: feePayments.paidDatetime,
        createdAt: feePayments.createdAt,
        updatedAt: feePayments.updatedAt,
      })
      .from(feePayments)
      .innerJoin(students, eq(feePayments.studentId, students.id))
      .innerJoin(fees, eq(feePayments.feeId, fees.id))
      .where(whereClause)
      .orderBy(desc(feePayments.createdAt))
      .limit(perPage)
      .offset(offset)

    const totalResult = await db
      .select({ count: count() })
      .from(feePayments)
      .innerJoin(students, eq(feePayments.studentId, students.id))
      .innerJoin(fees, eq(feePayments.feeId, fees.id))
      .where(whereClause)

    const total = totalResult[0]?.count ?? 0

    const data: FeePaymentRow[] = rows.map((row) => ({
      ...row,
      feeType: row.feeType,
      feeYear: row.feeYear,
      feeSemester: row.feeSemester,
      receipt: row.receipt ?? null,
      receiptFile: row.receiptFile ?? null,
    }))

    return { success: true, data: { data, total, page, perPage } }
  } catch {
    return { success: false, error: 'Gagal mengambil data pembayaran. Silakan coba lagi.' }
  }
}

/**
 * Mengambil riwayat pembayaran berdasarkan ID siswa.
 */
export async function getFeePaymentsByStudent(
  studentId: string,
  subAppKey?: string,
): Promise<ActionResult<FeePaymentRow[]>> {
  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }

    // Validasi siswa milik institusi yang sama dengan subapp
    if (!studentId) {
      return { success: false, error: 'ID siswa tidak valid.' }
    }
    const studentCheck = await db
      .select({ instituteId: students.instituteId })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1)

    if (!studentCheck[0] || studentCheck[0].instituteId !== subapp.instituteId) {
      return { success: false, error: 'Siswa tidak ditemukan di institusi ini.' }
    }
  } else {
    await requireRole(['superadmin'])
  }

  if (!studentId) {
    return { success: false, error: 'ID siswa tidak valid.' }
  }

  try {
    const rows = await db
      .select({
        id: feePayments.id,
        studentId: feePayments.studentId,
        studentName: students.name,
        studentNumber: students.studentNumber,
        feeId: feePayments.feeId,
        feeType: fees.feeType,
        feeYear: fees.year,
        feeSemester: fees.semester,
        feeAmount: fees.amount,
        amountPaid: feePayments.amountPaid,
        paymentMethod: feePayments.paymentMethod,
        receipt: feePayments.receipt,
        receiptFile: feePayments.receiptFile,
        status: feePayments.status,
        paidDatetime: feePayments.paidDatetime,
        createdAt: feePayments.createdAt,
        updatedAt: feePayments.updatedAt,
      })
      .from(feePayments)
      .innerJoin(students, eq(feePayments.studentId, students.id))
      .innerJoin(fees, eq(feePayments.feeId, fees.id))
      .where(eq(feePayments.studentId, studentId))
      .orderBy(desc(feePayments.createdAt))

    const data: FeePaymentRow[] = rows.map((row) => ({
      ...row,
      feeType: row.feeType,
      feeYear: row.feeYear,
      feeSemester: row.feeSemester,
      receipt: row.receipt ?? null,
      receiptFile: row.receiptFile ?? null,
    }))

    return { success: true, data }
  } catch {
    return { success: false, error: 'Gagal mengambil riwayat pembayaran. Silakan coba lagi.' }
  }
}

/**
 * Mencatat pembayaran SPP baru.
 * Validasi: siswa harus berstatus active.
 * Validasi: jika metode transfer, bukti wajib ada.
 */
export async function createFeePayment(
  input: CreateFeePaymentInput,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak. Halaman ini hanya untuk sub-aplikasi sekolah.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  const parsed = createFeePaymentSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { studentId, feeId, amountPaid, paymentMethod, receipt, receiptFile, paidDatetime } =
    parsed.data

  // Validasi Decimal.js untuk jumlah pembayaran
  let decimalAmount: string
  try {
    const d = new Decimal(amountPaid)
    if (d.isNegative() || d.isZero()) {
      return { success: false, error: 'Jumlah pembayaran harus lebih dari 0.' }
    }
    decimalAmount = d.toFixed(2)
  } catch {
    return { success: false, error: 'Format jumlah pembayaran tidak valid.' }
  }

  try {
    // Validasi: siswa ada dan berstatus active
    const student = await db
      .select({ id: students.id, status: students.status, instituteId: students.instituteId })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1)

    if (!student[0]) {
      return { success: false, error: 'Siswa tidak ditemukan.' }
    }

    if (student[0].status !== 'active') {
      return {
        success: false,
        error: 'Pembayaran hanya dapat dilakukan untuk siswa berstatus aktif.',
      }
    }

    // Validasi data isolation: pastikan siswa milik institusi yang benar
    if (scopedInstituteId && student[0].instituteId !== scopedInstituteId) {
      return { success: false, error: 'Siswa tidak terdaftar di institusi ini.' }
    }

    // Validasi: tarif biaya ada
    const fee = await db
      .select({ id: fees.id, amount: fees.amount })
      .from(fees)
      .where(eq(fees.id, feeId))
      .limit(1)

    if (!fee[0]) {
      return { success: false, error: 'Tarif biaya tidak ditemukan.' }
    }

    // Validasi: jumlah bayar tidak boleh melebihi tarif
    const feeAmount = new Decimal(fee[0].amount)
    const paidAmount = new Decimal(decimalAmount)
    if (paidAmount.gt(feeAmount)) {
      return {
        success: false,
        error: `Jumlah pembayaran tidak boleh melebihi tarif biaya (${feeAmount.toFixed(2)}).`,
      }
    }

    const [newPayment] = await db
      .insert(feePayments)
      .values({
        studentId,
        feeId,
        amountPaid: decimalAmount,
        paymentMethod,
        receipt: receipt || null,
        receiptFile: receiptFile || null,
        status: 'pending',
        paidDatetime: new Date(paidDatetime),
      })
      .returning({ id: feePayments.id })

    if (!newPayment) {
      return { success: false, error: 'Gagal mencatat pembayaran.' }
    }

    revalidateFeePaymentPaths(subAppKey)
    return { success: true, data: { id: newPayment.id } }
  } catch {
    return { success: false, error: 'Gagal mencatat pembayaran. Silakan coba lagi.' }
  }
}

/**
 * Mengonfirmasi pembayaran: pending → paid.
 * Pembayaran yang sudah paid tidak bisa dikembalikan ke pending.
 */
export async function confirmPayment(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID pembayaran tidak valid.' }
  }

  try {
    const existing = await db
      .select({
        id: feePayments.id,
        status: feePayments.status,
        studentId: feePayments.studentId,
      })
      .from(feePayments)
      .where(eq(feePayments.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Data pembayaran tidak ditemukan.' }
    }

    if (existing[0].status !== 'pending') {
      return {
        success: false,
        error: 'Hanya pembayaran berstatus pending yang dapat dikonfirmasi.',
      }
    }

    // Validasi data isolation untuk school
    if (scopedInstituteId) {
      const studentData = await db
        .select({ instituteId: students.instituteId })
        .from(students)
        .where(eq(students.id, existing[0].studentId))
        .limit(1)

      if (!studentData[0] || studentData[0].instituteId !== scopedInstituteId) {
        return { success: false, error: 'Akses ditolak. Data pembayaran bukan milik institusi ini.' }
      }
    }

    await db
      .update(feePayments)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(feePayments.id, id))

    revalidateFeePaymentPaths(subAppKey)

    // Kirim notifikasi email ke admin sekolah terkait — graceful
    void sendPaymentConfirmedNotification({
      feePaymentId: id,
      studentId: existing[0].studentId,
      scopedInstituteId,
    })

    return { success: true, data: { id, status: 'paid' } }
  } catch {
    return { success: false, error: 'Gagal mengonfirmasi pembayaran. Silakan coba lagi.' }
  }
}

/**
 * Mengirim notifikasi konfirmasi pembayaran ke admin sekolah.
 * Dipanggil secara async — kegagalan tidak memblokir operasi utama.
 */
async function sendPaymentConfirmedNotification(params: {
  feePaymentId: string
  studentId: string
  scopedInstituteId: string | undefined
}): Promise<void> {
  try {
    // Ambil detail pembayaran, siswa, dan fee
    const paymentDetail = await db
      .select({
        amountPaid: feePayments.amountPaid,
        paymentMethod: feePayments.paymentMethod,
        studentName: students.name,
        studentNumber: students.studentNumber,
        studentInstituteId: students.instituteId,
        feeType: fees.feeType,
        feeYear: fees.year,
        feeSemester: fees.semester,
      })
      .from(feePayments)
      .innerJoin(students, eq(feePayments.studentId, students.id))
      .innerJoin(fees, eq(feePayments.feeId, fees.id))
      .where(eq(feePayments.id, params.feePaymentId))
      .limit(1)

    if (!paymentDetail[0]) {
      console.error('[fee-payment] Detail pembayaran tidak ditemukan untuk notifikasi email:', params.feePaymentId)
      return
    }

    const detail = paymentDetail[0]
    const instituteId = params.scopedInstituteId ?? detail.studentInstituteId
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Cari semua staf aktif dari institusi sekolah yang punya email
    const schoolStaffs = await db
      .select({ email: staffs.email, name: staffs.name })
      .from(staffs)
      .innerJoin(institutes, eq(staffs.instituteId, institutes.id))
      .where(
        and(
          eq(staffs.instituteId, instituteId),
          eq(staffs.status, 'active'),
          eq(institutes.type, 'school'),
        ),
      )

    // Kirim email ke semua staf sekolah secara paralel
    await Promise.allSettled(
      schoolStaffs.map((staff) =>
        sendPaymentConfirmedEmail(staff.email, {
          adminName: staff.name,
          studentName: detail.studentName,
          studentNumber: detail.studentNumber,
          feeType: detail.feeType,
          feeYear: detail.feeYear,
          feeSemester: detail.feeSemester,
          amountPaid: detail.amountPaid,
          paymentMethod: detail.paymentMethod,
          confirmedAt: new Date(),
          appUrl,
        }),
      ),
    )
  } catch (err) {
    console.error('[fee-payment] Gagal mengirim notifikasi email konfirmasi pembayaran:', err)
  }
}

/**
 * Mengambil daftar siswa aktif untuk dropdown di form pembayaran.
 */
export async function getActiveStudentsForPayment(
  subAppKey?: string,
  search?: string,
): Promise<ActionResult<{ id: string; name: string; studentNumber: string; nisn: string }[]>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  try {
    const conditions = [eq(students.status, 'active')]

    if (scopedInstituteId) {
      conditions.push(eq(students.instituteId, scopedInstituteId))
    }

    if (search) {
      const searchCondition = or(
        ilike(students.name, `%${search}%`),
        ilike(students.studentNumber, `%${search}%`),
        ilike(students.nisn, `%${search}%`),
      )
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    const rows = await db
      .select({
        id: students.id,
        name: students.name,
        studentNumber: students.studentNumber,
        nisn: students.nisn,
      })
      .from(students)
      .where(and(...conditions))
      .orderBy(students.name)
      .limit(50)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Gagal mengambil data siswa aktif.' }
  }
}

/**
 * Mengambil detail pembayaran SPP berdasarkan ID.
 */
export async function getFeePaymentById(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<FeePaymentRow>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak. Halaman ini hanya untuk sub-aplikasi sekolah.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID pembayaran tidak valid.' }
  }

  try {
    const rows = await db
      .select({
        id: feePayments.id,
        studentId: feePayments.studentId,
        studentName: students.name,
        studentNumber: students.studentNumber,
        feeId: feePayments.feeId,
        feeType: fees.feeType,
        feeYear: fees.year,
        feeSemester: fees.semester,
        feeAmount: fees.amount,
        amountPaid: feePayments.amountPaid,
        paymentMethod: feePayments.paymentMethod,
        receipt: feePayments.receipt,
        receiptFile: feePayments.receiptFile,
        status: feePayments.status,
        paidDatetime: feePayments.paidDatetime,
        studentInstituteId: students.instituteId,
        createdAt: feePayments.createdAt,
        updatedAt: feePayments.updatedAt,
      })
      .from(feePayments)
      .innerJoin(students, eq(feePayments.studentId, students.id))
      .innerJoin(fees, eq(feePayments.feeId, fees.id))
      .where(eq(feePayments.id, id))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return { success: false, error: 'Data pembayaran tidak ditemukan.' }
    }

    // Data isolation: pastikan pembayaran milik institusi yang benar
    if (scopedInstituteId && row.studentInstituteId !== scopedInstituteId) {
      return { success: false, error: 'Akses ditolak.' }
    }

    return {
      success: true,
      data: {
        id: row.id,
        studentId: row.studentId,
        studentName: row.studentName,
        studentNumber: row.studentNumber,
        feeId: row.feeId,
        feeType: row.feeType,
        feeYear: row.feeYear,
        feeSemester: row.feeSemester,
        feeAmount: row.feeAmount,
        amountPaid: row.amountPaid,
        paymentMethod: row.paymentMethod,
        receipt: row.receipt ?? null,
        receiptFile: row.receiptFile ?? null,
        status: row.status,
        paidDatetime: row.paidDatetime,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil data pembayaran. Silakan coba lagi.' }
  }
}

/**
 * Mengambil daftar tahun fee untuk filter.
 */
export async function getFeeYears(subAppKey?: string): Promise<ActionResult<number[]>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  try {
    const rows = await db
      .selectDistinct({ year: fees.year })
      .from(fees)
      .orderBy(fees.year)

    return { success: true, data: rows.map((r) => r.year) }
  } catch {
    return { success: false, error: 'Gagal mengambil data tahun biaya.' }
  }
}
