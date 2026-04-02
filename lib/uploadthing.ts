import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from './auth'
import { headers } from 'next/headers'

const f = createUploadthing()

/**
 * Mendapatkan session pengguna yang sedang login.
 * Melempar error jika belum login.
 */
async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    throw new Error('Anda harus login untuk mengupload file.')
  }

  return session.user
}

export const uploadRouter = {
  /**
   * Uploader untuk avatar pengguna.
   * Tipe: JPG, PNG, WebP — maksimum 2MB
   * Dipakai untuk: users.avatar
   */
  avatarUploader: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const user = await getAuthenticatedUser()
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  /**
   * Uploader untuk logo/gambar institusi.
   * Tipe: JPG, PNG, WebP — maksimum 4MB
   * Dipakai untuk: institutes.image
   */
  instituteImageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const user = await getAuthenticatedUser()
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  /**
   * Uploader untuk bukti transfer dan bukti pembayaran SPP.
   * Tipe: image (4MB) atau PDF (8MB) — maksimum 1 file
   * Dipakai untuk: transfers & fee_payments
   */
  receiptUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const user = await getAuthenticatedUser()
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof uploadRouter
