'use server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { UTApi } from 'uploadthing/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const utapi = new UTApi()

/**
 * Mengekstrak file key dari URL Uploadthing.
 * Format URL: https://{appId}.ufs.sh/f/{fileKey}
 */
function extractFileKey(url: string): string | null {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/')
    // Pathname: /f/{fileKey}
    const fIndex = segments.indexOf('f')
    if (fIndex !== -1 && segments[fIndex + 1]) {
      return segments[fIndex + 1]
    }
    return null
  } catch {
    return null
  }
}

// ---- Schemas ----

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z
      .string()
      .min(8, 'Password baru minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })

// ---- Types ----

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ---- Server Actions ----

/**
 * Memperbarui nama dan email pengguna yang sedang login.
 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ActionResult<{ name: string; email: string }>> {
  const session = await requireAuth()

  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { name, email } = parsed.data

  try {
    // Cek apakah email sudah dipakai user lain
    if (email !== session.user.email) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existing.length > 0 && existing[0]?.id !== session.user.id) {
        return { success: false, error: 'Email sudah digunakan oleh akun lain.' }
      }
    }

    await db
      .update(users)
      .set({
        name,
        email,
        // Jika email berubah, reset emailVerified
        emailVerified: email === session.user.email ? undefined : false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return { success: true, data: { name, email } }
  } catch {
    return { success: false, error: 'Gagal memperbarui profil. Silakan coba lagi.' }
  }
}

/**
 * Memperbarui avatar pengguna. Avatar lama dihapus dari Uploadthing.
 * @param newUrl - URL avatar baru dari Uploadthing
 * @param oldUrl - URL avatar lama (akan dihapus)
 */
export async function updateAvatar(
  newUrl: string,
  oldUrl: string | null,
): Promise<ActionResult<{ avatarUrl: string }>> {
  const session = await requireAuth()

  if (!newUrl || !newUrl.startsWith('http')) {
    return { success: false, error: 'URL avatar tidak valid.' }
  }

  try {
    await db
      .update(users)
      .set({ avatar: newUrl, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))

    // Hapus avatar lama dari Uploadthing setelah DB berhasil diupdate
    if (oldUrl) {
      const fileKey = extractFileKey(oldUrl)
      if (fileKey) {
        // Tidak throw jika penghapusan gagal — DB sudah diupdate
        await utapi.deleteFiles(fileKey).catch(() => null)
      }
    }

    return { success: true, data: { avatarUrl: newUrl } }
  } catch {
    return { success: false, error: 'Gagal memperbarui avatar. Silakan coba lagi.' }
  }
}

/**
 * Mengubah password pengguna. Password lama diverifikasi via Better Auth.
 */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  await requireAuth()

  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Data tidak valid.' }
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const currentHeaders = await headers()

    await auth.api.changePassword({
      headers: currentHeaders,
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      },
    })

    return { success: true, data: undefined }
  } catch (err: unknown) {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
        return { success: false, error: 'Password lama tidak sesuai.' }
      }
    }
    return { success: false, error: 'Gagal mengubah password. Pastikan password lama sudah benar.' }
  }
}

/**
 * Mengakhiri sesi aktif berdasarkan token sesi.
 */
export async function revokeSession(token: string): Promise<ActionResult> {
  await requireAuth()

  if (!token) {
    return { success: false, error: 'Token sesi tidak valid.' }
  }

  try {
    const currentHeaders = await headers()

    await auth.api.revokeSession({
      headers: currentHeaders,
      body: { token },
    })

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Gagal mengakhiri sesi. Silakan coba lagi.' }
  }
}

/**
 * Mengambil daftar sesi aktif milik pengguna yang sedang login.
 */
export async function getActiveSessions(): Promise<
  ActionResult<
    {
      id: string
      token: string
      ipAddress: string | null | undefined
      userAgent: string | null | undefined
      createdAt: Date
      expiresAt: Date
    }[]
  >
> {
  await requireAuth()

  try {
    const currentHeaders = await headers()

    const sessions = await auth.api.listSessions({
      headers: currentHeaders,
    })

    const mapped = sessions.map((s) => ({
      id: s.id,
      token: s.token,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }))

    return { success: true, data: mapped }
  } catch {
    return { success: false, error: 'Gagal mengambil daftar sesi aktif.' }
  }
}
