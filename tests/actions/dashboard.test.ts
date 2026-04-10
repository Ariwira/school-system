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
import {
  getSuperadminStats,
  getFoundationStats,
  getSchoolStats,
} from '@/actions/dashboard.actions'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
}

describe('dashboard.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.select.mockReset()
  })

  // ============================================================
  // getSuperadminStats
  // ============================================================
  describe('getSuperadminStats', () => {
    it('berhasil mengambil statistik superadmin', async () => {
      vi.mocked(requireRole).mockResolvedValue({ user: { role: 'superadmin' } } as any)

      setupSelectSequence(mockDb, [
        [{ count: 5 }],      // totalInstitutes
        [{ count: 10 }],     // totalStaffs
        [{ count: 100 }],    // totalActiveStudents
        [{ count: 2 }],      // totalPendingTransfers
        [{ total: '1500000.50' }], // totalSppThisMonth
      ])

      const result = await getSuperadminStats()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalInstitutes).toBe(5)
        expect(result.data.totalStaffs).toBe(10)
        expect(result.data.totalActiveStudents).toBe(100)
        expect(result.data.totalPendingTransfers).toBe(2)
        expect(result.data.totalSppThisMonth).toBe('1500000.50')
      }
    })

    it('menangani sum NULL sebagai 0', async () => {
      vi.mocked(requireRole).mockResolvedValue({ user: { role: 'superadmin' } } as any)

      setupSelectSequence(mockDb, [
        [{ count: 1 }],
        [{ count: 1 }],
        [{ count: 1 }],
        [{ count: 1 }],
        [{ total: null }], // sum NULL
      ])

      const result = await getSuperadminStats()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalSppThisMonth).toBe('0.00')
      }
    })

    it('[SECURITY] ditolak jika bukan superadmin', async () => {
      vi.mocked(requireRole).mockRejectedValue(new Error('Unauthorized'))

      await expect(getSuperadminStats()).rejects.toThrow('Unauthorized')
    })

    it('mengembalikan success: false jika terjadi error database', async () => {
      vi.mocked(requireRole).mockResolvedValue({ user: { role: 'superadmin' } } as any)
      mockDb.select.mockImplementation(() => { throw new Error('DB Error') })

      const result = await getSuperadminStats()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Gagal')
      }
    })
  })

  // ============================================================
  // getFoundationStats
  // ============================================================
  describe('getFoundationStats', () => {
    const SUBAPP_KEY = 'foundation-1'
    const INSTITUTE_ID = 'inst-1'

    it('berhasil mengambil statistik yayasan', async () => {
      vi.mocked(requireSubappAccess).mockResolvedValue({
        subapp: { instituteId: INSTITUTE_ID },
      } as any)

      setupSelectSequence(mockDb, [
        [{ count: 5 }],      // totalFoundationStaffs
        [{ count: 1 }],      // totalOutgoingPendingTransfers
        [{ count: 2 }],      // totalIncomingPendingTransfers
        [{ total: '5000000' }], // totalTransferredThisMonth
      ])

      const result = await getFoundationStats(SUBAPP_KEY)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalFoundationStaffs).toBe(5)
        expect(result.data.totalOutgoingPendingTransfers).toBe(1)
        expect(result.data.totalIncomingPendingTransfers).toBe(2)
        expect(result.data.totalTransferredThisMonth).toBe('5000000.00')
      }
    })

    it('gagal jika yayasan tidak punya instituteId', async () => {
      vi.mocked(requireSubappAccess).mockResolvedValue({
        subapp: { instituteId: null },
      } as any)

      const result = await getFoundationStats(SUBAPP_KEY)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('belum memiliki institusi')
      }
    })

    it('[SECURITY] ditolak jika tidak punya akses subapp', async () => {
      vi.mocked(requireSubappAccess).mockRejectedValue(new Error('Forbidden'))

      await expect(getFoundationStats(SUBAPP_KEY)).rejects.toThrow('Forbidden')
    })

    it('mengembalikan success: false jika terjadi error database', async () => {
      vi.mocked(requireSubappAccess).mockResolvedValue({
        subapp: { instituteId: INSTITUTE_ID },
      } as any)
      mockDb.select.mockImplementation(() => { throw new Error('DB Error') })

      const result = await getFoundationStats(SUBAPP_KEY)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Gagal')
      }
    })
  })

  // ============================================================
  // getSchoolStats
  // ============================================================
  describe('getSchoolStats', () => {
    const SUBAPP_KEY = 'school-1'
    const INSTITUTE_ID = 'inst-school-1'

    it('berhasil mengambil statistik sekolah', async () => {
      vi.mocked(requireSubappAccess).mockResolvedValue({
        subapp: { instituteId: INSTITUTE_ID },
      } as any)

      setupSelectSequence(mockDb, [
        [{ count: 50 }],     // totalActiveStudents
        [{ count: 5 }],      // totalPendingStudents
        [{ count: 10 }],     // totalUnpaidSppThisMonth
        [{ count: 3 }],      // totalIncomingPendingTransfers
      ])

      const result = await getSchoolStats(SUBAPP_KEY)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalActiveStudents).toBe(50)
        expect(result.data.totalPendingStudents).toBe(5)
        expect(result.data.totalUnpaidSppThisMonth).toBe(10)
        expect(result.data.totalIncomingPendingTransfers).toBe(3)
      }
    })

    it('gagal jika sekolah tidak punya instituteId', async () => {
      vi.mocked(requireSubappAccess).mockResolvedValue({
        subapp: { instituteId: null },
      } as any)

      const result = await getSchoolStats(SUBAPP_KEY)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('belum memiliki institusi')
      }
    })

    it('[SECURITY] ditolak jika tidak punya akses subapp', async () => {
      vi.mocked(requireSubappAccess).mockRejectedValue(new Error('Forbidden'))

      await expect(getSchoolStats(SUBAPP_KEY)).rejects.toThrow('Forbidden')
    })

    it('mengembalikan success: false jika terjadi error database', async () => {
      vi.mocked(requireSubappAccess).mockResolvedValue({
        subapp: { instituteId: INSTITUTE_ID },
      } as any)
      mockDb.select.mockImplementation(() => { throw new Error('DB Error') })

      const result = await getSchoolStats(SUBAPP_KEY)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Gagal')
      }
    })
  })
})
