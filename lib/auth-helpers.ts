import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { auth } from './auth'
import { db } from './db'
import { staffs, subapps, userSubapps } from './db/schema'

export type UserRole = 'superadmin' | 'user'

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
 * Memvalidasi bahwa pengguna memiliki akses ke SubApp tertentu berdasarkan key-nya.
 * Superadmin dapat mengakses semua SubApp tanpa pengecekan tabel user_subapps.
 * User biasa hanya dapat mengakses SubApp yang terdaftar di tabel user_subapps.
 *
 * @param subappKey - Key unik SubApp dari URL (misal: 'yayasan-al-ikhlas')
 * @returns Objek berisi session dan data subapp yang diakses
 * @throws Error jika belum login, SubApp tidak ditemukan, atau tidak memiliki akses
 */
export async function requireSubappAccess(subappKey: string) {
  const session = await requireAuth()

  const userRole = (session.user as { role?: string }).role as UserRole | undefined

  // Superadmin bypass — akses semua SubApp
  if (userRole === 'superadmin') {
    const subapp = await db.query.subapps.findFirst({
      where: eq(subapps.key, subappKey),
    })

    if (!subapp) {
      throw new Error('Sub-aplikasi tidak ditemukan.')
    }

    return { session, subapp }
  }

  // User biasa — cek hak akses di tabel user_subapps
  const access = await db
    .select({ subapp: subapps })
    .from(userSubapps)
    .innerJoin(subapps, eq(userSubapps.subappId, subapps.id))
    .where(
      and(
        eq(userSubapps.userId, session.user.id),
        eq(subapps.key, subappKey),
      ),
    )
    .limit(1)

  if (!access[0]) {
    throw new Error('Anda tidak memiliki akses ke sub-aplikasi ini.')
  }

  return { session, subapp: access[0].subapp }
}

/**
 * Mengambil semua SubApp yang dapat diakses oleh user tertentu.
 * Digunakan untuk menampilkan daftar SubApp di UI switcher.
 *
 * @param userId - ID user dari session
 * @returns Array SubApp yang dapat diakses user
 */
export async function getUserSubapps(userId: string) {
  const session = await requireAuth()

  const userRole = (session.user as { role?: string }).role as UserRole | undefined

  // Superadmin dapat melihat semua SubApp
  if (userRole === 'superadmin') {
    return db.query.subapps.findMany()
  }

  // User biasa — return dari join user_subapps + subapps
  const result = await db
    .select({ subapp: subapps })
    .from(userSubapps)
    .innerJoin(subapps, eq(userSubapps.subappId, subapps.id))
    .where(eq(userSubapps.userId, userId))

  return result.map((r) => r.subapp)
}

/**
 * @deprecated Gunakan requireSubappAccess(subappKey) sebagai pengganti.
 * Helper lama untuk mendapatkan instituteId dari tabel staffs.
 * Fungsi ini tidak lagi relevan setelah migrasi RBAC ke SubApp-based access control.
 *
 * @param _userId - ID user (tidak digunakan)
 * @returns null selalu
 */
export async function getUserInstituteId(_userId: string): Promise<string | null> {
  console.warn(
    '[DEPRECATED] getUserInstituteId sudah deprecated. Gunakan requireSubappAccess(subappKey) sebagai pengganti.',
  )
  return null
}

