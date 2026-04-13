/**
 * Helper untuk mock session/auth di test.
 * Digunakan untuk mensimulasikan berbagai role dan subapp access
 * dalam pengujian Server Actions.
 *
 * Strategi: mock seluruh modul @/lib/auth-helpers agar requireRole,
 * requireAuth, dan requireSubappAccess dapat dikontrol sepenuhnya di test.
 */
import { vi } from 'vitest'

export const SUPERADMIN_SESSION = {
  user: {
    id: 'superadmin-user-id',
    name: 'Super Admin',
    email: 'superadmin@example.com',
    role: 'superadmin',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: 'session-id',
    userId: 'superadmin-user-id',
    token: 'token-123',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

export const USER_SESSION = {
  user: {
    id: 'regular-user-id',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: 'session-id-2',
    userId: 'regular-user-id',
    token: 'token-456',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

export const SCHOOL_SUBAPP = {
  id: 'subapp-school-id',
  key: 'sma-negeri-1',
  type: 'school' as const,
  name: 'SMA Negeri 1',
  image: null,
  instituteId: 'institute-school-id',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const FOUNDATION_SUBAPP = {
  id: 'subapp-foundation-id',
  key: 'yayasan-al-ikhlas',
  type: 'foundation' as const,
  name: 'Yayasan Al-Ikhlas',
  image: null,
  instituteId: 'institute-foundation-id',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

/**
 * Buat mock stubs untuk requireRole, requireAuth, requireSubappAccess.
 * Panggil ini di dalam vi.mock('@/lib/auth-helpers', ...) di file test.
 */
export function createAuthHelperMocks() {
  return {
    requireAuth: vi.fn().mockResolvedValue(SUPERADMIN_SESSION),
    requireRole: vi.fn().mockResolvedValue(SUPERADMIN_SESSION),
    requireSubappAccess: vi.fn().mockResolvedValue({
      session: SUPERADMIN_SESSION,
      subapp: SCHOOL_SUBAPP,
    }),
    getUserInstituteId: vi.fn().mockResolvedValue(null),
    getUserSubapps: vi.fn().mockResolvedValue([SCHOOL_SUBAPP]),
  }
}
