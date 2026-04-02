import { genUploader } from 'uploadthing/client'
import type { OurFileRouter } from './uploadthing'

/**
 * Typed uploader untuk digunakan di client components.
 * Ekspor `uploadFiles` dan `routeRegistry` yang sudah ter-type sesuai OurFileRouter.
 *
 * Contoh penggunaan:
 * ```ts
 * import { uploadFiles } from '@/lib/uploadthing-client'
 * const [res] = await uploadFiles('avatarUploader', { files: [file] })
 * ```
 */
export const { uploadFiles, createUpload, routeRegistry } =
  genUploader<OurFileRouter>({
    package: '@uploadthing/react',
  })

export type { OurFileRouter }
