/**
 * Tests untuk profile.actions.ts
 *
 * Cakupan:
 * - updateProfile: validasi email unik, update nama/email
 * - changePassword: verifikasi password lama wajib
 * - updateAvatar: update URL avatar, hapus yang lama
 * - revokeSession: akhiri sesi berdasarkan token
 * - getActiveSessions: daftar sesi aktif
 * - Security: semua action hanya bisa diakses user yang login
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSelectChain, mockUpdateChain, setupSelectSequence } from '../helpers/db-mock'

// --- Mocks (hoisted) ---

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
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
    query: {
      subapps: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      changePassword: vi.fn(),
      revokeSession: vi.fn(),
      listSessions: vi.fn(),
    },
  },
}))

// --- Imports setelah mock ---

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import {
  updateProfile,
  changePassword,
  updateAvatar,
  revokeSession,
  getActiveSessions,
} from '@/actions/profile.actions'
import { requireAuth } from '@/lib/auth-helpers'

// --- Fixtures ---

const SUPERADMIN_SESSION = {
  user: {
    id: 'superadmin-user-id', name: 'Super Admin', email: 'superadmin@example.com',
    role: 'superadmin', emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
  },
  session: { id: 'session-id', userId: 'superadmin-user-id', token: 'token-123', expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(), updatedAt: new Date() },
}

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

const mockAuth = auth as unknown as {
  api: {
    getSession: ReturnType<typeof vi.fn>
    changePassword: ReturnType<typeof vi.fn>
    revokeSession: ReturnType<typeof vi.fn>
    listSessions: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset db.select queue agar mock dari test sebelumnya tidak bocor
  mockDb.select.mockReset()
  vi.mocked(requireAuth).mockResolvedValue(SUPERADMIN_SESSION)
})

// ============================================================
// UPDATE PROFILE
// ============================================================

describe('updateProfile', () => {
  it('berhasil mengupdate nama dan email', async () => {
    setupSelectSequence(mockDb, [[]])  // email belum dipakai user lain
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await updateProfile({
      name: 'Super Admin Updated',
      email: 'superadmin@example.com',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Super Admin Updated')
    }
  })

  it('tidak melakukan cek duplikat jika email tidak berubah', async () => {
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await updateProfile({
      name: 'Super Admin',
      email: SUPERADMIN_SESSION.user.email,
    })

    // select tidak dipanggil karena email sama dengan session
    expect(mockDb.select).not.toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('gagal jika email sudah dipakai user lain', async () => {
    setupSelectSequence(mockDb, [[{ id: 'other-user-id' }]])

    const result = await updateProfile({
      name: 'Super Admin',
      email: 'other@example.com',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Email')
    }
  })

  it('gagal dengan nama kurang dari 2 karakter', async () => {
    const result = await updateProfile({ name: 'A', email: 'superadmin@example.com' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('2 karakter')
    }
  })

  it('gagal dengan format email tidak valid', async () => {
    const result = await updateProfile({ name: 'Super Admin', email: 'bukan-email' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('email')
    }
  })

  it('[SECURITY] tidak bisa update profil tanpa login', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Anda harus login.'))

    await expect(updateProfile({ name: 'Test', email: 'test@example.com' })).rejects.toThrow()
  })
})

// ============================================================
// CHANGE PASSWORD
// ============================================================

describe('changePassword', () => {
  it('berhasil mengubah password dengan verifikasi password lama', async () => {
    mockAuth.api.changePassword.mockResolvedValue(undefined)

    const result = await changePassword({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword456',
      confirmPassword: 'newpassword456',
    })

    expect(result.success).toBe(true)
    expect(mockAuth.api.changePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword456',
        }),
      })
    )
  })

  it('[BUSINESS RULE] password lama salah harus ditolak', async () => {
    mockAuth.api.changePassword.mockRejectedValue(new Error('Invalid password'))

    const result = await changePassword({
      currentPassword: 'salah',
      newPassword: 'newpassword456',
      confirmPassword: 'newpassword456',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Password lama')
    }
  })

  it('gagal jika konfirmasi password tidak cocok', async () => {
    const result = await changePassword({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword456',
      confirmPassword: 'berbeda',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Konfirmasi')
    }
  })

  it('gagal jika password baru kurang dari 8 karakter', async () => {
    const result = await changePassword({
      currentPassword: 'oldpassword123',
      newPassword: 'short',
      confirmPassword: 'short',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('8 karakter')
    }
  })

  it('gagal jika password lama kosong', async () => {
    const result = await changePassword({
      currentPassword: '',
      newPassword: 'newpassword456',
      confirmPassword: 'newpassword456',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('wajib')
    }
  })
})

// ============================================================
// UPDATE AVATAR
// ============================================================

describe('updateAvatar', () => {
  it('berhasil update avatar dan hapus yang lama', async () => {
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await updateAvatar(
      'https://utfs.io/f/new-avatar-key',
      'https://utfs.io/f/old-avatar-key',
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.avatarUrl).toBe('https://utfs.io/f/new-avatar-key')
    }
  })

  it('berhasil update avatar tanpa avatar lama', async () => {
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await updateAvatar('https://utfs.io/f/new-avatar-key', null)

    expect(result.success).toBe(true)
  })

  it('gagal jika URL avatar tidak valid (bukan http)', async () => {
    const result = await updateAvatar('bukan-url', null)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })

  it('gagal jika URL avatar kosong', async () => {
    const result = await updateAvatar('', null)

    expect(result.success).toBe(false)
  })
})

// ============================================================
// REVOKE SESSION
// ============================================================

describe('revokeSession', () => {
  it('berhasil mengakhiri sesi berdasarkan token', async () => {
    mockAuth.api.revokeSession.mockResolvedValue(undefined)

    const result = await revokeSession('valid-session-token')

    expect(result.success).toBe(true)
    expect(mockAuth.api.revokeSession).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { token: 'valid-session-token' },
      })
    )
  })

  it('gagal jika token kosong', async () => {
    const result = await revokeSession('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })

  it('gagal jika revokeSession melempar error', async () => {
    mockAuth.api.revokeSession.mockRejectedValue(new Error('Session not found'))

    const result = await revokeSession('invalid-token')

    expect(result.success).toBe(false)
  })
})

// ============================================================
// GET ACTIVE SESSIONS
// ============================================================

describe('getActiveSessions', () => {
  it('berhasil mengambil daftar sesi aktif', async () => {
    const mockSessions = [
      {
        id: 'session-1', token: 'token-1', ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0', createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000),
      },
    ]
    mockAuth.api.listSessions.mockResolvedValue(mockSessions)

    const result = await getActiveSessions()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0]?.token).toBe('token-1')
    }
  })

  it('mengembalikan array kosong jika tidak ada sesi', async () => {
    mockAuth.api.listSessions.mockResolvedValue([])

    const result = await getActiveSessions()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })

  it('gagal jika listSessions melempar error', async () => {
    mockAuth.api.listSessions.mockRejectedValue(new Error('Auth error'))

    const result = await getActiveSessions()

    expect(result.success).toBe(false)
  })
})
