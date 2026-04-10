/**
 * Tests untuk institute.actions.ts
 *
 * Cakupan:
 * - CRUD: createInstitute, updateInstitute, getInstitutes, getInstituteById
 * - Status: deactivateInstitute
 * - Business rules:
 *   - Nama/phone/email unik
 *   - School harus punya parent foundation
 *   - Tidak bisa nonaktifkan jika ada staf/siswa aktif
 * - Security: hanya superadmin yang bisa akses
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSelectChain, mockInsertChain, mockUpdateChain, setupSelectSequence } from '../helpers/db-mock'

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

// --- Imports setelah mock ---

import { db } from '@/lib/db'
import {
  createInstitute,
  updateInstitute,
  getInstitutes,
  getInstituteById,
  getFoundations,
  deactivateInstitute,
} from '@/actions/institute.actions'
import { requireRole } from '@/lib/auth-helpers'

// --- Fixtures ---

const SUPERADMIN_SESSION = {
  user: { id: 'superadmin-user-id', name: 'Super Admin', email: 'superadmin@example.com', role: 'superadmin', emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  session: { id: 'session-id', userId: 'superadmin-user-id', token: 'token-123', expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(), updatedAt: new Date() },
}

const INSTITUTE_ID = '00000000-0000-4000-b000-000000000001'
const FOUNDATION_ID = '00000000-0000-4000-b000-000000000002'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  transaction: ReturnType<typeof vi.fn>
}

const foundationInput = {
  name: 'Yayasan Al-Ikhlas',
  address: 'Jl. Merdeka No. 1, Jakarta',
  phone: '08123456789',
  type: 'foundation' as const,
}

const schoolInput = {
  name: 'SMA Negeri 1',
  address: 'Jl. Pendidikan No. 5, Jakarta',
  phone: '08987654321',
  type: 'school' as const,
  parentId: FOUNDATION_ID,
}

const instituteRow = {
  id: INSTITUTE_ID, name: 'Yayasan Al-Ikhlas', address: 'Jl. Merdeka No. 1, Jakarta',
  phone: '08123456789', email: null, image: null, establishedYear: null,
  type: 'foundation', parentId: null, createdAt: new Date(), updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset db.select queue agar mock dari test sebelumnya tidak bocor
  mockDb.select.mockReset()
  vi.mocked(requireRole).mockResolvedValue(SUPERADMIN_SESSION)
})

// ============================================================
// CREATE INSTITUTE
// ============================================================

describe('createInstitute', () => {
  it('berhasil membuat institusi foundation baru', async () => {
    setupSelectSequence(mockDb, [
      [],  // nama belum dipakai
      [],  // phone belum dipakai
      [],  // subapp key belum ada
    ])
    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<{ id: string }>) => {
      const fakeTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: INSTITUTE_ID }]),
          }),
        }),
      }
      return cb(fakeTx)
    })

    const result = await createInstitute(foundationInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(INSTITUTE_ID)
    }
  })

  it('berhasil membuat institusi school dengan parent foundation', async () => {
    setupSelectSequence(mockDb, [
      [],                           // nama OK
      [],                           // phone OK
      [{ type: 'foundation' }],     // parent bertipe foundation
      [],                           // subapp key belum ada
    ])
    mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<{ id: string }>) => {
      const fakeTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: INSTITUTE_ID }]),
          }),
        }),
      }
      return cb(fakeTx)
    })

    const result = await createInstitute(schoolInput)

    if (!result.success) {
      throw new Error(`TEST FAILED, ERROR IS: ${result.error}`)
    }
    expect(result.success).toBe(true)
  })

  it('[BUSINESS RULE] nama institusi harus unik', async () => {
    setupSelectSequence(mockDb, [[{ id: 'other-institute' }]])

    const result = await createInstitute(foundationInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Nama')
    }
  })

  it('[BUSINESS RULE] nomor telepon harus unik', async () => {
    setupSelectSequence(mockDb, [
      [],
      [{ id: 'other-institute' }],
    ])

    const result = await createInstitute(foundationInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('telepon')
    }
  })

  it('[BUSINESS RULE] parent sekolah harus bertipe foundation', async () => {
    setupSelectSequence(mockDb, [
      [],
      [],
      [{ type: 'school' }],  // parent bertipe school — salah
    ])

    const result = await createInstitute(schoolInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('yayasan')
    }
  })

  it('gagal dengan input tidak valid (nama kosong)', async () => {
    const result = await createInstitute({ ...foundationInput, name: '' })
    expect(result.success).toBe(false)
  })

  it('[SECURITY] bukan superadmin tidak bisa membuat institusi', async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error('Anda tidak memiliki izin.'))

    await expect(createInstitute(foundationInput)).rejects.toThrow()
  })
})

// ============================================================
// UPDATE INSTITUTE
// ============================================================

describe('updateInstitute', () => {
  const updateInput = {
    name: 'Yayasan Al-Ikhlas Updated',
    address: 'Jl. Merdeka No. 2, Jakarta',
    phone: '08123456789',
    type: 'foundation' as const,
  }

  it('berhasil mengupdate institusi', async () => {
    setupSelectSequence(mockDb, [
      [{ id: INSTITUTE_ID }],
      [{ id: INSTITUTE_ID }],  // nama check (milik sendiri — ok)
      [{ id: INSTITUTE_ID }],  // phone check (milik sendiri — ok)
    ])
    mockDb.update.mockReturnValue(mockUpdateChain())

    const result = await updateInstitute(INSTITUTE_ID, updateInput)

    expect(result.success).toBe(true)
  })

  it('[BUSINESS RULE] nama harus unik kecuali milik sendiri', async () => {
    setupSelectSequence(mockDb, [
      [{ id: INSTITUTE_ID }],
      [{ id: 'other-institute-id' }],  // nama dipakai institusi lain
    ])

    const result = await updateInstitute(INSTITUTE_ID, updateInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Nama')
    }
  })

  it('gagal jika institusi tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await updateInstitute('non-existent', updateInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak ditemukan')
    }
  })

  it('gagal jika ID kosong', async () => {
    const result = await updateInstitute('', updateInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })
})

// ============================================================
// GET INSTITUTES
// ============================================================

describe('getInstitutes', () => {
  it('mengambil daftar institusi dengan paginasi default', async () => {
    setupSelectSequence(mockDb, [[instituteRow], [{ count: 1 }]])

    const result = await getInstitutes({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.total).toBe(1)
      expect(result.data.perPage).toBe(10)
    }
  })

  it('filter by type bekerja', async () => {
    setupSelectSequence(mockDb, [[instituteRow], [{ count: 1 }]])

    const result = await getInstitutes({ type: 'foundation' })

    expect(result.success).toBe(true)
    expect(mockDb.select).toHaveBeenCalled()
  })
})

// ============================================================
// GET INSTITUTE BY ID
// ============================================================

describe('getInstituteById', () => {
  it('berhasil mengambil institusi berdasarkan ID', async () => {
    setupSelectSequence(mockDb, [[instituteRow]])

    const result = await getInstituteById(INSTITUTE_ID)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(INSTITUTE_ID)
    }
  })

  it('mengembalikan error jika tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await getInstituteById('non-existent')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak ditemukan')
    }
  })

  it('mengembalikan error jika ID kosong', async () => {
    const result = await getInstituteById('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })
})

// ============================================================
// DEACTIVATE INSTITUTE
// ============================================================

describe('deactivateInstitute', () => {
  it('berhasil menonaktifkan institusi tanpa staf/siswa aktif', async () => {
    setupSelectSequence(mockDb, [
      [{ id: INSTITUTE_ID, name: 'Yayasan Al-Ikhlas' }],
      [{ count: 0 }],
      [{ count: 0 }],
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await deactivateInstitute(INSTITUTE_ID)

    expect(result.success).toBe(true)
  })

  it('[BUSINESS RULE] tidak bisa nonaktifkan jika ada staf aktif', async () => {
    setupSelectSequence(mockDb, [
      [{ id: INSTITUTE_ID, name: 'Yayasan Al-Ikhlas' }],
      [{ count: 3 }],
    ])

    const result = await deactivateInstitute(INSTITUTE_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('staf aktif')
    }
  })

  it('[BUSINESS RULE] tidak bisa nonaktifkan jika ada siswa aktif', async () => {
    setupSelectSequence(mockDb, [
      [{ id: INSTITUTE_ID, name: 'Yayasan Al-Ikhlas' }],
      [{ count: 0 }],
      [{ count: 5 }],
    ])

    const result = await deactivateInstitute(INSTITUTE_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('siswa aktif')
    }
  })

  it('gagal jika institusi tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await deactivateInstitute(INSTITUTE_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak ditemukan')
    }
  })

  it('gagal jika ID kosong', async () => {
    const result = await deactivateInstitute('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })
})

// ============================================================
// GET FOUNDATIONS
// ============================================================

describe('getFoundations', () => {
  it('mengembalikan daftar yayasan untuk dropdown', async () => {
    setupSelectSequence(mockDb, [[{ id: FOUNDATION_ID, name: 'Yayasan Al-Ikhlas' }]])

    const result = await getFoundations()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0]?.name).toBe('Yayasan Al-Ikhlas')
    }
  })
})
