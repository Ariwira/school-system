'use server'

import { and, count, desc, eq, or } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { institutes, staffs, transfers } from '@/lib/db/schema'
import {
  createTransferSchema,
  approveTransferSchema,
  getTransfersSchema,
  type CreateTransferInput,
  type ApproveTransferInput,
  type GetTransfersInput,
  type TransferRow,
  type ActionResult,
} from '@/lib/validations/transfer'

// ---- Aliases for joins to same tables ----

const fromInst = alias(institutes, 'from_institute')
const toInst = alias(institutes, 'to_institute')
const issuerStaff = alias(staffs, 'issuer_staff')
const senderStaff = alias(staffs, 'sender_staff')
const receiverStaff = alias(staffs, 'receiver_staff')
const approverStaff = alias(staffs, 'approver_staff')

// ---- Helpers ----

function revalidateTransferPaths(subAppKey?: string) {
  revalidatePath('/superadmin/transfers')
  if (subAppKey) {
    revalidatePath(`/foundation/${subAppKey}/transfers`)
    revalidatePath(`/school/${subAppKey}/transfers`)
  }
}

/**
 * Mengambil daftar transfer dengan paginasi dan filter opsional.
 * Superadmin dapat melihat semua data.
 * Foundation/School hanya melihat transfer yang melibatkan institusinya.
 */
export async function getTransfers(
  input: Partial<GetTransfersInput> = {},
  subAppKey?: string,
): Promise<ActionResult<{ data: TransferRow[]; total: number; page: number; perPage: number }>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  const parsed = getTransfersSchema.safeParse({
    page: input.page ?? 1,
    perPage: input.perPage ?? 10,
    status: input.status,
    direction: input.direction,
    transferMethod: input.transferMethod,
    instituteId: scopedInstituteId,
  })

  if (!parsed.success) {
    return { success: false, error: 'Parameter tidak valid.' }
  }

  const { page, perPage, status, direction, transferMethod } = parsed.data
  const offset = (page - 1) * perPage

  try {
    const conditions = []

    // Data isolation: filter berdasarkan institusi
    if (scopedInstituteId) {
      if (direction === 'outgoing') {
        conditions.push(eq(transfers.transferFromId, scopedInstituteId))
      } else if (direction === 'incoming') {
        conditions.push(eq(transfers.transferToId, scopedInstituteId))
      } else {
        conditions.push(
          or(
            eq(transfers.transferFromId, scopedInstituteId),
            eq(transfers.transferToId, scopedInstituteId),
          ),
        )
      }
    }

    if (status) {
      conditions.push(eq(transfers.status, status))
    }

    if (transferMethod) {
      conditions.push(eq(transfers.transferMethod, transferMethod))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: transfers.id,
        transferFromId: transfers.transferFromId,
        transferFromName: fromInst.name,
        transferToId: transfers.transferToId,
        transferToName: toInst.name,
        amount: transfers.amount,
        issuerId: transfers.issuerId,
        issuerName: issuerStaff.name,
        senderId: transfers.senderId,
        senderName: senderStaff.name,
        receiverId: transfers.receiverId,
        receiverName: receiverStaff.name,
        approverId: transfers.approverId,
        approverName: approverStaff.name,
        issuedAt: transfers.issuedAt,
        approvedAt: transfers.approvedAt,
        status: transfers.status,
        transferMethod: transfers.transferMethod,
        receipt: transfers.receipt,
        receiptFile: transfers.receiptFile,
        notes: transfers.notes,
        createdAt: transfers.createdAt,
        updatedAt: transfers.updatedAt,
      })
      .from(transfers)
      .innerJoin(fromInst, eq(transfers.transferFromId, fromInst.id))
      .innerJoin(toInst, eq(transfers.transferToId, toInst.id))
      .innerJoin(issuerStaff, eq(transfers.issuerId, issuerStaff.id))
      .innerJoin(senderStaff, eq(transfers.senderId, senderStaff.id))
      .leftJoin(receiverStaff, eq(transfers.receiverId, receiverStaff.id))
      .leftJoin(approverStaff, eq(transfers.approverId, approverStaff.id))
      .where(whereClause)
      .orderBy(desc(transfers.createdAt))
      .limit(perPage)
      .offset(offset)

    const totalResult = await db
      .select({ count: count() })
      .from(transfers)
      .where(whereClause)

    const total = totalResult[0]?.count ?? 0

    const data: TransferRow[] = rows.map((row) => ({
      ...row,
      receiverId: row.receiverId ?? null,
      receiverName: row.receiverName ?? null,
      approverId: row.approverId ?? null,
      approverName: row.approverName ?? null,
      approvedAt: row.approvedAt ?? null,
      receipt: row.receipt ?? null,
      receiptFile: row.receiptFile ?? null,
      notes: row.notes ?? null,
    }))

    return { success: true, data: { data, total, page, perPage } }
  } catch {
    return { success: false, error: 'Gagal mengambil data transfer. Silakan coba lagi.' }
  }
}

/**
 * Mengambil detail transfer berdasarkan ID.
 */
export async function getTransferById(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<TransferRow>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID transfer tidak valid.' }
  }

  try {
    const rows = await db
      .select({
        id: transfers.id,
        transferFromId: transfers.transferFromId,
        transferFromName: fromInst.name,
        transferToId: transfers.transferToId,
        transferToName: toInst.name,
        amount: transfers.amount,
        issuerId: transfers.issuerId,
        issuerName: issuerStaff.name,
        senderId: transfers.senderId,
        senderName: senderStaff.name,
        receiverId: transfers.receiverId,
        receiverName: receiverStaff.name,
        approverId: transfers.approverId,
        approverName: approverStaff.name,
        issuedAt: transfers.issuedAt,
        approvedAt: transfers.approvedAt,
        status: transfers.status,
        transferMethod: transfers.transferMethod,
        receipt: transfers.receipt,
        receiptFile: transfers.receiptFile,
        notes: transfers.notes,
        createdAt: transfers.createdAt,
        updatedAt: transfers.updatedAt,
      })
      .from(transfers)
      .innerJoin(fromInst, eq(transfers.transferFromId, fromInst.id))
      .innerJoin(toInst, eq(transfers.transferToId, toInst.id))
      .innerJoin(issuerStaff, eq(transfers.issuerId, issuerStaff.id))
      .innerJoin(senderStaff, eq(transfers.senderId, senderStaff.id))
      .leftJoin(receiverStaff, eq(transfers.receiverId, receiverStaff.id))
      .leftJoin(approverStaff, eq(transfers.approverId, approverStaff.id))
      .where(eq(transfers.id, id))
      .limit(1)

    if (!rows[0]) {
      return { success: false, error: 'Data transfer tidak ditemukan.' }
    }

    const row = rows[0]

    // Data isolation: pastikan transfer melibatkan institusi yang benar
    if (scopedInstituteId) {
      if (row.transferFromId !== scopedInstituteId && row.transferToId !== scopedInstituteId) {
        return { success: false, error: 'Akses ditolak. Transfer ini bukan milik institusi Anda.' }
      }
    }

    return {
      success: true,
      data: {
        ...row,
        receiverId: row.receiverId ?? null,
        receiverName: row.receiverName ?? null,
        approverId: row.approverId ?? null,
        approverName: row.approverName ?? null,
        approvedAt: row.approvedAt ?? null,
        receipt: row.receipt ?? null,
        receiptFile: row.receiptFile ?? null,
        notes: row.notes ?? null,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil detail transfer. Silakan coba lagi.' }
  }
}

/**
 * Membuat pengajuan transfer baru.
 * Validasi: from ≠ to.
 */
export async function createTransfer(
  input: CreateTransferInput,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  const parsed = createTransferSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { transferFromId, transferToId, amount, issuerId, senderId, transferMethod, issuedAt, notes } = parsed.data

  // Validasi Decimal.js untuk jumlah transfer
  let decimalAmount: string
  try {
    const d = new Decimal(amount)
    if (d.isNegative() || d.isZero()) {
      return { success: false, error: 'Jumlah transfer harus lebih dari 0.' }
    }
    decimalAmount = d.toFixed(2)
  } catch {
    return { success: false, error: 'Format jumlah transfer tidak valid.' }
  }

  try {
    // Validasi data isolation: jika ada scope, pastikan transferFromId = scopedInstituteId
    if (scopedInstituteId && transferFromId !== scopedInstituteId) {
      return { success: false, error: 'Anda hanya dapat membuat transfer dari institusi Anda sendiri.' }
    }

    // Validasi: institusi dari ada
    const fromInstitute = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.id, transferFromId))
      .limit(1)

    if (!fromInstitute[0]) {
      return { success: false, error: 'Institusi asal tidak ditemukan.' }
    }

    // Validasi: institusi tujuan ada
    const toInstitute = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.id, transferToId))
      .limit(1)

    if (!toInstitute[0]) {
      return { success: false, error: 'Institusi tujuan tidak ditemukan.' }
    }

    // Validasi: issuer ada
    const issuer = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(eq(staffs.id, issuerId))
      .limit(1)

    if (!issuer[0]) {
      return { success: false, error: 'Staf issuer tidak ditemukan.' }
    }

    // Validasi: sender ada
    const sender = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(eq(staffs.id, senderId))
      .limit(1)

    if (!sender[0]) {
      return { success: false, error: 'Staf pengirim tidak ditemukan.' }
    }

    const [newTransfer] = await db
      .insert(transfers)
      .values({
        transferFromId,
        transferToId,
        amount: decimalAmount,
        issuerId,
        senderId,
        transferMethod,
        issuedAt: new Date(issuedAt),
        notes: notes || null,
        status: 'pending',
      })
      .returning({ id: transfers.id })

    if (!newTransfer) {
      return { success: false, error: 'Gagal membuat pengajuan transfer.' }
    }

    revalidateTransferPaths(subAppKey)
    return { success: true, data: { id: newTransfer.id } }
  } catch {
    return { success: false, error: 'Gagal membuat pengajuan transfer. Silakan coba lagi.' }
  }
}

/**
 * Menyetujui transfer: pending → approved.
 * Blokir jika subapp.type = 'school'.
 * Validasi: jika metode bank_transfer, bukti wajib ada.
 */
export async function approveTransfer(
  id: string,
  input: ApproveTransferInput,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type === 'school') {
      return { success: false, error: 'School admin tidak bisa melakukan aksi ini.' }
    }
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID transfer tidak valid.' }
  }

  const parsed = approveTransferSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { approverId, receipt, receiptFile, transferMethod } = parsed.data

  try {
    const existing = await db
      .select({ id: transfers.id, status: transfers.status, transferMethod: transfers.transferMethod })
      .from(transfers)
      .where(eq(transfers.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Data transfer tidak ditemukan.' }
    }

    if (existing[0].status !== 'pending') {
      return {
        success: false,
        error: 'Hanya transfer berstatus pending yang dapat disetujui.',
      }
    }

    // Validasi approver ada
    const approver = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(eq(staffs.id, approverId))
      .limit(1)

    if (!approver[0]) {
      return { success: false, error: 'Staf approver tidak ditemukan.' }
    }

    await db
      .update(transfers)
      .set({
        approverId,
        approvedAt: new Date(),
        status: 'approved',
        transferMethod,
        receipt: receipt || null,
        receiptFile: receiptFile || null,
        updatedAt: new Date(),
      })
      .where(eq(transfers.id, id))

    revalidateTransferPaths(subAppKey)
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal menyetujui transfer. Silakan coba lagi.' }
  }
}

/**
 * Membatalkan transfer: hanya dari pending.
 * Blokir jika subapp.type = 'school'.
 */
export async function cancelTransfer(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type === 'school') {
      return { success: false, error: 'School admin tidak bisa melakukan aksi ini.' }
    }
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID transfer tidak valid.' }
  }

  try {
    const existing = await db
      .select({ id: transfers.id, status: transfers.status })
      .from(transfers)
      .where(eq(transfers.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Data transfer tidak ditemukan.' }
    }

    if (existing[0].status !== 'pending') {
      return {
        success: false,
        error: 'Hanya transfer berstatus pending yang dapat dibatalkan.',
      }
    }

    await db
      .update(transfers)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(transfers.id, id))

    revalidateTransferPaths(subAppKey)
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal membatalkan transfer. Silakan coba lagi.' }
  }
}

/**
 * Konfirmasi penerimaan transfer: set receiverId setelah approved.
 */
export async function confirmReceived(
  id: string,
  receiverId: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID transfer tidak valid.' }
  }

  if (!receiverId) {
    return { success: false, error: 'ID penerima tidak valid.' }
  }

  try {
    const existing = await db
      .select({ id: transfers.id, status: transfers.status, transferToId: transfers.transferToId })
      .from(transfers)
      .where(eq(transfers.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Data transfer tidak ditemukan.' }
    }

    if (existing[0].status !== 'approved') {
      return {
        success: false,
        error: 'Hanya transfer berstatus disetujui yang dapat dikonfirmasi penerimaannya.',
      }
    }

    // Validasi receiver ada
    const receiver = await db
      .select({ id: staffs.id, instituteId: staffs.instituteId })
      .from(staffs)
      .where(eq(staffs.id, receiverId))
      .limit(1)

    if (!receiver[0]) {
      return { success: false, error: 'Staf penerima tidak ditemukan.' }
    }

    // Validasi data isolation: penerima harus dari institusi tujuan
    if (receiver[0].instituteId !== existing[0].transferToId) {
      return {
        success: false,
        error: 'Staf penerima harus berasal dari institusi tujuan transfer.',
      }
    }

    await db
      .update(transfers)
      .set({ receiverId, updatedAt: new Date() })
      .where(eq(transfers.id, id))

    revalidateTransferPaths(subAppKey)
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal mengonfirmasi penerimaan transfer. Silakan coba lagi.' }
  }
}

/**
 * Mengambil daftar institusi untuk dropdown form transfer.
 */
export async function getInstitutesForTransfer(
  subAppKey?: string,
): Promise<ActionResult<{ id: string; name: string; type: string }[]>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  try {
    const rows = await db
      .select({ id: institutes.id, name: institutes.name, type: institutes.type })
      .from(institutes)
      .where(eq(institutes.isActive, true))
      .orderBy(institutes.name)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Gagal mengambil data institusi.' }
  }
}

/**
 * Mengambil daftar staf aktif dari suatu institusi untuk dropdown.
 */
export async function getStaffsForTransfer(
  instituteId: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string; name: string; staffNumber: string }[]>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!instituteId) {
    return { success: false, error: 'ID institusi tidak valid.' }
  }

  try {
    const rows = await db
      .select({ id: staffs.id, name: staffs.name, staffNumber: staffs.staffNumber })
      .from(staffs)
      .where(and(eq(staffs.instituteId, instituteId), eq(staffs.status, 'active')))
      .orderBy(staffs.name)
      .limit(100)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Gagal mengambil data staf.' }
  }
}
