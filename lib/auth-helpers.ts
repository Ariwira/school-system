import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { auth } from './auth'
import { db } from './db'
import { staffs, subapps, userSubapps } from './db/schema'

export type UserRole = 'superadmin' | 'foundation' | 'school'

/**
 * Memastikan pengguna sudah login. Melempar error jika belum.
 * Gunakan di awal setiap Server Action yang memerlukan autentikasi.
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    throw new Error('Anda harus login untuk mengakses fitur ini.')
  }

  return session
}

/**
 * Memastikan pengguna sudah login dan memiliki salah satu role yang diizinkan.
 * Melempar error jika belum login atau role tidak sesuai.
 *
 * @param roles - Daftar role yang diizinkan
 */
export async function requireRole(roles: Array<UserRole>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    throw new Error('Anda harus login untuk mengakses fitur ini.')
  }

  const userRole = (session.user as { role?: string }).role as UserRole | undefined

  if (!userRole || !roles.includes(userRole)) {
    throw new Error('Anda tidak memiliki izin untuk mengakses fitur ini.')
  }

  return session
}

/**
 * Mendapatkan instituteId dari tabel staffs berdasarkan userId.
 * Gunakan ini untuk data isolation pada Foundation/School user.
 *
 * @param userId - ID user dari session
 * @returns instituteId string atau null jika tidak ditemukan
 */
export async function getUserInstituteId(userId: string): Promise<string | null> {
  const result = await db
    .select({ instituteId: staffs.instituteId })
    .from(staffs)
    .where(eq(staffs.userId, userId))
    .limit(1)

  return result[0]?.instituteId ?? null
}

/**
 * Mengambil semua SubApp yang dapat diakses oleh user tertentu.
 * Superadmin dapat melihat semua SubApp. User biasa hanya SubApp yang terdaftar.
 *
 * @param userId - ID user dari session
 * @returns Array SubApp yang dapat diakses user beserta session
 */
export async function getUserSubapps(userId: string) {
  const session = await requireAuth()

  const userRole = (session.user as { role?: string }).role as UserRole | undefined

  // Superadmin dapat melihat semua SubApp
  if (userRole === 'superadmin') {
    const all = await db.query.subapps.findMany()
    return all
  }

  // User biasa — return dari join user_subapps + subapps
  const result = await db
    .select({ subapp: subapps })
    .from(userSubapps)
    .innerJoin(subapps, eq(userSubapps.subappId, subapps.id))
    .where(and(eq(userSubapps.userId, userId)))

  return result.map((r) => r.subapp)
}
