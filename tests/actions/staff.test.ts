/**
 * Tests untuk staff.actions.ts
 *
 * Cakupan:
 * - CRUD: createStaff, updateStaff, getStaffs, getStaffById
 * - Status: toggleStaffStatus
 * - Link/Unlink: linkUserAccount, unlinkUserAccount
 * - Business rules:
 *   - NIK/staffNumber/phone/email unik
 *   - 1 user tidak bisa jadi staf 2x di institusi yang sama
 *   - 1 user bisa jadi staf di institusi berbeda (valid)
 *   - Staf dengan transfer pending tidak bisa dihapus
 * - Security: foundation/school hanya lihat staf di institusinya
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSelectChain, mockInsertChain, mockUpdateChain, setupSelectSequence } from '../helpers/db-mock'
import {
  SUPERADMIN_SESSION as _SUPERADMIN_SESSION,
  USER_SESSION as _USER_SESSION,
  SCHOOL_SUBAPP as _SCHOOL_SUBAPP,
  FOUNDATION_SUBAPP as _FOUNDATION_SUBAPP,
  INSTITUTE_SCHOOL_ID,
  INSTITUTE_OTHER_ID,
  STAFF_ID as FIXTURES_STAFF_ID,
  LINK_USER_ID,
  ISSUER_STAFF_ID,
} from '../helpers/fixtures'

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
  createStaff,
  updateStaff,
  getStaffs,
  getStaffById,
  toggleStaffStatus,
  linkUserAccount,
  unlinkUserAccount,
  checkStaffDeletable,
} from '@/actions/staff.actions'
import {
  requireRole,
  requireSubappAccess,
} from '@/lib/auth-helpers'

// --- Fixtures ---

const SUPERADMIN_SESSION = _SUPERADMIN_SESSION
const USER_SESSION = _USER_SESSION
const SCHOOL_SUBAPP = _SCHOOL_SUBAPP
const FOUNDATION_SUBAPP = _FOUNDATION_SUBAPP

// UUID-valid IDs — diperlukan karena createStaffSchema memakai z.string().uuid()
const INSTITUTE_ID = INSTITUTE_SCHOOL_ID
const OTHER_INSTITUTE_ID = INSTITUTE_OTHER_ID
const STAFF_ID = FIXTURES_STAFF_ID
const USER_ID = LINK_USER_ID

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

const baseStaffInput = {
  instituteId: INSTITUTE_ID,
  name: 'Budi Santoso',
  staffNumber: 'STF-001',
  phone: '081234567890',
  email: 'budi@school.com',
  gender: 'male' as const,
  dob: '1985-03-15',
  department: 'academic' as const,
  status: 'active' as const,
}

const staffRow = {
  id: FIXTURES_STAFF_ID, userId: null, instituteId: INSTITUTE_SCHOOL_ID, instituteName: 'SMA Negeri 1',
  name: 'Budi Santoso', nik: null, staffNumber: 'STF-001', phone: '081234567890',
  email: 'budi@school.com', gender: 'male', dob: '1985-03-15', pob: null,
  department: 'academic', joinDate: null, status: 'active',
  userName: null, userEmail: null, createdAt: new Date(), updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset db.select queue agar mock dari test sebelumnya tidak bocor
  mockDb.select.mockReset()
  vi.mocked(requireRole).mockResolvedValue(SUPERADMIN_SESSION)
  vi.mocked(requireSubappAccess).mockResolvedValue({ session: SUPERADMIN_SESSION, subapp: SCHOOL_SUBAPP })
})

// ============================================================
// CREATE STAFF
// ============================================================

describe('createStaff', () => {
  it('berhasil membuat staf baru sebagai superadmin', async () => {
    setupSelectSequence(mockDb, [[], [], []])
    mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: STAFF_ID }]))

    const result = await createStaff(baseStaffInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(STAFF_ID)
    }
  })

  it('[BUSINESS RULE] nomor staf harus unik', async () => {
    setupSelectSequence(mockDb, [[{ id: 'other-staff' }]])

    const result = await createStaff(baseStaffInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Nomor staf')
    }
  })

  it('[BUSINESS RULE] email staf harus unik', async () => {
    setupSelectSequence(mockDb, [[], [{ id: 'other-staff' }]])

    const result = await createStaff(baseStaffInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Email')
    }
  })

  it('[BUSINESS RULE] phone staf harus unik', async () => {
    setupSelectSequence(mockDb, [[], [], [{ id: 'other-staff' }]])

    const result = await createStaff(baseStaffInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('telepon')
    }
  })

  it('data isolation: school subapp menggunakan instituteId dari subapp', async () => {
    setupSelectSequence(mockDb, [[], [], []])
    mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: STAFF_ID }]))

    const result = await createStaff({ ...baseStaffInput, instituteId: OTHER_INSTITUTE_ID }, 'sma-negeri-1')

    expect(result.success).toBe(true)
  })
})

// ============================================================
// GET STAFFS
// ============================================================

describe('getStaffs', () => {
  it('superadmin dapat melihat semua staf', async () => {
    setupSelectSequence(mockDb, [[staffRow], [{ count: 1 }]])

    const result = await getStaffs({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.total).toBe(1)
      expect(result.data.perPage).toBe(10)
    }
  })

  it('school subapp hanya melihat staf di institusinya', async () => {
    setupSelectSequence(mockDb, [[staffRow], [{ count: 1 }]])

    const result = await getStaffs({}, 'sma-negeri-1')

    expect(result.success).toBe(true)
    expect(mockDb.select).toHaveBeenCalled()
  })

  it('foundation subapp hanya melihat staf di institusinya', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: FOUNDATION_SUBAPP })
    setupSelectSequence(mockDb, [
      [{ ...staffRow, instituteId: FOUNDATION_SUBAPP.instituteId }],
      [{ count: 1 }],
    ])

    const result = await getStaffs({}, 'yayasan-al-ikhlas')

    expect(result.success).toBe(true)
  })
})

// ============================================================
// GET STAFF BY ID
// ============================================================

describe('getStaffById', () => {
  it('superadmin dapat mengambil staf berdasarkan ID', async () => {
    setupSelectSequence(mockDb, [[staffRow]])

    const result = await getStaffById(STAFF_ID)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(STAFF_ID)
    }
  })

  it('[SECURITY] school: tidak bisa akses staf dari sekolah lain', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await getStaffById(STAFF_ID, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak ditemukan')
    }
  })

  it('gagal jika ID kosong', async () => {
    const result = await getStaffById('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })
})

// ============================================================
// UPDATE STAFF
// ============================================================

describe('updateStaff', () => {
  const updateInput = {
    name: 'Budi Santoso Updated',
    staffNumber: 'STF-001',
    phone: '081234567890',
    email: 'budi@school.com',
    gender: 'male' as const,
    dob: '1985-03-15',
    department: 'academic' as const,
    status: 'active' as const,
  }

  it('berhasil mengupdate staf', async () => {
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, instituteId: INSTITUTE_ID }],
      [], [], [],
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await updateStaff(STAFF_ID, updateInput)

    expect(result.success).toBe(true)
  })

  it('gagal jika staf tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await updateStaff('non-existent', updateInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak ditemukan')
    }
  })
})

// ============================================================
// TOGGLE STAFF STATUS
// ============================================================

describe('toggleStaffStatus', () => {
  it('berhasil toggle dari active ke inactive', async () => {
    setupSelectSequence(mockDb, [[{ id: STAFF_ID, status: 'active', instituteId: INSTITUTE_ID }]])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await toggleStaffStatus(STAFF_ID)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('inactive')
    }
  })

  it('[SECURITY] school: toggle status staf sekolah lain ditolak', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({
      session: USER_SESSION,
      subapp: { ...SCHOOL_SUBAPP, instituteId: INSTITUTE_ID }
    } as any)

    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, status: 'active', instituteId: OTHER_INSTITUTE_ID }] // Staf milik sekolah lain
    ])

    const result = await toggleStaffStatus(STAFF_ID, 'subapp-A')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Akses ditolak')
    }
  })

  it('berhasil toggle dari inactive ke active', async () => {
    setupSelectSequence(mockDb, [[{ id: STAFF_ID, status: 'inactive', instituteId: INSTITUTE_ID }]])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await toggleStaffStatus(STAFF_ID)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('active')
    }
  })

  it('gagal jika ID tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await toggleStaffStatus(STAFF_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak ditemukan')
    }
  })

  it('gagal jika ID kosong', async () => {
    const result = await toggleStaffStatus('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })
})

// ============================================================
// LINK / UNLINK USER ACCOUNT
// ============================================================

describe('linkUserAccount', () => {
  it('berhasil menghubungkan user ke staf', async () => {
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, userId: null, instituteId: INSTITUTE_ID }],
      [{ id: USER_ID }],
      [],
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await linkUserAccount(STAFF_ID, USER_ID)

    expect(result.success).toBe(true)
  })

  it('gagal jika staf sudah terhubung ke user', async () => {
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, userId: 'existing-user-id', instituteId: INSTITUTE_ID }],
    ])

    const result = await linkUserAccount(STAFF_ID, USER_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('sudah terhubung')
    }
  })

  it('[BUSINESS RULE] user tidak bisa jadi staf di institusi yang sama 2x', async () => {
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, userId: null, instituteId: INSTITUTE_ID }],
      [{ id: USER_ID }],
      [{ id: 'other-staff-id' }],  // user sudah punya staf di institusi ini
    ])

    const result = await linkUserAccount(STAFF_ID, USER_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('institusi yang sama')
    }
  })

  it('[BUSINESS RULE] user bisa jadi staf di institusi berbeda (valid)', async () => {
    // User linked di INSTITUTE_ID, sekarang link ke staff di OTHER_INSTITUTE_ID
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, userId: null, instituteId: OTHER_INSTITUTE_ID }],
      [{ id: USER_ID }],
      [],  // tidak ada konflik di OTHER_INSTITUTE_ID
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await linkUserAccount(STAFF_ID, USER_ID)

    expect(result.success).toBe(true)
  })

  it('gagal jika user tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, userId: null, instituteId: INSTITUTE_ID }],
      [],
    ])

    const result = await linkUserAccount(STAFF_ID, USER_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('User tidak ditemukan')
    }
  })

  it('gagal jika staffId kosong', async () => {
    const result = await linkUserAccount('', USER_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak valid')
    }
  })
})

describe('unlinkUserAccount', () => {
  it('berhasil memutus hubungan staf dari user', async () => {
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, userId: USER_ID, instituteId: INSTITUTE_ID }],
    ])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await unlinkUserAccount(STAFF_ID)

    expect(result.success).toBe(true)
  })

  it('gagal jika staf belum terhubung ke user', async () => {
    setupSelectSequence(mockDb, [
      [{ id: STAFF_ID, userId: null, instituteId: INSTITUTE_ID }],
    ])

    const result = await unlinkUserAccount(STAFF_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak terhubung')
    }
  })

  it('gagal jika staf tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await unlinkUserAccount(STAFF_ID)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tidak ditemukan')
    }
  })
})

// ============================================================
// CHECK STAFF DELETABLE
// ============================================================

describe('checkStaffDeletable', () => {
  it('staf bisa dihapus jika tidak ada transfer pending', async () => {
    setupSelectSequence(mockDb, [[{ count: 0 }]])

    const result = await checkStaffDeletable(STAFF_ID)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deletable).toBe(true)
    }
  })

  it('[BUSINESS RULE] staf tidak bisa dihapus jika ada transfer pending', async () => {
    setupSelectSequence(mockDb, [[{ count: 2 }]])

    const result = await checkStaffDeletable(STAFF_ID)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.deletable).toBe(false)
      expect(result.data.reason).toContain('2')
    }
  })

  it('[SECURITY] hanya superadmin yang bisa cek', async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error('Anda tidak memiliki izin.'))

    await expect(checkStaffDeletable(STAFF_ID)).rejects.toThrow()
  })
})
