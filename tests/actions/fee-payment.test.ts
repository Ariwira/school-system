/**
 * Tests untuk fee-payment.actions.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSelectChain, mockInsertChain, mockUpdateChain, setupSelectSequence } from '../helpers/db-mock'
import {
  SUPERADMIN_SESSION, USER_SESSION, SCHOOL_SUBAPP, FOUNDATION_SUBAPP,
  INSTITUTE_SCHOOL_ID, INSTITUTE_OTHER_ID, STUDENT_ID, FEE_ID, PAYMENT_ID,
} from '../helpers/fixtures'

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
  requireSubappAccess: vi.fn(),
  getUserInstituteId: vi.fn().mockResolvedValue(null),
  getUserSubapps: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    query: { subapps: { findFirst: vi.fn(), findMany: vi.fn() } },
  },
}))

vi.mock('@/lib/email', () => ({
  sendPaymentConfirmedEmail: vi.fn().mockResolvedValue(undefined),
  sendTransferPendingEmail: vi.fn().mockResolvedValue(undefined),
}))

import { db } from '@/lib/db'
import {
  createFeePayment, getFeePayments, confirmPayment, getFeePaymentsByStudent,
} from '@/actions/fee-payment.actions'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

const activeStudent = { id: STUDENT_ID, status: 'active', instituteId: INSTITUTE_SCHOOL_ID }
const inactiveStudent = { id: STUDENT_ID, status: 'inactive', instituteId: INSTITUTE_SCHOOL_ID }
const canceledStudent = { id: STUDENT_ID, status: 'canceled', instituteId: INSTITUTE_SCHOOL_ID }
const feeRecord = { id: FEE_ID, amount: '500000.00' }

const paymentRow = {
  id: PAYMENT_ID, studentId: STUDENT_ID, studentName: 'Ahmad Fauzi', studentNumber: 'STD-001',
  feeId: FEE_ID, feeType: 'spp', feeYear: 2024, feeSemester: 1, feeAmount: '500000.00',
  amountPaid: '500000.00', paymentMethod: 'cash', receipt: null, receiptFile: null,
  status: 'pending', paidDatetime: new Date(), createdAt: new Date(), updatedAt: new Date(),
}

const basePaymentInput = {
  studentId: STUDENT_ID, feeId: FEE_ID, amountPaid: '500000',
  paymentMethod: 'cash' as const, paidDatetime: new Date().toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireRole).mockResolvedValue(SUPERADMIN_SESSION)
  vi.mocked(requireSubappAccess).mockResolvedValue({ session: SUPERADMIN_SESSION, subapp: SCHOOL_SUBAPP })
})

// ============================================================
// CREATE FEE PAYMENT
// ============================================================

describe('createFeePayment', () => {
  it('berhasil mencatat pembayaran untuk siswa aktif', async () => {
    setupSelectSequence(mockDb, [[activeStudent], [feeRecord]])
    mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: PAYMENT_ID }]))

    const result = await createFeePayment(basePaymentInput)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(PAYMENT_ID)
  })

  it('[BUSINESS RULE] siswa inactive tidak bisa dibayarkan', async () => {
    setupSelectSequence(mockDb, [[inactiveStudent]])

    const result = await createFeePayment(basePaymentInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('aktif')
  })

  it('[BUSINESS RULE] siswa canceled tidak bisa dibayarkan', async () => {
    setupSelectSequence(mockDb, [[canceledStudent]])

    const result = await createFeePayment(basePaymentInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('aktif')
  })

  it('[BUSINESS RULE] jumlah bayar tidak boleh melebihi tarif', async () => {
    setupSelectSequence(mockDb, [[activeStudent], [{ id: FEE_ID, amount: '100000.00' }]])

    const result = await createFeePayment({ ...basePaymentInput, amountPaid: '200000' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tarif')
  })

  it('gagal jika jumlah pembayaran 0', async () => {
    const result = await createFeePayment({ ...basePaymentInput, amountPaid: '0' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('0')
  })

  it('gagal jika siswa tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await createFeePayment(basePaymentInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('[SECURITY] school: siswa dari sekolah lain ditolak', async () => {
    const studentFromOtherSchool = { ...activeStudent, instituteId: INSTITUTE_OTHER_ID }
    setupSelectSequence(mockDb, [[studentFromOtherSchool]])

    const result = await createFeePayment(basePaymentInput, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('institusi')
  })

  it('[SECURITY] foundation subapp ditolak membuat pembayaran', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: FOUNDATION_SUBAPP })

    const result = await createFeePayment(basePaymentInput, 'yayasan-al-ikhlas')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('sekolah')
  })

  it('gagal dengan format jumlah tidak valid', async () => {
    const result = await createFeePayment({ ...basePaymentInput, amountPaid: 'abc' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// GET FEE PAYMENTS
// ============================================================

describe('getFeePayments', () => {
  it('superadmin dapat melihat semua pembayaran', async () => {
    setupSelectSequence(mockDb, [[paymentRow], [{ count: 1 }]])

    const result = await getFeePayments({})

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.total).toBe(1)
  })

  it('school hanya melihat pembayaran di institusinya', async () => {
    setupSelectSequence(mockDb, [[paymentRow], [{ count: 1 }]])

    const result = await getFeePayments({}, 'sma-negeri-1')

    expect(result.success).toBe(true)
    expect(mockDb.select).toHaveBeenCalled()
  })

  it('[SECURITY] foundation subapp ditolak mengakses pembayaran school', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: FOUNDATION_SUBAPP })

    const result = await getFeePayments({}, 'yayasan-al-ikhlas')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('sekolah')
  })

  it('paginasi default 10 item per halaman', async () => {
    setupSelectSequence(mockDb, [[], [{ count: 0 }]])

    const result = await getFeePayments({})

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.perPage).toBe(10)
  })
})

// ============================================================
// CONFIRM PAYMENT
// ============================================================

describe('confirmPayment', () => {
  it('berhasil mengkonfirmasi pembayaran pending', async () => {
    setupSelectSequence(mockDb, [[{ id: PAYMENT_ID, status: 'pending', studentId: STUDENT_ID }]])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await confirmPayment(PAYMENT_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('paid')
  })

  it('[BUSINESS RULE] pembayaran yang sudah paid tidak bisa dikonfirmasi ulang', async () => {
    setupSelectSequence(mockDb, [[{ id: PAYMENT_ID, status: 'paid', studentId: STUDENT_ID }]])

    const result = await confirmPayment(PAYMENT_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('pending')
  })

  it('[BUSINESS RULE] pembayaran cancelled tidak bisa dikonfirmasi', async () => {
    setupSelectSequence(mockDb, [[{ id: PAYMENT_ID, status: 'cancelled', studentId: STUDENT_ID }]])

    const result = await confirmPayment(PAYMENT_ID)

    expect(result.success).toBe(false)
  })

  it('gagal jika ID tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await confirmPayment(PAYMENT_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('gagal jika ID kosong', async () => {
    const result = await confirmPayment('')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })

  it('[SECURITY] school: konfirmasi pembayaran sekolah lain ditolak', async () => {
    setupSelectSequence(mockDb, [
      [{ id: PAYMENT_ID, status: 'pending', studentId: STUDENT_ID }],
      [{ instituteId: INSTITUTE_OTHER_ID }],
    ])

    const result = await confirmPayment(PAYMENT_ID, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('institusi')
  })
})

// ============================================================
// GET FEE PAYMENTS BY STUDENT
// ============================================================

describe('getFeePaymentsByStudent', () => {
  it('superadmin dapat melihat riwayat pembayaran siswa mana pun', async () => {
    setupSelectSequence(mockDb, [[paymentRow]])

    const result = await getFeePaymentsByStudent(STUDENT_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(1)
  })

  it('[SECURITY] school: tidak bisa lihat riwayat siswa sekolah lain', async () => {
    setupSelectSequence(mockDb, [[{ instituteId: INSTITUTE_OTHER_ID }]])

    const result = await getFeePaymentsByStudent(STUDENT_ID, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('institusi')
  })

  it('gagal jika studentId kosong', async () => {
    const result = await getFeePaymentsByStudent('')
    expect(result.success).toBe(false)
  })
})
