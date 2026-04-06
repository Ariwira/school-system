'use server'

import { and, count, eq, ilike, inArray, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { UTApi } from 'uploadthing/server'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { institutes, staffs, students, subapps } from '@/lib/db/schema'
import {
  createInstituteSchema,
  updateInstituteSchema,
  getInstitutesSchema,
  type CreateInstituteInput,
  type UpdateInstituteInput,
  type GetInstitutesInput,
  type InstituteWithParent,
  type ActionResult,
} from '@/lib/validations/institute'

const utapi = new UTApi()

// ---- Helpers ----

/**
 * Mengekstrak file key dari URL Uploadthing.
 */
function extractFileKey(url: string): string | null {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/')
    const fIndex = segments.indexOf('f')
    if (fIndex !== -1 && segments[fIndex + 1]) {
      return segments[fIndex + 1]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Membuat slug dari nama institusi.
 * Contoh: "Yayasan Al-Ikhlas" → "yayasan-al-ikhlas"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---- Server Actions ----

/**
 * Mengambil daftar institusi dengan paginasi dan filter opsional.
 */
export async function getInstitutes(
  input: Partial<GetInstitutesInput> = {},
): Promise<ActionResult<{ data: InstituteWithParent[]; total: number; page: number; perPage: number }>> {
  await requireRole(['superadmin'])

  const parsed = getInstitutesSchema.safeParse({
    page: input.page ?? 1,
    perPage: input.perPage ?? 10,
    search: input.search,
    type: input.type,
  })

  if (!parsed.success) {
    return { success: false, error: 'Parameter tidak valid.' }
  }

  const { page, perPage, search, type } = parsed.data
  const offset = (page - 1) * perPage

  try {
    // Build filter conditions
    const conditions = []
    if (search) {
      conditions.push(
        or(
          ilike(institutes.name, `%${search}%`),
          ilike(institutes.phone, `%${search}%`),
          ilike(institutes.address, `%${search}%`),
        ),
      )
    }
    if (type) {
      conditions.push(eq(institutes.type, type))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        address: institutes.address,
        phone: institutes.phone,
        email: institutes.email,
        image: institutes.image,
        establishedYear: institutes.establishedYear,
        type: institutes.type,
        parentId: institutes.parentId,
        createdAt: institutes.createdAt,
        updatedAt: institutes.updatedAt,
      })
      .from(institutes)
      .where(whereClause)
      .limit(perPage)
      .offset(offset)
      .orderBy(institutes.createdAt)

    // Ambil total count
    const totalResult = await db
      .select({ count: count() })
      .from(institutes)
      .where(whereClause)

    const total = totalResult[0]?.count ?? 0

    // Ambil semua parent names
    const parentIds = rows
      .map((r) => r.parentId)
      .filter((id): id is string => id !== null)

    let parentMap: Record<string, string> = {}
    if (parentIds.length > 0) {
      const parents = await db
        .select({ id: institutes.id, name: institutes.name })
        .from(institutes)
        .where(inArray(institutes.id, parentIds))

      parentMap = Object.fromEntries(parents.map((p) => [p.id, p.name]))
    }

    const data: InstituteWithParent[] = rows.map((row) => ({
      ...row,
      parentName: row.parentId ? (parentMap[row.parentId] ?? null) : null,
    }))

    return { success: true, data: { data, total, page, perPage } }
  } catch {
    return { success: false, error: 'Gagal mengambil data institusi. Silakan coba lagi.' }
  }
}

/**
 * Mengambil detail institusi berdasarkan ID.
 */
export async function getInstituteById(
  id: string,
): Promise<ActionResult<InstituteWithParent>> {
  await requireRole(['superadmin'])

  if (!id) {
    return { success: false, error: 'ID institusi tidak valid.' }
  }

  try {
    const rows = await db
      .select({
        id: institutes.id,
        name: institutes.name,
        address: institutes.address,
        phone: institutes.phone,
        email: institutes.email,
        image: institutes.image,
        establishedYear: institutes.establishedYear,
        type: institutes.type,
        parentId: institutes.parentId,
        createdAt: institutes.createdAt,
        updatedAt: institutes.updatedAt,
      })
      .from(institutes)
      .where(eq(institutes.id, id))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return { success: false, error: 'Institusi tidak ditemukan.' }
    }

    let parentName: string | null = null
    if (row.parentId) {
      const parentRows = await db
        .select({ name: institutes.name })
        .from(institutes)
        .where(eq(institutes.id, row.parentId))
        .limit(1)
      parentName = parentRows[0]?.name ?? null
    }

    return {
      success: true,
      data: { ...row, parentName },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil data institusi. Silakan coba lagi.' }
  }
}

/**
 * Mengambil daftar yayasan (tipe foundation) untuk dropdown pilih parent.
 */
export async function getFoundations(): Promise<ActionResult<{ id: string; name: string }[]>> {
  await requireRole(['superadmin'])

  try {
    const rows = await db
      .select({ id: institutes.id, name: institutes.name })
      .from(institutes)
      .where(eq(institutes.type, 'foundation'))
      .orderBy(institutes.name)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Gagal mengambil data yayasan.' }
  }
}

/**
 * Membuat institusi baru dan otomatis membuat record subapp.
 */
export async function createInstitute(
  input: CreateInstituteInput,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(['superadmin'])

  const parsed = createInstituteSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { name, address, phone, email, type, parentId, establishedYear, image } =
    parsed.data

  try {
    // Validasi: nama harus unik
    const existingName = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.name, name))
      .limit(1)

    if (existingName.length > 0) {
      return { success: false, error: 'Nama institusi sudah digunakan.' }
    }

    // Validasi: telepon harus unik
    const existingPhone = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.phone, phone))
      .limit(1)

    if (existingPhone.length > 0) {
      return { success: false, error: 'Nomor telepon sudah digunakan oleh institusi lain.' }
    }

    // Validasi: email harus unik (jika diisi)
    if (email) {
      const existingEmail = await db
        .select({ id: institutes.id })
        .from(institutes)
        .where(eq(institutes.email, email))
        .limit(1)

      if (existingEmail.length > 0) {
        return { success: false, error: 'Email sudah digunakan oleh institusi lain.' }
      }
    }

    // Validasi: parent harus bertipe foundation jika tipe school
    if (type === 'school' && parentId) {
      const parentRows = await db
        .select({ type: institutes.type })
        .from(institutes)
        .where(eq(institutes.id, parentId))
        .limit(1)

      if (!parentRows[0] || parentRows[0].type !== 'foundation') {
        return { success: false, error: 'Yayasan induk yang dipilih harus bertipe yayasan.' }
      }
    }

    // Buat slug untuk subapp key
    const baseSlug = slugify(name)
    let subappKey = baseSlug

    // Pastikan slug unik di tabel subapps
    const existingSubapp = await db
      .select({ key: subapps.key })
      .from(subapps)
      .where(eq(subapps.key, subappKey))
      .limit(1)

    if (existingSubapp.length > 0) {
      subappKey = `${baseSlug}-${Date.now()}`
    }

    // Buat institusi dan subapp dalam satu transaksi
    const result = await db.transaction(async (tx) => {
      const [newInstitute] = await tx
        .insert(institutes)
        .values({
          name,
          address,
          phone,
          email: email || null,
          type,
          parentId: parentId ?? null,
          establishedYear: establishedYear ?? null,
          image: image ?? null,
        })
        .returning({ id: institutes.id })

      if (!newInstitute) {
        throw new Error('Gagal membuat institusi.')
      }

      // Auto-create subapp record
      await tx.insert(subapps).values({
        key: subappKey,
        type: type === 'foundation' ? 'foundation' : 'school',
        name,
        image: image ?? null,
        instituteId: newInstitute.id,
      })

      return newInstitute
    })

    return { success: true, data: { id: result.id } }
  } catch {
    return { success: false, error: 'Gagal membuat institusi. Silakan coba lagi.' }
  }
}

/**
 * Memperbarui data institusi.
 */
export async function updateInstitute(
  id: string,
  input: UpdateInstituteInput,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(['superadmin'])

  if (!id) {
    return { success: false, error: 'ID institusi tidak valid.' }
  }

  const parsed = updateInstituteSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { name, address, phone, email, type, parentId, establishedYear, image, oldImage } =
    parsed.data

  try {
    // Pastikan institusi ada
    const existing = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Institusi tidak ditemukan.' }
    }

    // Validasi: nama harus unik (kecuali milik sendiri)
    const existingName = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.name, name))
      .limit(1)

    if (existingName.length > 0 && existingName[0]?.id !== id) {
      return { success: false, error: 'Nama institusi sudah digunakan.' }
    }

    // Validasi: telepon harus unik (kecuali milik sendiri)
    const existingPhone = await db
      .select({ id: institutes.id })
      .from(institutes)
      .where(eq(institutes.phone, phone))
      .limit(1)

    if (existingPhone.length > 0 && existingPhone[0]?.id !== id) {
      return { success: false, error: 'Nomor telepon sudah digunakan oleh institusi lain.' }
    }

    // Validasi: email harus unik (jika diisi, kecuali milik sendiri)
    if (email) {
      const existingEmail = await db
        .select({ id: institutes.id })
        .from(institutes)
        .where(eq(institutes.email, email))
        .limit(1)

      if (existingEmail.length > 0 && existingEmail[0]?.id !== id) {
        return { success: false, error: 'Email sudah digunakan oleh institusi lain.' }
      }
    }

    // Validasi: parent harus bertipe foundation jika tipe school
    if (type === 'school' && parentId) {
      const parentRows = await db
        .select({ type: institutes.type })
        .from(institutes)
        .where(eq(institutes.id, parentId))
        .limit(1)

      if (!parentRows[0] || parentRows[0].type !== 'foundation') {
        return { success: false, error: 'Yayasan induk yang dipilih harus bertipe yayasan.' }
      }
    }

    await db
      .update(institutes)
      .set({
        name,
        address,
        phone,
        email: email || null,
        type,
        parentId: parentId ?? null,
        establishedYear: establishedYear ?? null,
        image: image ?? null,
        updatedAt: new Date(),
      })
      .where(eq(institutes.id, id))

    // Hapus logo lama dari Uploadthing jika diganti
    if (oldImage && image && oldImage !== image) {
      const fileKey = extractFileKey(oldImage)
      if (fileKey) {
        await utapi.deleteFiles(fileKey).catch(() => null)
      }
    }

    // Update nama dan gambar di subapp terkait
    await db
      .update(subapps)
      .set({
        name,
        image: image ?? null,
        updatedAt: new Date(),
      })
      .where(eq(subapps.instituteId, id))

    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal memperbarui institusi. Silakan coba lagi.' }
  }
}

/**
 * Menonaktifkan institusi — diblokir jika masih ada staf atau siswa aktif.
 */
export async function deactivateInstitute(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(['superadmin'])

  if (!id) {
    return { success: false, error: 'ID institusi tidak valid.' }
  }

  try {
    // Pastikan institusi ada
    const existing = await db
      .select({ id: institutes.id, name: institutes.name })
      .from(institutes)
      .where(eq(institutes.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Institusi tidak ditemukan.' }
    }

    // Cek staf aktif
    const activeStaff = await db
      .select({ count: count() })
      .from(staffs)
      .where(and(eq(staffs.instituteId, id), eq(staffs.status, 'active')))

    if ((activeStaff[0]?.count ?? 0) > 0) {
      return {
        success: false,
        error: `Institusi tidak dapat dinonaktifkan karena masih memiliki ${activeStaff[0]?.count} staf aktif.`,
      }
    }

    // Cek siswa aktif
    const activeStudents = await db
      .select({ count: count() })
      .from(students)
      .where(and(eq(students.instituteId, id), eq(students.status, 'active')))

    if ((activeStudents[0]?.count ?? 0) > 0) {
      return {
        success: false,
        error: `Institusi tidak dapat dinonaktifkan karena masih memiliki ${activeStudents[0]?.count} siswa aktif.`,
      }
    }

    // Nonaktifkan institusi
    await db
      .update(institutes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(institutes.id, id))

    revalidatePath('/superadmin/institutes')
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal memproses permintaan. Silakan coba lagi.' }
  }
}
