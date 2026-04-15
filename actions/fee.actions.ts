'use server'

import { and, count, eq, sql, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { fees, feePayments } from '@/lib/db/schema'
import {
  createFeeSchema,
  updateFeeSchema,
  getFeesSchema,
  type CreateFeeInput,
  type UpdateFeeInput,
  type GetFeesInput,
  type FeeRow,
  type ActionResult,
} from '@/lib/validations/fee'

function revalidateFeePaths() {
  revalidatePath('/superadmin/fees')
}

/**
 * Mengambil daftar tarif biaya dengan paginasi.
 * Hanya superadmin yang dapat mengakses.
 */
export async function getFees(
  input: Partial<GetFeesInput> = {},
): Promise<ActionResult<{ data: FeeRow[]; total: number; page: number; perPage: number }>> {
  await requireRole(['superadmin'])

  const parsed = getFeesSchema.safeParse({
    page: input.page ?? 1,
    perPage: input.perPage ?? 10,
    feeType: input.feeType,
    year: input.year,
    semester: input.semester,
  })

  if (!parsed.success) {
    return { success: false, error: 'Parameter tidak valid.' }
  }

  const { page, perPage, feeType, year, semester } = parsed.data
  const offset = (page - 1) * perPage

  try {
    const conditions = []

    if (feeType) {
      conditions.push(eq(fees.feeType, feeType))
    }

    if (year) {
      conditions.push(eq(fees.year, year))
    }

    if (semester) {
      conditions.push(eq(fees.semester, semester))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: fees.id,
        feeType: fees.feeType,
        year: fees.year,
        semester: fees.semester,
        amount: fees.amount,
        paymentCount: sql<number>`cast(count(${feePayments.id}) as int)`,
        createdAt: fees.createdAt,
        updatedAt: fees.updatedAt,
      })
      .from(fees)
      .leftJoin(feePayments, eq(feePayments.feeId, fees.id))
      .where(whereClause)
      .groupBy(fees.id)
      .orderBy(desc(fees.year), fees.semester, fees.feeType)
      .limit(perPage)
      .offset(offset)

    const totalResult = await db.select({ count: count() }).from(fees).where(whereClause)
    const total = totalResult[0]?.count ?? 0

    const data: FeeRow[] = rows.map((row) => ({
      id: row.id,
      feeType: row.feeType as FeeRow['feeType'],
      year: row.year,
      semester: row.semester,
      amount: row.amount,
      paymentCount: row.paymentCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))

    return { success: true, data: { data, total, page, perPage } }
  } catch {
    return { success: false, error: 'Gagal mengambil data tarif biaya. Silakan coba lagi.' }
  }
}

/**
 * Mengambil daftar tahun yang tersedia dari tarif biaya (untuk filter).
 */
export async function getFeeYears(): Promise<ActionResult<number[]>> {
  await requireRole(['superadmin'])

  try {
    const rows = await db
      .selectDistinct({ year: fees.year })
      .from(fees)
      .orderBy(desc(fees.year))

    return { success: true, data: rows.map((r) => r.year) }
  } catch {
    return { success: false, error: 'Gagal mengambil data tahun biaya.' }
  }
}

/**
 * Membuat tarif biaya baru.
 * Validasi: tidak ada duplikat kombinasi feeType + year + semester.
 * Hanya superadmin yang dapat mengakses.
 */
export async function createFee(input: CreateFeeInput): Promise<ActionResult<{ id: string }>> {
  await requireRole(['superadmin'])

  const parsed = createFeeSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { feeType, year, semester, amount } = parsed.data

  // Validasi Decimal.js
  let decimalAmount: string
  try {
    const d = new Decimal(amount)
    if (d.isNegative()) {
      return { success: false, error: 'Besaran biaya tidak boleh negatif.' }
    }
    decimalAmount = d.toFixed(2)
  } catch {
    return { success: false, error: 'Format besaran biaya tidak valid.' }
  }

  try {
    // Validasi: tidak ada duplikat tipe + tahun + semester
    const existing = await db
      .select({ id: fees.id })
      .from(fees)
      .where(and(eq(fees.feeType, feeType), eq(fees.year, year), eq(fees.semester, semester)))
      .limit(1)

    if (existing.length > 0) {
      const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap'
      return {
        success: false,
        error: `Tarif ${feeType.toUpperCase()} Semester ${semesterLabel} tahun ${year} sudah ada.`,
      }
    }

    const [newFee] = await db
      .insert(fees)
      .values({ feeType, year, semester, amount: decimalAmount })
      .returning({ id: fees.id })

    if (!newFee) {
      return { success: false, error: 'Gagal membuat tarif biaya.' }
    }

    revalidateFeePaths()
    return { success: true, data: { id: newFee.id } }
  } catch {
    return { success: false, error: 'Gagal membuat tarif biaya. Silakan coba lagi.' }
  }
}

/**
 * Memperbarui tarif biaya.
 * Validasi: tidak ada pembayaran yang mengacu ke fee ini jika jumlah diubah.
 * Validasi: tidak ada duplikat tipe + tahun + semester (kecuali record ini sendiri).
 * Hanya superadmin yang dapat mengakses.
 */
export async function updateFee(
  id: string,
  input: UpdateFeeInput,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(['superadmin'])

  if (!id) {
    return { success: false, error: 'ID tarif tidak valid.' }
  }

  const parsed = updateFeeSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { feeType, year, semester, amount } = parsed.data

  // Validasi Decimal.js
  let decimalAmount: string
  try {
    const d = new Decimal(amount)
    if (d.isNegative()) {
      return { success: false, error: 'Besaran biaya tidak boleh negatif.' }
    }
    decimalAmount = d.toFixed(2)
  } catch {
    return { success: false, error: 'Format besaran biaya tidak valid.' }
  }

  try {
    // Pastikan fee ada
    const existing = await db
      .select({ id: fees.id, amount: fees.amount, feeType: fees.feeType, year: fees.year, semester: fees.semester })
      .from(fees)
      .where(eq(fees.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Tarif biaya tidak ditemukan.' }
    }

    const currentFee = existing[0]

    // Cek apakah ada pembayaran yang mengacu ke fee ini
    const paymentCount = await db
      .select({ count: count() })
      .from(feePayments)
      .where(eq(feePayments.feeId, id))

    const hasPayments = (paymentCount[0]?.count ?? 0) > 0

    if (hasPayments) {
      return {
        success: false,
        error:
          'Tarif biaya tidak dapat diubah karena sudah ada pembayaran yang mengacu ke tarif ini.',
      }
    }

    // Validasi: tidak ada duplikat tipe + tahun + semester kecuali record sendiri
    if (feeType !== currentFee.feeType || year !== currentFee.year || semester !== currentFee.semester) {
      const duplicate = await db
        .select({ id: fees.id })
        .from(fees)
        .where(and(eq(fees.feeType, feeType), eq(fees.year, year), eq(fees.semester, semester)))
        .limit(1)

      if (duplicate.length > 0) {
        const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap'
        return {
          success: false,
          error: `Tarif ${feeType.toUpperCase()} Semester ${semesterLabel} tahun ${year} sudah ada.`,
        }
      }
    }

    await db
      .update(fees)
      .set({ feeType, year, semester, amount: decimalAmount, updatedAt: new Date() })
      .where(eq(fees.id, id))

    revalidateFeePaths()
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal memperbarui tarif biaya. Silakan coba lagi.' }
  }
}

/**
 * Mengambil detail tarif biaya berdasarkan ID.
 * Hanya superadmin yang dapat mengakses.
 */
export async function getFeeById(id: string): Promise<ActionResult<FeeRow>> {
  await requireRole(['superadmin'])

  if (!id) {
    return { success: false, error: 'ID tarif tidak valid.' }
  }

  try {
    const rows = await db
      .select({
        id: fees.id,
        feeType: fees.feeType,
        year: fees.year,
        semester: fees.semester,
        amount: fees.amount,
        paymentCount: sql<number>`cast(count(${feePayments.id}) as int)`,
        createdAt: fees.createdAt,
        updatedAt: fees.updatedAt,
      })
      .from(fees)
      .leftJoin(feePayments, eq(feePayments.feeId, fees.id))
      .where(eq(fees.id, id))
      .groupBy(fees.id)
      .limit(1)

    if (!rows[0]) {
      return { success: false, error: 'Tarif biaya tidak ditemukan.' }
    }

    const row = rows[0]
    return {
      success: true,
      data: {
        id: row.id,
        feeType: row.feeType as FeeRow['feeType'],
        year: row.year,
        semester: row.semester,
        amount: row.amount,
        paymentCount: row.paymentCount ?? 0,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil data tarif biaya.' }
  }
}

/**
 * Mengambil daftar tarif biaya untuk dropdown form pembayaran.
 * Dapat diakses oleh superadmin dan school user (via subAppKey).
 */
export async function getFeesForPayment(
  subAppKey?: string,
): Promise<ActionResult<{ id: string; feeType: string; year: number; semester: number; amount: string }[]>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  try {
    const rows = await db
      .select({
        id: fees.id,
        feeType: fees.feeType,
        year: fees.year,
        semester: fees.semester,
        amount: fees.amount,
      })
      .from(fees)
      .orderBy(fees.year, fees.semester, fees.feeType)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Gagal mengambil data tarif biaya.' }
  }
}
