import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupSelectSequence } from '../helpers/db-mock'

// --- Mocks ---

vi.mock('@/lib/auth-helpers', () => ({
  requireRole: vi.fn(),
  requireSubappAccess: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

// --- Imports after mock ---

import { db } from '@/lib/db'
import { getFeePaymentsForExport } from '@/actions/fee-payment-export.actions'
import { requireSubappAccess } from '@/lib/auth-helpers'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
}

describe('fee-payment-export.actions', () => {
  const SUBAPP_KEY = 'school-1'
  const INSTITUTE_ID = 'inst-1'
  const SCHOOL_NAME = 'SMA Negeri 1'

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReset()
  })

  it('berhasil mengambil data pembayaran SPP untuk ekspor (tanpa filter)', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({
      subapp: { type: 'school', instituteId: INSTITUTE_ID },
    } as any)

    const mockRow = {
      studentName: 'Budi Utomo',
      studentNumber: '2021001',
      nisn: '1234567890',
      feeType: 'SPP Bulanan',
      feeYear: 2024,
      feeSemester: 1,
      feeAmount: '500000.00',
      amountPaid: '500000.00',
      paymentMethod: 'cash',
      status: 'paid',
      receipt: 'RC-001',
      paidDatetime: new Date(),
    }

    setupSelectSequence(mockDb, [
      [{ name: SCHOOL_NAME }], // Nama sekolah
      [mockRow],              // Data pembayaran
    ])

    const result = await getFeePaymentsForExport({}, SUBAPP_KEY)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0]?.studentName).toBe('Budi Utomo')
      expect(result.schoolName).toBe(SCHOOL_NAME)
      expect(result.period).toBe('Semua Tahun')
    }
  })

  it('berhasil mengambil data dengan filter feeYear', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({
      subapp: { type: 'school', instituteId: INSTITUTE_ID },
    } as any)

    setupSelectSequence(mockDb, [
      [{ name: SCHOOL_NAME }],
      [],
    ])

    const result = await getFeePaymentsForExport({ feeYear: 2024 }, SUBAPP_KEY)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.period).toBe('2024')
    }
  })

  it('gagal jika subapp bukan tipe school', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({
      subapp: { type: 'foundation', instituteId: INSTITUTE_ID },
    } as any)

    const result = await getFeePaymentsForExport({}, SUBAPP_KEY)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('hanya untuk sub-aplikasi sekolah')
    }
  })

  it('gagal jika instituteId tidak ditemukan', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({
      subapp: { type: 'school', instituteId: null },
    } as any)

    const result = await getFeePaymentsForExport({}, SUBAPP_KEY)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Institusi tidak ditemukan')
    }
  })

  it('gagal dengan parameter filter tidak valid', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({
      subapp: { type: 'school', instituteId: INSTITUTE_ID },
    } as any)

    const result = await getFeePaymentsForExport({ status: 'invalid-status' }, SUBAPP_KEY)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Parameter filter tidak valid')
    }
  })

  it('[SECURITY] ditolak jika tidak punya akses subapp', async () => {
    vi.mocked(requireSubappAccess).mockRejectedValue(new Error('Forbidden'))

    await expect(getFeePaymentsForExport({}, SUBAPP_KEY)).rejects.toThrow('Forbidden')
  })

  it('mengembalikan success: false jika terjadi error database', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({
      subapp: { type: 'school', instituteId: INSTITUTE_ID },
    } as any)
    mockDb.select.mockImplementation(() => { throw new Error('DB Error') })

    const result = await getFeePaymentsForExport({}, SUBAPP_KEY)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Gagal mengambil data')
    }
  })
})
