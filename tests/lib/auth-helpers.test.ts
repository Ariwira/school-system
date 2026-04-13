import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      subapps: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    select: vi.fn(),
  },
}))

// --- Imports after mock ---

import {
  requireAuth,
  requireRole,
  requireSubappAccess,
  getUserSubapps,
} from '@/lib/auth-helpers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

const mockAuth = auth as any
const mockDb = db as any

describe('lib/auth-helpers', () => {
  const SUPERADMIN_SESSION = {
    user: { id: 'sa-1', role: 'superadmin', name: 'Super Admin' },
  }
  const USER_SESSION = {
    user: { id: 'u-1', role: 'user', name: 'Regular User' },
  }
  const SUBAPP = { id: 'sub-1', key: 'school-1', name: 'Sekolah 1' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================
  // requireAuth
  // ============================================================
  describe('requireAuth', () => {
    it('berhasil jika user sudah login', async () => {
      mockAuth.api.getSession.mockResolvedValue(SUPERADMIN_SESSION)

      const result = await requireAuth()

      expect(result).toEqual(SUPERADMIN_SESSION)
      expect(mockAuth.api.getSession).toHaveBeenCalled()
    })

    it('melempar error jika user belum login', async () => {
      mockAuth.api.getSession.mockResolvedValue(null)

      await expect(requireAuth()).rejects.toThrow('harus login')
    })
  })

  // ============================================================
  // requireRole
  // ============================================================
  describe('requireRole', () => {
    it('berhasil jika role sesuai', async () => {
      mockAuth.api.getSession.mockResolvedValue(SUPERADMIN_SESSION)

      const result = await requireRole(['superadmin'])

      expect(result).toEqual(SUPERADMIN_SESSION)
    })

    it('melempar error jika role tidak sesuai', async () => {
      mockAuth.api.getSession.mockResolvedValue(USER_SESSION)

      await expect(requireRole(['superadmin'])).rejects.toThrow('tidak memiliki izin')
    })

    it('melempar error jika belum login', async () => {
      mockAuth.api.getSession.mockResolvedValue(null)

      await expect(requireRole(['superadmin'])).rejects.toThrow('harus login')
    })
  })

  // ============================================================
  // requireSubappAccess
  // ============================================================
  describe('requireSubappAccess', () => {
    it('superadmin bypass — akses semua subapp', async () => {
      mockAuth.api.getSession.mockResolvedValue(SUPERADMIN_SESSION)
      mockDb.query.subapps.findFirst.mockResolvedValue(SUBAPP)

      const result = await requireSubappAccess('school-1')

      expect(result.subapp).toEqual(SUBAPP)
      expect(mockDb.query.subapps.findFirst).toHaveBeenCalled()
    })

    it('superadmin bypass — error jika subapp tidak ada', async () => {
      mockAuth.api.getSession.mockResolvedValue(SUPERADMIN_SESSION)
      mockDb.query.subapps.findFirst.mockResolvedValue(null)

      await expect(requireSubappAccess('invalid')).rejects.toThrow('tidak ditemukan')
    })

    it('user biasa — berhasil jika punya akses', async () => {
      mockAuth.api.getSession.mockResolvedValue(USER_SESSION)
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ subapp: SUBAPP }]),
      })

      const result = await requireSubappAccess('school-1')

      expect(result.subapp).toEqual(SUBAPP)
    })

    it('user biasa — gagal jika tidak punya akses', async () => {
      mockAuth.api.getSession.mockResolvedValue(USER_SESSION)
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      })

      await expect(requireSubappAccess('school-1')).rejects.toThrow('tidak memiliki akses')
    })
  })

  // ============================================================
  // getUserSubapps
  // ============================================================
  describe('getUserSubapps', () => {
    it('superadmin melihat semua subapp', async () => {
      mockAuth.api.getSession.mockResolvedValue(SUPERADMIN_SESSION)
      mockDb.query.subapps.findMany.mockResolvedValue([SUBAPP])

      const result = await getUserSubapps('sa-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(SUBAPP)
      expect(mockDb.query.subapps.findMany).toHaveBeenCalled()
    })

    it('user biasa melihat subapp yang diizinkan saja', async () => {
      mockAuth.api.getSession.mockResolvedValue(USER_SESSION)
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ subapp: SUBAPP }]),
      })

      const result = await getUserSubapps('u-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(SUBAPP)
    })
  })
})
