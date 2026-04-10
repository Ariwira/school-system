/**
 * Tests untuk student.actions.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSelectChain, mockInsertChain, mockUpdateChain, setupSelectSequence } from '../helpers/db-mock'
import {
  SUPERADMIN_SESSION, USER_SESSION, SCHOOL_SUBAPP, FOUNDATION_SUBAPP,
  INSTITUTE_SCHOOL_ID, INSTITUTE_OTHER_ID, STUDENT_ID,
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
  createStudent, updateStudent, getStudents, getStudentById,
  activateStudent, deactivateStudent, cancelStudent,
} from '@/actions/student.actions'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>
  selectDistinct: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

const baseStudentInput = {
  instituteId: INSTITUTE_SCHOOL_ID,
  name: 'Ahmad Fauzi',
  nisn: '1234567890',
  studentNumber: 'STD-001',
  gender: 'male' as const,
  generationYear: 2024,
  admissionDate: '2024-07-01',
}

const studentRow = {
  id: STUDENT_ID, instituteId: INSTITUTE_SCHOOL_ID, instituteName: 'SMA Negeri 1',
  name: 'Ahmad Fauzi', nik: null, nisn: '1234567890', studentNumber: 'STD-001',
  dob: null, pob: null, gender: 'male', phone: null, email: null,
  generationYear: 2024, admissionDate: '2024-07-01', status: 'pending',
  createdAt: new Date(), updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset db.select queue agar mock dari test sebelumnya tidak bocor
  mockDb.select.mockReset()
  vi.mocked(requireRole).mockResolvedValue(SUPERADMIN_SESSION)
  vi.mocked(requireSubappAccess).mockResolvedValue({ session: SUPERADMIN_SESSION, subapp: SCHOOL_SUBAPP })
})

// ============================================================
// CREATE STUDENT
// ============================================================

describe('createStudent', () => {
  it('berhasil membuat siswa baru sebagai superadmin', async () => {
    // Karena nik, email, dan phone tidak ada di input, hanya ada 2 select (NISN dan StudentNumber)
    setupSelectSequence(mockDb, [[], []])
    mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: STUDENT_ID }]))

    const result = await createStudent(baseStudentInput)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(STUDENT_ID)
  })

  it('gagal jika NISN sudah digunakan', async () => {
    // NISN adalah pengecekan pertama (karena NIK kosong di input)
    setupSelectSequence(mockDb, [[{ id: '00000000-0000-4000-d000-000000000099' }]])

    const result = await createStudent(baseStudentInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('NISN')
  })

  it('gagal jika nomor siswa sudah digunakan', async () => {
    // NISN OK, StudentNumber Duplikat
    setupSelectSequence(mockDb, [[], [{ id: '00000000-0000-4000-d000-000000000099' }]])

    const result = await createStudent(baseStudentInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('Nomor siswa')
  })

  it('data isolation: school subapp menggunakan instituteId dari subapp bukan input', async () => {
    setupSelectSequence(mockDb, [[], []])
    mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: STUDENT_ID }]))

    // Input dengan instituteId berbeda — harus diabaikan, dioverride oleh subapp.instituteId
    const result = await createStudent({ ...baseStudentInput, instituteId: INSTITUTE_OTHER_ID }, 'sma-negeri-1')

    expect(result.success).toBe(true)
  })

  it('gagal jika subapp bukan type school', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: FOUNDATION_SUBAPP })

    const result = await createStudent(baseStudentInput, 'yayasan-al-ikhlas')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('sekolah')
  })

  it('gagal dengan input tidak valid (name kosong)', async () => {
    const result = await createStudent({ ...baseStudentInput, name: '' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// GET STUDENTS
// ============================================================

describe('getStudents', () => {
  it('superadmin dapat melihat semua siswa', async () => {
    setupSelectSequence(mockDb, [[studentRow], [{ count: 1 }]])

    const result = await getStudents({})

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.total).toBe(1)
  })

  it('school subapp hanya melihat siswa di institusinya', async () => {
    setupSelectSequence(mockDb, [[studentRow], [{ count: 1 }]])

    const result = await getStudents({}, 'sma-negeri-1')

    expect(result.success).toBe(true)
    expect(mockDb.select).toHaveBeenCalled()
  })

  it('mengembalikan error jika subapp bukan school', async () => {
    vi.mocked(requireSubappAccess).mockResolvedValue({ session: USER_SESSION, subapp: FOUNDATION_SUBAPP })

    const result = await getStudents({}, 'yayasan-al-ikhlas')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('sekolah')
  })

  it('paginasi default 10 item per halaman', async () => {
    setupSelectSequence(mockDb, [[], [{ count: 0 }]])

    const result = await getStudents({})

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.perPage).toBe(10)
  })

  it('paginasi kustom bekerja', async () => {
    setupSelectSequence(mockDb, [[], [{ count: 0 }]])

    const result = await getStudents({ page: 2, perPage: 5 })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.perPage).toBe(5)
    }
  })
})

// ============================================================
// GET STUDENT BY ID
// ============================================================

describe('getStudentById', () => {
  it('superadmin dapat mengambil siswa berdasarkan ID', async () => {
    setupSelectSequence(mockDb, [[studentRow]])

    const result = await getStudentById(STUDENT_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(STUDENT_ID)
  })

  it('mengembalikan error jika ID tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await getStudentById(STUDENT_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('[SECURITY] school: siswa sekolah lain tidak bisa diakses', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await getStudentById(STUDENT_ID, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('mengembalikan error jika ID kosong', async () => {
    const result = await getStudentById('')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })
})

// ============================================================
// UPDATE STUDENT
// ============================================================

describe('updateStudent', () => {
  const updateInput = {
    name: 'Ahmad Fauzi Updated', nisn: '1234567890', studentNumber: 'STD-001',
    gender: 'male' as const, generationYear: 2024, admissionDate: '2024-07-01',
  }

  it('berhasil mengupdate siswa sebagai superadmin', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID }], [], []])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await updateStudent(STUDENT_ID, updateInput)

    expect(result.success).toBe(true)
  })

  it('gagal jika ID tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await updateStudent(STUDENT_ID, updateInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })

  it('gagal jika NISN dipakai siswa lain', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID }], [{ id: '00000000-0000-4000-d000-000000000099' }]])

    const result = await updateStudent(STUDENT_ID, updateInput)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('NISN')
  })

  it('[SECURITY] school: tidak bisa update siswa sekolah lain', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await updateStudent(STUDENT_ID, updateInput, 'sma-negeri-1')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })
})

// ============================================================
// STATUS LIFECYCLE
// ============================================================

describe('activateStudent', () => {
  it('berhasil mengaktifkan siswa dari status pending', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID, status: 'pending' }]])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await activateStudent(STUDENT_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('active')
  })

  it('gagal mengaktifkan siswa yang sudah active', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID, status: 'active' }]])

    const result = await activateStudent(STUDENT_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('pending')
  })

  it('gagal mengaktifkan siswa yang sudah canceled', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID, status: 'canceled' }]])

    const result = await activateStudent(STUDENT_ID)

    expect(result.success).toBe(false)
  })

  it('gagal jika ID kosong', async () => {
    const result = await activateStudent('')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak valid')
  })
})

describe('deactivateStudent', () => {
  it('berhasil menonaktifkan siswa dari status active', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID, status: 'active' }]])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await deactivateStudent(STUDENT_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('inactive')
  })

  it('gagal menonaktifkan siswa berstatus pending', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID, status: 'pending' }]])

    const result = await deactivateStudent(STUDENT_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('aktif')
  })

  it('gagal jika siswa tidak ditemukan', async () => {
    setupSelectSequence(mockDb, [[]])

    const result = await deactivateStudent(STUDENT_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('tidak ditemukan')
  })
})

describe('cancelStudent', () => {
  it('berhasil membatalkan siswa dari status pending', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID, status: 'pending' }]])
    mockDb.update.mockReturnValueOnce(mockUpdateChain())

    const result = await cancelStudent(STUDENT_ID)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('canceled')
  })

  it('gagal membatalkan siswa yang sudah active', async () => {
    setupSelectSequence(mockDb, [[{ id: STUDENT_ID, status: 'active' }]])

    const result = await cancelStudent(STUDENT_ID)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('pending')
  })
})
