/**
 * Tests untuk transfer.actions.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSelectChain, mockInsertChain, mockUpdateChain, setupSelectSequence } from '../helpers/db-mock'
import {
  SUPERADMIN_SESSION, USER_SESSION, SCHOOL_SUBAPP, FOUNDATION_SUBAPP,
  INSTITUTE_SCHOOL_ID, INSTITUTE_FOUNDATION_ID, INSTITUTE_OTHER_ID,
  TRANSFER_ID, ISSUER_STAFF_ID, SENDER_STAFF_ID, APPROVER_STAFF_ID, RECEIVER_STAFF_ID,
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
  createTransfer, getTransfers, getTransferById,
  approveTransfer, cancelTransfer, confirmReceived,
} from '@/actions/transfer.actions'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

// FROM = foundation, TO = school
const FROM_INSTITUTE_ID = INSTITUTE_FOUNDATION_ID
const TO_INSTITUTE_ID = INSTITUTE_SCHOOL_ID

const baseTransferInput = {
  transferFromId: FROM_INSTITUTE_ID,
  transferToId: TO_INSTITUTE_ID,
  amount: '1000000',
  issuerId: ISSUER_STAFF_ID,
  senderId: SENDER_STAFF_ID,
  transferMethod: 'cash' as const,
  issuedAt: new Date().toISOString(),
}

const transferRow = {
  id: TRANSFER_ID,
  transferFromId: FROM_INSTITUTE_ID, transferFromName: 'Yayasan Al-Ikhlas',
  transferToId: TO_INSTITUTE_ID, transferToName: 'SMA Negeri 1',
  amount: '1000000.00',
  issuerId: ISSUER_STAFF_ID, issuerName: 'Staf Issuer',
  senderId: SENDER_STAFF_ID, senderName: 'Staf Pengirim',
  receiverId: null, receiverName: null,
  approverId: null, approverName: null,
  issuedAt: new Date(), approvedAt: null,
  status: 'pending', transferMethod: 'cash',
  receipt: null, receiptFile: null, notes: null,
  createdAt: new Date(), updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requireRole).mockResolvedValue(SUPERADMIN_SESSION)
  vi.mocked(requireSubappAccess).mockResolvedValue({ session: SUPERADMIN_SESSION, subapp: FOUNDATION_SUBAPP })
})

// ============================================================
// CREATE TRANSFER
// ============================================================

describe('createTransfer', () => {
  it('berhasil membuat transfer baru sebagai superadmin', async () => {
    setupSelectSequence(mockDb, [
      [{ id: FROM_INSTITUTE_ID }],
      [{ id: TO_INSTITUTE_ID }],
      [{ id: ISSUER_STAFF_ID }],
      [{ id: SENDER_STAFF_ID }],
    ])
    mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: TRANSFER_ID }]))

    const result = await createTransfer(baseTransferInput)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(TRANSFER_ID)
  })

  it('[BUSINESS RULE] transfer ke institusi yang sama harus error', async () => {
    // Zod superRefine akan menolak transferFromId === transferToId
    const result = await createTransfer({ ...baseTransferInput, transferToId: FROM_INSTITUTE_ID })

    expect(result.success).toBe(false)
  })

  it('gagal jika jumlah transfer 0', async () => {
    const result = await createTransfer({ ...baseTransferInput, amount: '0' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('0')
  })

  it('gagal jika jumlah transfer negatif', async () => {
    const result = await createTransfer({ ...baseTransferInput, amount: '-500000' })
    expect(result.success).toBe(false)
  })

  it('gagal jika institusi asal tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await createTransfer(baseTransferInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('asal')
  })

  it('[SECURITY] foundation subapp: transferFromId harus = subapp.instituteId', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: FOUNDATION_SUBAPP })

    const result = await createTransfer({ ...baseTransferInput, transferFromId: INSTITUTE_OTHER_ID }, 'yayasan-al-ikhlas')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('institusi Anda sendiri')
  })
})

// ============================================================
// GET TRANSFERS
// ============================================================

describe('getTransfers', () => {
  it('superadmin dapat melihat semua transfer', async () => {
    setupSelectSequence(mockDb, [[transferRow], [{ count: 1 }]])

    const result = await getTransfers({})

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.total).toBe(1)
  })

  it('foundation subapp hanya melihat transfer yang melibatkan institusinya', async () => {
    setupSelectSequence(mockDb, [[transferRow], [{ count: 1 }]])

    const result = await getTransfers({}, 'yayasan-al-ikhlas')

    expect(result.success).toBe(true)
    expect(mockDb.select).toHaveBeenCalled()
  })

  it('paginasi bawaan 10 item per halaman', async () => {
    setupSelectSequence(mockDb, [[], [{ count: 0 }]])

    const result = await getTransfers({})

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.perPage).toBe(10)
  })
})

// ============================================================
// GET TRANSFER BY ID
// ============================================================

describe('getTransferById', () => {
  it('superadmin dapat mengambil transfer berdasarkan ID', async () => {
    setupSelectSequence(mockDb, [[transferRow]])

    const result = await getTransferById(TRANSFER_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(TRANSFER_ID)
  })

  it('[SECURITY] subapp: transfer yang tidak melibatkan institusi ditolak', async () => {
    const transferFromOther = { ...transferRow, transferFromId: INSTITUTE_OTHER_ID, transferToId: INSTITUTE_OTHER_ID }
    setupSelectSequence(mockDb, [[transferFromOther]])

    const result = await getTransferById(TRANSFER_ID, 'yayasan-al-ikhlas')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('ditolak')
  })

  it('gagal jika ID tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await getTransferById(TRANSFER_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('gagal jika ID kosong', async () => {
    const result = await getTransferById('')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })
})

// ============================================================
// APPROVE TRANSFER
// ============================================================

describe('approveTransfer', () => {
  const approveInput = { approverId: APPROVER_STAFF_ID, transferMethod: 'cash' as const }

  it('berhasil menyetujui transfer pending sebagai superadmin', async () => {
    setupSelectSequence(mockDb, [
      [{ id: TRANSFER_ID, status: 'pending', transferMethod: 'cash' }],
      [{ id: APPROVER_STAFF_ID }],
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await approveTransfer(TRANSFER_ID, approveInput)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(TRANSFER_ID)
  })

  it('[BUSINESS RULE] school admin tidak bisa menyetujui transfer', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: SCHOOL_SUBAPP })

    const result = await approveTransfer(TRANSFER_ID, approveInput, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('School admin')
  })

  it('[BUSINESS RULE] transfer yang sudah approved tidak bisa di-approve lagi', async () => {
    setupSelectSequence(mockDb, [[{ id: TRANSFER_ID, status: 'approved', transferMethod: 'cash' }]])

    const result = await approveTransfer(TRANSFER_ID, approveInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('pending')
  })

  it('[BUSINESS RULE] transfer cancelled tidak bisa di-approve', async () => {
    setupSelectSequence(mockDb, [[{ id: TRANSFER_ID, status: 'cancelled', transferMethod: 'cash' }]])

    const result = await approveTransfer(TRANSFER_ID, approveInput)

    expect(result.success).toBe(false)
  })

  it('gagal jika ID transfer kosong', async () => {
    const result = await approveTransfer('', approveInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })

  it('gagal jika approver tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [
      [{ id: TRANSFER_ID, status: 'pending', transferMethod: 'cash' }],
      [],
    ])

    const result = await approveTransfer(TRANSFER_ID, approveInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('approver')
  })
})

// ============================================================
// CANCEL TRANSFER
// ============================================================

describe('cancelTransfer', () => {
  it('berhasil membatalkan transfer pending sebagai superadmin', async () => {
    setupSelectSequence(mockDb, [[{ id: TRANSFER_ID, status: 'pending' }]])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await cancelTransfer(TRANSFER_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(TRANSFER_ID)
  })

  it('[BUSINESS RULE] school admin tidak bisa membatalkan transfer', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: SCHOOL_SUBAPP })

    const result = await cancelTransfer(TRANSFER_ID, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('School admin')
  })

  it('[BUSINESS RULE] transfer approved tidak bisa dibatalkan', async () => {
    setupSelectSequence(mockDb, [[{ id: TRANSFER_ID, status: 'approved' }]])

    const result = await cancelTransfer(TRANSFER_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('pending')
  })

  it('gagal jika ID tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await cancelTransfer(TRANSFER_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('gagal jika ID kosong', async () => {
    const result = await cancelTransfer('')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })
})

// ============================================================
// CONFIRM RECEIVED
// ============================================================

describe('confirmReceived', () => {
  it('berhasil mengkonfirmasi penerimaan transfer approved', async () => {
    setupSelectSequence(mockDb, [
      [{ id: TRANSFER_ID, status: 'approved', transferToId: TO_INSTITUTE_ID }],
      [{ id: RECEIVER_STAFF_ID, instituteId: TO_INSTITUTE_ID }],
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await confirmReceived(TRANSFER_ID, RECEIVER_STAFF_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(TRANSFER_ID)
  })

  it('[BUSINESS RULE] hanya transfer approved yang bisa dikonfirmasi', async () => {
    setupSelectSequence(mockDb, [
      [{ id: TRANSFER_ID, status: 'pending', transferToId: TO_INSTITUTE_ID }],
    ])

    const result = await confirmReceived(TRANSFER_ID, RECEIVER_STAFF_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('disetujui')
  })

  it('[SECURITY] receiver harus dari institusi tujuan transfer', async () => {
    setupSelectSequence(mockDb, [
      [{ id: TRANSFER_ID, status: 'approved', transferToId: TO_INSTITUTE_ID }],
      [{ id: RECEIVER_STAFF_ID, instituteId: FROM_INSTITUTE_ID }],
    ])

    const result = await confirmReceived(TRANSFER_ID, RECEIVER_STAFF_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('institusi tujuan')
  })

  it('gagal jika receiverId kosong', async () => {
    const result = await confirmReceived(TRANSFER_ID, '')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })

  it('gagal jika receiver tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [
      [{ id: TRANSFER_ID, status: 'approved', transferToId: TO_INSTITUTE_ID }],
      [],
    ])

    const result = await confirmReceived(TRANSFER_ID, RECEIVER_STAFF_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })
})
