/**
 * Seed script — buat akun superadmin untuk development
 *
 * Jalankan dengan:
 *   pnpm seed
 */

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { users } from '../lib/db/schema'
import { auth } from '../lib/auth'

const SUPERADMIN_EMAIL = 'superadmin@school-erp.dev'
const SUPERADMIN_PASSWORD = 'superadmin123'
const SUPERADMIN_NAME = 'Super Admin'

async function seed() {
  console.log('🌱 Memulai seed...')

  // Cek apakah superadmin sudah ada
  const existing = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, SUPERADMIN_EMAIL))
    .limit(1)

  if (existing[0]) {
    console.log(`✅ Superadmin sudah ada: ${SUPERADMIN_EMAIL}`)
    process.exit(0)
  }

  // Buat user via Better Auth API (agar password di-hash dengan benar)
  const result = await auth.api.signUpEmail({
    body: {
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
    },
  })

  if (!result?.user?.id) {
    console.error('❌ Gagal membuat user superadmin')
    process.exit(1)
  }

  // Update role ke superadmin
  await db
    .update(users)
    .set({ role: 'superadmin', emailVerified: true })
    .where(eq(users.id, result.user.id))

  console.log('✅ Superadmin berhasil dibuat!')
  console.log(`   Email    : ${SUPERADMIN_EMAIL}`)
  console.log(`   Password : ${SUPERADMIN_PASSWORD}`)
  console.log('')
  console.log('⚠️  Ganti password setelah login pertama.')

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed gagal:', err)
  process.exit(1)
})
