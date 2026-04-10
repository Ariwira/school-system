'use server'

import { and, count, eq, ilike, isNotNull, ne, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireRole, requireSubappAccess } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { institutes, staffs, transfers, users } from '@/lib/db/schema'
import {
  createStaffSchema,
  updateStaffSchema,
  getStaffsSchema,
  type StaffStatus,
  type StaffDepartment,
  type CreateStaffInput,
  type UpdateStaffInput,
  type GetStaffsInput,
  type StaffWithUser,
  type ActionResult,
} from '@/lib/validations/staff'

// ---- Helpers ----

function revalidateStaffPaths(instituteId?: string) {
  revalidatePath('/superadmin/staffs')
  if (instituteId) {
    // Revalidate will be done by callers as they have subAppKey context
  }
}

// ---- Server Actions ----

/**
 * Mengambil daftar staf dengan paginasi dan filter opsional.
 * Superadmin dapat melihat semua staf; foundation/school hanya staf di institusinya.
 */
export async function getStaffs(
  input: Partial<GetStaffsInput> = {},
  subAppKey?: string,
): Promise<ActionResult<{ data: StaffWithUser[]; total: number; page: number; perPage: number }>> {
  let scopedInstituteId: string | undefined

  if (subAppKey) {
    // foundation/school route — scope ke institusi subapp
    const { subapp } = await requireSubappAccess(subAppKey)
    scopedInstituteId = subapp.instituteId ?? undefined
  } else {
    // superadmin route
    await requireRole(['superadmin'])
    scopedInstituteId = input.instituteId
  }

  const parsed = getStaffsSchema.safeParse({
    page: input.page ?? 1,
    perPage: input.perPage ?? 10,
    search: input.search,
    status: input.status,
    department: input.department,
    instituteId: scopedInstituteId,
  })

  if (!parsed.success) {
    return { success: false, error: 'Parameter tidak valid.' }
  }

  const { page, perPage, search, status, department } = parsed.data
  const offset = (page - 1) * perPage

  try {
    const conditions = []

    if (scopedInstituteId) {
      conditions.push(eq(staffs.instituteId, scopedInstituteId))
    }

    if (status) {
      conditions.push(eq(staffs.status, status as StaffStatus))
    }

    if (department) {
      conditions.push(eq(staffs.department, department as StaffDepartment))
    }

    if (search) {
      conditions.push(
        or(
          ilike(staffs.name, `%${search}%`),
          ilike(staffs.staffNumber, `%${search}%`),
          ilike(staffs.email, `%${search}%`),
          ilike(staffs.phone, `%${search}%`),
        ),
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: staffs.id,
        userId: staffs.userId,
        instituteId: staffs.instituteId,
        instituteName: institutes.name,
        name: staffs.name,
        nik: staffs.nik,
        staffNumber: staffs.staffNumber,
        phone: staffs.phone,
        email: staffs.email,
        gender: staffs.gender,
        dob: staffs.dob,
        pob: staffs.pob,
        department: staffs.department,
        joinDate: staffs.joinDate,
        status: staffs.status,
        userName: users.name,
        userEmail: users.email,
        createdAt: staffs.createdAt,
        updatedAt: staffs.updatedAt,
      })
      .from(staffs)
      .innerJoin(institutes, eq(staffs.instituteId, institutes.id))
      .leftJoin(users, eq(staffs.userId, users.id))
      .where(whereClause)
      .limit(perPage)
      .offset(offset)
      .orderBy(staffs.createdAt)

    const totalResult = await db
      .select({ count: count() })
      .from(staffs)
      .where(whereClause)

    const total = totalResult[0]?.count ?? 0

    const data: StaffWithUser[] = rows.map((row) => ({
      ...row,
      instituteName: row.instituteName ?? '',
      userName: row.userName ?? null,
      userEmail: row.userEmail ?? null,
    }))

    return { success: true, data: { data, total, page, perPage } }
  } catch {
    return { success: false, error: 'Gagal mengambil data staf. Silakan coba lagi.' }
  }
}

/**
 * Mengambil detail staf berdasarkan ID.
 */
export async function getStaffById(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<StaffWithUser>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID staf tidak valid.' }
  }

  try {
    const rows = await db
      .select({
        id: staffs.id,
        userId: staffs.userId,
        instituteId: staffs.instituteId,
        instituteName: institutes.name,
        name: staffs.name,
        nik: staffs.nik,
        staffNumber: staffs.staffNumber,
        phone: staffs.phone,
        email: staffs.email,
        gender: staffs.gender,
        dob: staffs.dob,
        pob: staffs.pob,
        department: staffs.department,
        joinDate: staffs.joinDate,
        status: staffs.status,
        userName: users.name,
        userEmail: users.email,
        createdAt: staffs.createdAt,
        updatedAt: staffs.updatedAt,
      })
      .from(staffs)
      .innerJoin(institutes, eq(staffs.instituteId, institutes.id))
      .leftJoin(users, eq(staffs.userId, users.id))
      .where(eq(staffs.id, id))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return { success: false, error: 'Staf tidak ditemukan.' }
    }

    return {
      success: true,
      data: {
        ...row,
        instituteName: row.instituteName ?? '',
        userName: row.userName ?? null,
        userEmail: row.userEmail ?? null,
      },
    }
  } catch {
    return { success: false, error: 'Gagal mengambil data staf. Silakan coba lagi.' }
  }
}

/**
 * Membuat staf baru.
 */
export async function createStaff(
  input: CreateStaffInput,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  let scopedInstituteId: string

  if (subAppKey) {
    const { subapp } = await requireSubappAccess(subAppKey)
    if (!subapp.instituteId) {
      return { success: false, error: 'Sub-aplikasi tidak terhubung ke institusi.' }
    }
    scopedInstituteId = subapp.instituteId
  } else {
    await requireRole(['superadmin'])
    scopedInstituteId = input.instituteId
  }

  const parsed = createStaffSchema.safeParse({ ...input, instituteId: scopedInstituteId })
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { name, nik, staffNumber, phone, email, gender, dob, pob, department, joinDate, status } =
    parsed.data

  try {
    // Validasi: NIK unik jika diisi
    if (nik) {
      const existingNik = await db
        .select({ id: staffs.id })
        .from(staffs)
        .where(eq(staffs.nik, nik))
        .limit(1)

      if (existingNik.length > 0) {
        return { success: false, error: 'NIK sudah digunakan oleh staf lain.' }
      }
    }

    // Validasi: nomor staf unik
    const existingStaffNumber = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(eq(staffs.staffNumber, staffNumber))
      .limit(1)

    if (existingStaffNumber.length > 0) {
      return { success: false, error: 'Nomor staf sudah digunakan.' }
    }

    // Validasi: email unik
    const existingEmail = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(eq(staffs.email, email))
      .limit(1)

    if (existingEmail.length > 0) {
      return { success: false, error: 'Email sudah digunakan oleh staf lain.' }
    }

    // Validasi: telepon unik
    const existingPhone = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(eq(staffs.phone, phone))
      .limit(1)

    if (existingPhone.length > 0) {
      return { success: false, error: 'Nomor telepon sudah digunakan oleh staf lain.' }
    }

    const [newStaff] = await db
      .insert(staffs)
      .values({
        instituteId: scopedInstituteId,
        name,
        nik: nik || null,
        staffNumber,
        phone,
        email,
        gender,
        dob,
        pob: pob || null,
        department,
        joinDate: joinDate || null,
        status,
      })
      .returning({ id: staffs.id })

    if (!newStaff) {
      return { success: false, error: 'Gagal membuat staf.' }
    }

    revalidateStaffPaths(scopedInstituteId)
    return { success: true, data: { id: newStaff.id } }
  } catch {
    return { success: false, error: 'Gagal membuat staf. Silakan coba lagi.' }
  }
}

/**
 * Memperbarui data staf.
 */
export async function updateStaff(
  id: string,
  input: UpdateStaffInput,
  subAppKey?: string,
): Promise<ActionResult<{ id: string }>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID staf tidak valid.' }
  }

  const parsed = updateStaffSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { name, nik, staffNumber, phone, email, gender, dob, pob, department, joinDate, status } =
    parsed.data

  try {
    // Pastikan staf ada
    const existing = await db
      .select({ id: staffs.id, instituteId: staffs.instituteId })
      .from(staffs)
      .where(eq(staffs.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Staf tidak ditemukan.' }
    }

    // Validasi: NIK unik jika diisi (kecuali milik sendiri)
    if (nik) {
      const existingNik = await db
        .select({ id: staffs.id })
        .from(staffs)
        .where(and(eq(staffs.nik, nik), ne(staffs.id, id)))
        .limit(1)

      if (existingNik.length > 0) {
        return { success: false, error: 'NIK sudah digunakan oleh staf lain.' }
      }
    }

    // Validasi: nomor staf unik (kecuali milik sendiri)
    const existingStaffNumber = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(and(eq(staffs.staffNumber, staffNumber), ne(staffs.id, id)))
      .limit(1)

    if (existingStaffNumber.length > 0) {
      return { success: false, error: 'Nomor staf sudah digunakan.' }
    }

    // Validasi: email unik (kecuali milik sendiri)
    const existingEmail = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(and(eq(staffs.email, email), ne(staffs.id, id)))
      .limit(1)

    if (existingEmail.length > 0) {
      return { success: false, error: 'Email sudah digunakan oleh staf lain.' }
    }

    // Validasi: telepon unik (kecuali milik sendiri)
    const existingPhone = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(and(eq(staffs.phone, phone), ne(staffs.id, id)))
      .limit(1)

    if (existingPhone.length > 0) {
      return { success: false, error: 'Nomor telepon sudah digunakan oleh staf lain.' }
    }

    await db
      .update(staffs)
      .set({
        name,
        nik: nik || null,
        staffNumber,
        phone,
        email,
        gender,
        dob,
        pob: pob || null,
        department,
        joinDate: joinDate || null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(staffs.id, id))

    revalidateStaffPaths(existing[0].instituteId)
    return { success: true, data: { id } }
  } catch {
    return { success: false, error: 'Gagal memperbarui staf. Silakan coba lagi.' }
  }
}

/**
 * Toggle status staf: active ↔ inactive.
 */
export async function toggleStaffStatus(
  id: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!id) {
    return { success: false, error: 'ID staf tidak valid.' }
  }

  try {
    const existing = await db
      .select({ id: staffs.id, status: staffs.status, instituteId: staffs.instituteId })
      .from(staffs)
      .where(eq(staffs.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Staf tidak ditemukan.' }
    }

    const currentStatus = existing[0].status
    // Toggle: active → inactive, inactive → active, resigned tetap resigned
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    await db
      .update(staffs)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(staffs.id, id))

    revalidateStaffPaths(existing[0].instituteId)
    return { success: true, data: { id, status: newStatus } }
  } catch {
    return { success: false, error: 'Gagal mengubah status staf. Silakan coba lagi.' }
  }
}

/**
 * Menghubungkan akun user ke staf.
 * Validasi: user belum punya staf di institusi yang sama.
 */
export async function linkUserAccount(
  staffId: string,
  userId: string,
  subAppKey?: string,
): Promise<ActionResult<{ staffId: string }>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!staffId || !userId) {
    return { success: false, error: 'ID staf atau user tidak valid.' }
  }

  try {
    // Ambil data staf termasuk instituteId
    const staff = await db
      .select({ id: staffs.id, userId: staffs.userId, instituteId: staffs.instituteId })
      .from(staffs)
      .where(eq(staffs.id, staffId))
      .limit(1)

    if (!staff[0]) {
      return { success: false, error: 'Staf tidak ditemukan.' }
    }

    if (staff[0].userId !== null) {
      return { success: false, error: 'Staf sudah terhubung ke akun user.' }
    }

    // Validasi: user ada
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user[0]) {
      return { success: false, error: 'User tidak ditemukan.' }
    }

    // Validasi: user belum punya staf di institusi yang sama
    const existingStaffAtInstitute = await db
      .select({ id: staffs.id })
      .from(staffs)
      .where(
        and(
          eq(staffs.userId, userId),
          eq(staffs.instituteId, staff[0].instituteId),
          ne(staffs.id, staffId),
        ),
      )
      .limit(1)

    if (existingStaffAtInstitute.length > 0) {
      return {
        success: false,
        error: 'User ini sudah terhubung ke staf lain di institusi yang sama.',
      }
    }

    await db
      .update(staffs)
      .set({ userId, updatedAt: new Date() })
      .where(eq(staffs.id, staffId))

    revalidateStaffPaths(staff[0].instituteId)
    return { success: true, data: { staffId } }
  } catch {
    return { success: false, error: 'Gagal menghubungkan akun. Silakan coba lagi.' }
  }
}

/**
 * Memutus hubungan akun user dari staf.
 */
export async function unlinkUserAccount(
  staffId: string,
  subAppKey?: string,
): Promise<ActionResult<{ staffId: string }>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!staffId) {
    return { success: false, error: 'ID staf tidak valid.' }
  }

  try {
    const staff = await db
      .select({ id: staffs.id, userId: staffs.userId, instituteId: staffs.instituteId })
      .from(staffs)
      .where(eq(staffs.id, staffId))
      .limit(1)

    if (!staff[0]) {
      return { success: false, error: 'Staf tidak ditemukan.' }
    }

    if (staff[0].userId === null) {
      return { success: false, error: 'Staf tidak terhubung ke akun user manapun.' }
    }

    await db
      .update(staffs)
      .set({ userId: null, updatedAt: new Date() })
      .where(eq(staffs.id, staffId))

    revalidateStaffPaths(staff[0].instituteId)
    return { success: true, data: { staffId } }
  } catch {
    return { success: false, error: 'Gagal memutus hubungan akun. Silakan coba lagi.' }
  }
}

/**
 * Mengambil daftar user yang tersedia untuk di-link ke staf.
 * Hanya user yang belum punya staf di institusi yang sama.
 */
export async function getAvailableUsers(
  instituteId: string,
  subAppKey?: string,
): Promise<ActionResult<{ id: string; name: string; email: string }[]>> {
  if (subAppKey) {
    await requireSubappAccess(subAppKey)
  } else {
    await requireRole(['superadmin'])
  }

  if (!instituteId) {
    return { success: false, error: 'ID institusi tidak valid.' }
  }

  try {
    // Ambil user_id yang sudah punya staf di institusi ini
    const existingUserIds = await db
      .select({ userId: staffs.userId })
      .from(staffs)
      .where(and(eq(staffs.instituteId, instituteId), isNotNull(staffs.userId)))

    const usedIds = existingUserIds
      .map((r) => r.userId)
      .filter((id): id is string => id !== null)

    // Ambil semua users yang belum terpakai di institusi ini
    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .orderBy(users.name)

    const available = allUsers.filter((u) => !usedIds.includes(u.id))

    return { success: true, data: available }
  } catch {
    return { success: false, error: 'Gagal mengambil daftar user. Silakan coba lagi.' }
  }
}

/**
 * Cek apakah staf dapat dihapus (tidak terlibat transfer pending).
 */
export async function checkStaffDeletable(
  id: string,
): Promise<ActionResult<{ deletable: boolean; reason?: string }>> {
  await requireRole(['superadmin'])

  try {
    const pendingTransfers = await db
      .select({ count: count() })
      .from(transfers)
      .where(
        and(
          eq(transfers.status, 'pending'),
          or(
            eq(transfers.issuerId, id),
            eq(transfers.senderId, id),
          ),
        ),
      )

    const pendingCount = pendingTransfers[0]?.count ?? 0

    if (pendingCount > 0) {
      return {
        success: true,
        data: {
          deletable: false,
          reason: `Staf tidak dapat dihapus karena terlibat dalam ${pendingCount} transfer berstatus pending.`,
        },
      }
    }

    return { success: true, data: { deletable: true } }
  } catch {
    return { success: false, error: 'Gagal memeriksa data staf.' }
  }
}

/**
 * Mengambil daftar institusi untuk dropdown (superadmin only).
 */
export async function getInstitutesForStaff(): Promise<
  ActionResult<{ id: string; name: string; type: string }[]>
> {
  await requireRole(['superadmin'])

  try {
    const rows = await db
      .select({ id: institutes.id, name: institutes.name, type: institutes.type })
      .from(institutes)
      .orderBy(institutes.name)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Gagal mengambil data institusi.' }
  }
}

