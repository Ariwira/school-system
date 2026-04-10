/**
 * Tests untuk fee.actions.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSelectChain, mockInsertChain, mockUpdateChain, setupSelectSequence } from '../helpers/db-mock'
import {
  SUPERADMIN_SESSION, SCHOOL_SUBAPP, FEE_ID,
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

import { db } from '@/lib/db'
import {
  createFee, updateFee, getFees, getFeeYears, getFeesForPayment,
} from '@/actions/fee.actions'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
  selectDistinct: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

const feeRow = {
  id: FEE_ID, feeType: 'spp', year: 2024, semester: 1,
  amount: '500000.00', paymentCount: 0, createdAt: new Date(), updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset db.select queue agar mock dari test sebelumnya tidak bocor
  mockDb.select.mockReset()
  vi.mocked(requireRole).mockResolvedValue(SUPERADMIN_SESSION)
  vi.mocked(requireSubappAccess).mockResolvedValue({ session: SUPERADMIN_SESSION, subapp: SCHOOL_SUBAPP })
})

// ============================================================
// CREATE FEE
// ============================================================

describe('createFee', () => {
  const baseFeeInput = { feeType: 'spp' as const, year: 2024, semester: 1 as const, amount: '500000' }

  it('berhasil membuat tarif biaya baru', async () => {
    setupSelectSequence(mockDb, [[]])
    mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: FEE_ID }]))

    const result = await createFee(baseFeeInput)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(FEE_ID)
  })

  it('[BUSINESS RULE] duplikat feeType + year + semester diblokir', async () => {
    setupSelectSequence(mockDb, [[{ id: FEE_ID }]])

    const result = await createFee(baseFeeInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('sudah ada')
  })

  it('gagal jika besaran biaya negatif', async () => {
    // Zod regex ^\d+(\.?\d{1,2})?$ menolak angka negatif sebelum Decimal.js
    // sehingga error yang dikembalikan adalah pesan validasi format, bukan "negatif"
    const result = await createFee({ ...baseFeeInput, amount: '-100000' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('valid')
  })

  it('gagal dengan format besaran tidak valid', async () => {
    const result = await createFee({ ...baseFeeInput, amount: 'tidak-valid' })
    expect(result.success).toBe(false)
  })

  it('[SECURITY] bukan superadmin tidak bisa membuat fee', async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error('Anda tidak memiliki izin.'))

    await expect(createFee(baseFeeInput)).rejects.toThrow()
  })
})

// ============================================================
// UPDATE FEE
// ============================================================

describe('updateFee', () => {
  const updateFeeInput = { feeType: 'spp' as const, year: 2024, semester: 1 as const, amount: '600000' }

  it('berhasil mengupdate fee yang belum ada pembayaran', async () => {
    setupSelectSequence(mockDb, [
      [{ id: FEE_ID, amount: '500000.00', feeType: 'spp', year: 2024, semester: 1 }],
      [{ count: 0 }],
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await updateFee(FEE_ID, updateFeeInput)

    expect(result.success).toBe(true)
  })

  it('[BUSINESS RULE] fee tidak bisa diubah jika sudah ada pembayaran', async () => {
    setupSelectSequence(mockDb, [
      [{ id: FEE_ID, amount: '500000.00', feeType: 'spp', year: 2024, semester: 1 }],
      [{ count: 3 }],
    ])

    const result = await updateFee(FEE_ID, updateFeeInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('pembayaran')
  })

  it('[BUSINESS RULE] duplikat kombinasi baru diblokir', async () => {
    setupSelectSequence(mockDb, [
      [{ id: FEE_ID, amount: '500000.00', feeType: 'spp', year: 2024, semester: 1 }],
      [{ count: 0 }],
      [{ id: '00000000-0000-4000-d000-000000000099' }],
    ])

    const result = await updateFee(FEE_ID, { ...updateFeeInput, feeType: 'registration' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('sudah ada')
  })

  it('gagal jika fee tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await updateFee(FEE_ID, updateFeeInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('gagal jika ID kosong', async () => {
    const result = await updateFee('', updateFeeInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })

  it('[SECURITY] bukan superadmin tidak bisa update fee', async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error('Anda tidak memiliki izin.'))

    await expect(updateFee(FEE_ID, updateFeeInput)).rejects.toThrow()
  })
})

// ============================================================
// GET FEES
// ============================================================

describe('getFees', () => {
  it('mengambil daftar fee dengan paginasi', async () => {
    setupSelectSequence(mockDb, [[feeRow], [{ count: 1 }]])

    const result = await getFees({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.total).toBe(1)
      expect(result.data.perPage).toBe(10)
    }
  })

  it('[SECURITY] bukan superadmin tidak bisa akses getFees', async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error('Anda tidak memiliki izin.'))

    await expect(getFees({})).rejects.toThrow()
  })
})

// ============================================================
// GET FEE YEARS
// ============================================================

describe('getFeeYears', () => {
  it('mengembalikan daftar tahun yang tersedia', async () => {
    // getFeeYears menggunakan selectDistinct
    mockDb.selectDistinct.mockReturnValueOnce(mockSelectChain([{ year: 2024 }, { year: 2023 }]))

    const result = await getFeeYears()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toContain(2024)
      expect(result.data).toContain(2023)
    }
  })
})

// ============================================================
// GET FEES FOR PAYMENT
// ============================================================

describe('getFeesForPayment', () => {
  it('superadmin dapat mengambil daftar fee untuk dropdown', async () => {
    setupSelectSequence(mockDb, [
      [{ id: FEE_ID, feeType: 'spp', year: 2024, semester: 1, amount: '500000.00' }],
    ])

    const result = await getFeesForPayment()

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(1)
  })

  it('school user dengan subAppKey dapat mengambil daftar fee', async () => {
    setupSelectSequence(mockDb, [
      [{ id: FEE_ID, feeType: 'spp', year: 2024, semester: 1, amount: '500000.00' }],
    ])

    const result = await getFeesForPayment('sma-negeri-1')

    expect(result.success).toBe(true)
  })
})
