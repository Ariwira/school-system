'use server'

import { and, count, eq, ilike, ne, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { institutes, students } from '@/lib/db/schema'
import {
  createStudentSchema,
  updateStudentSchema,
  getStudentsSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
  type GetStudentsInput,
  type StudentRow,
  type ActionResult,
} from '@/lib/validations/student'

// ---- Helpers ----

function revalidateStudentPaths(subAppKey?: string) {
  revalidatePath('/superadmin/students')
  if (subAppKey) {
    revalidatePath(`/school/${subAppKey}/students`)
  }
}

// ---- Server Actions ----

/**
 * Mengambil daftar siswa dengan paginasi dan filter opsional.
 * Superadmin dapat melihat semua siswa; school hanya siswa di institusinya.
 */
export async function getStudents(
  input: Partial<GetStudentsInput> = {},
  subAppKey?: string,
): Promise<ActionResult<{ data: StudentRow[]; total: number; page: number; perPage: number }>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak. Halaman ini hanya untuk sub-aplikasi sekolah.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
    scopedInstituteId = input.instituteId
  }

  const parsed = getStudentsSchema.safeParse({
    page: input.page ?? 1,
    perPage: input.perPage ?? 10,
    search: input.search,
    status: input.status,
    generationYear: input.generationYear,
    instituteId: scopedInstituteId,
  })

  if (!parsed.success) {
    return { success: false, error: 'Parameter tidak valid.' }
  }

  const { page, perPage, search, status, generationYear } = parsed.data
  const offset = (page - 1) * perPage

  try {
    const conditions = []

    if (scopedInstituteId) {
      conditions.push(eq(students.instituteId, scopedInstituteId))
    }

    if (status) {
      conditions.push(eq(students.status, status))
    }

    if (generationYear) {
      conditions.push(eq(students.generationYear, generationYear))
    }

    if (search) {
      conditions.push(
        or(
          ilike(students.name, `%${search}%`),
          ilike(students.nisn, `%${search}%`),
          ilike(students.studentNumber, `%${search}%`),
        ),
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: students.id,
        instituteId: students.instituteId,
        instituteName: institutes.name,
        name: students.name,
        nik: students.nik,
        nisn: students.nisn,
        studentNumber: students.studentNumber,
        dob: students.dob,
        pob: students.pob,
        gender: students.gender,
        phone: students.phone,
        email: students.email,
        generationYear: students.generationYear,
        admissionDate: students.admissionDate,
        status: students.status,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .innerJoin(institutes, eq(students.instituteId, institutes.id))
      .where(whereClause)
      .limit(perPage)
      .offset(offset)
      .orderBy(students.createdAt)

    const totalResult = await db
      .select({ count: count() })
      .from(students)
      .innerJoin(institutes, eq(students.instituteId, institutes.id))
      .where(whereClause)

    const total = totalResult[0]?.count ?? 0

    const data: StudentRow[] = rows.map((row) => ({
      ...row,
      instituteName: row.instituteName ?? '',
      dob: row.dob ?? null,
      pob: row.pob ?? null,
      phone: row.phone ?? null,
      email: row.email ?? null,
    }))

    return { success: true, data: { data, total, page, perPage } }
  } catch {
    return { success: false, error: 'Gagal mengambil data siswa. Silakan coba lagi.' }
  }
}

/**
 * Mengambil detail siswa berdasarkan ID.
 */
export async function getStudentById(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<StudentRow>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID siswa tidak valid.' }
  }

  try {
    const whereClause = scopedInstituteId
      ? and(eq(students.id, id), eq(students.instituteId, scopedInstituteId))
      : eq(students.id, id)

    const rows = await db
      .select({
        id: students.id,
        instituteId: students.instituteId,
        instituteName: institutes.name,
        name: students.name,
        nik: students.nik,
        nisn: students.nisn,
        studentNumber: students.studentNumber,
        dob: students.dob,
        pob: students.pob,
        gender: students.gender,
        phone: students.phone,
        email: students.email,
        generationYear: students.generationYear,
        admissionDate: students.admissionDate,
        status: students.status,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .innerJoin(institutes, eq(students.instituteId, institutes.id))
      .where(whereClause)
      .limit(1)

    const row = rows[0]
    if (!row) {
      return { success: false, error: 'Siswa tidak ditemukan.' }
    }

    return {
      success: true,
      data: {
        ...row,
        instituteName: row.instituteName ?? '',
        dob: row.dob ?? null,
        pob: row.pob ?? null,
        phone: row.phone ?? null,
        email: row.email ?? null,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil data siswa. Silakan coba lagi.' }
  }
}

/**
 * Membuat siswa baru. Status default: pending.
 */
export async function createStudent(
  input: CreateStudentInput,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  let scopedInstituteId: string

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak. Halaman ini hanya untuk sub-aplikasi sekolah.' }
    }
    if (!subapp.instituteId) {
      return { success: false, error: 'Sub-aplikasi tidak terhubung ke institusi.' }
    }
    scopedInstituteId = subapp.instituteId
  } else {
    await requireRole(['superadmin'])
    scopedInstituteId = input.instituteId
  }

  const parsed = createStudentSchema.safeParse({ ...input, instituteId: scopedInstituteId })
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const {
    name,
    nik,
    nisn,
    studentNumber,
    dob,
    pob,
    gender,
    phone,
    email,
    generationYear,
    admissionDate,
  } = parsed.data

  try {
    // Validasi: NIK unik jika diisi
    if (nik) {
      const existingNik = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.nik, nik))
        .limit(1)

      if (existingNik.length > 0) {
        return { success: false, error: 'NIK sudah digunakan oleh siswa lain.' }
      }
    }

    // Validasi: NISN unik di seluruh sistem
    const existingNisn = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.nisn, nisn))
      .limit(1)

    if (existingNisn.length > 0) {
      return { success: false, error: 'NISN sudah digunakan oleh siswa lain.' }
    }

    // Validasi: nomor siswa unik di seluruh sistem
    const existingStudentNumber = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.studentNumber, studentNumber))
      .limit(1)

    if (existingStudentNumber.length > 0) {
      return { success: false, error: 'Nomor siswa sudah digunakan.' }
    }

    // Validasi: email unik jika diisi
    if (email) {
      const existingEmail = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.email, email))
        .limit(1)

      if (existingEmail.length > 0) {
        return { success: false, error: 'Email sudah digunakan oleh siswa lain.' }
      }
    }

    // Validasi: telepon unik jika diisi
    if (phone) {
      const existingPhone = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.phone, phone))
        .limit(1)

      if (existingPhone.length > 0) {
        return { success: false, error: 'Nomor telepon sudah digunakan oleh siswa lain.' }
      }
    }

    const [newStudent] = await db
      .insert(students)
      .values({
        instituteId: scopedInstituteId,
        name,
        nik: nik || null,
        nisn,
        studentNumber,
        dob: dob || null,
        pob: pob || null,
        gender,
        phone: phone || null,
        email: email || null,
        generationYear,
        admissionDate,
        status: 'pending',
      })
      .returning({ id: students.id })

    if (!newStudent) {
      return { success: false, error: 'Gagal membuat siswa.' }
    }

    revalidateStudentPaths(subAppKey)
    return { success: true, data: { id: newStudent.id } }
  } catch {
    return { success: false, error: 'Gagal membuat siswa. Silakan coba lagi.' }
  }
}

/**
 * Memperbarui data siswa.
 */
export async function updateStudent(
  id: string,
  input: UpdateStudentInput,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  let scopedInstituteIdForUpdate: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
    scopedInstituteIdForUpdate = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID siswa tidak valid.' }
  }

  const parsed = updateStudentSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const {
    name,
    nik,
    nisn,
    studentNumber,
    dob,
    pob,
    gender,
    phone,
    email,
    generationYear,
    admissionDate,
  } = parsed.data

  try {
    // Pastikan siswa ada dan milik institusi yang sama
    const existingWhereClause = scopedInstituteIdForUpdate
      ? and(eq(students.id, id), eq(students.instituteId, scopedInstituteIdForUpdate))
      : eq(students.id, id)

    const existing = await db
      .select({ id: students.id })
      .from(students)
      .where(existingWhereClause)
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Siswa tidak ditemukan.' }
    }

    // Validasi: NIK unik jika diisi (kecuali milik sendiri)
    if (nik) {
      const existingNik = await db
        .select({ id: students.id })
        .from(students)
        .where(and(eq(students.nik, nik), ne(students.id, id)))
        .limit(1)

      if (existingNik.length > 0) {
        return { success: false, error: 'NIK sudah digunakan oleh siswa lain.' }
      }
    }

    // Validasi: NISN unik (kecuali milik sendiri)
    const existingNisn = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.nisn, nisn), ne(students.id, id)))
      .limit(1)

    if (existingNisn.length > 0) {
      return { success: false, error: 'NISN sudah digunakan oleh siswa lain.' }
    }

    // Validasi: nomor siswa unik (kecuali milik sendiri)
    const existingStudentNumber = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.studentNumber, studentNumber), ne(students.id, id)))
      .limit(1)

    if (existingStudentNumber.length > 0) {
      return { success: false, error: 'Nomor siswa sudah digunakan.' }
    }

    // Validasi: email unik jika diisi (kecuali milik sendiri)
    if (email) {
      const existingEmail = await db
        .select({ id: students.id })
        .from(students)
        .where(and(eq(students.email, email), ne(students.id, id)))
        .limit(1)

      if (existingEmail.length > 0) {
        return { success: false, error: 'Email sudah digunakan oleh siswa lain.' }
      }
    }

    // Validasi: telepon unik jika diisi (kecuali milik sendiri)
    if (phone) {
      const existingPhone = await db
        .select({ id: students.id })
        .from(students)
        .where(and(eq(students.phone, phone), ne(students.id, id)))
        .limit(1)

      if (existingPhone.length > 0) {
        return { success: false, error: 'Nomor telepon sudah digunakan oleh siswa lain.' }
      }
    }

    await db
      .update(students)
      .set({
        name,
        nik: nik || null,
        nisn,
        studentNumber,
        dob: dob || null,
        pob: pob || null,
        gender,
        phone: phone || null,
        email: email || null,
        generationYear,
        admissionDate,
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))

    revalidateStudentPaths(subAppKey)
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal memperbarui siswa. Silakan coba lagi.' }
  }
}

/**
 * Mengaktifkan siswa: pending → active.
 */
export async function activateStudent(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID siswa tidak valid.' }
  }

  try {
    const existing = await db
      .select({ id: students.id, status: students.status })
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Siswa tidak ditemukan.' }
    }

    if (existing[0].status !== 'pending') {
      return {
        success: false,
        error: `Siswa tidak dapat diaktifkan karena statusnya saat ini adalah "${existing[0].status}". Hanya siswa berstatus pending yang dapat diaktifkan.`,
      }
    }

    await db
      .update(students)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(students.id, id))

    revalidateStudentPaths(subAppKey)
    return { success: true, data: { id, status: 'active' } }
  } catch {
    return { success: false, error: 'Gagal mengaktifkan siswa. Silakan coba lagi.' }
  }
}

/**
 * Menonaktifkan siswa: active → inactive.
 */
export async function deactivateStudent(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID siswa tidak valid.' }
  }

  try {
    const existing = await db
      .select({ id: students.id, status: students.status })
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Siswa tidak ditemukan.' }
    }

    if (existing[0].status !== 'active') {
      return {
        success: false,
        error: `Siswa tidak dapat dinonaktifkan karena statusnya saat ini adalah "${existing[0].status}". Hanya siswa berstatus aktif yang dapat dinonaktifkan.`,
      }
    }

    await db
      .update(students)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(students.id, id))

    revalidateStudentPaths(subAppKey)
    return { success: true, data: { id, status: 'inactive' } }
  } catch {
    return { success: false, error: 'Gagal menonaktifkan siswa. Silakan coba lagi.' }
  }
}

/**
 * Membatalkan siswa: pending → canceled.
 */
export async function cancelStudent(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID siswa tidak valid.' }
  }

  try {
    const existing = await db
      .select({ id: students.id, status: students.status })
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Siswa tidak ditemukan.' }
    }

    if (existing[0].status !== 'pending') {
      return {
        success: false,
        error: `Siswa tidak dapat dibatalkan karena statusnya saat ini adalah "${existing[0].status}". Hanya siswa berstatus pending yang dapat dibatalkan.`,
      }
    }

    await db
      .update(students)
      .set({ status: 'canceled', updatedAt: new Date() })
      .where(eq(students.id, id))

    revalidateStudentPaths(subAppKey)
    return { success: true, data: { id, status: 'canceled' } }
  } catch {
    return { success: false, error: 'Gagal membatalkan pendaftaran siswa. Silakan coba lagi.' }
  }
}

/**
 * Mengambil daftar institusi untuk dropdown (superadmin only).
 */
export async function getInstitutesForStudent(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  await requireRole(['superadmin'])

  try {
    const rows = await db
      .select({ id: institutes.id, name: institutes.name })
      .from(institutes)
      .orderBy(institutes.name)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Gagal mengambil data institusi.' }
  }
}

/**
 * Mengambil daftar tahun angkatan yang tersedia untuk filter.
 */
export async function getGenerationYears(
  subAppKey?: string,
): Promise<ActionResult<number[]>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (subapp.type !== 'school') {
      return { success: false, error: 'Akses ditolak.' }
    }
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    await requireRole(['superadmin'])
  }

  try {
    const conditions = []
    if (scopedInstituteId) {
      conditions.push(eq(students.instituteId, scopedInstituteId))
    }

    const rows = await db
      .selectDistinct({ generationYear: students.generationYear })
      .from(students)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(students.generationYear)

    return { success: true, data: rows.map((r) => r.generationYear) }
  } catch {
    return { success: false, error: 'Gagal mengambil data tahun angkatan.' }
  }
}
