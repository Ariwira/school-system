/**
 * Setup global mocks untuk Vitest.
 * File ini dijalankan sebelum setiap test file.
 *
 * Semua dependencies yang memerlukan runtime Next.js (headers, cache, dsb)
 * di-mock di sini agar test dapat berjalan secara murni sebagai unit test.
 *
 * Catatan: vi.mock di sini bersifat global. Setiap test file yang memerlukan
 * perilaku berbeda dapat override dengan vi.mock lokal.
 */
import { vi } from 'vitest'

// Mock next/headers — dipakai oleh auth-helpers dan Server Actions
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Mock next/cache — dipakai oleh revalidatePath di Server Actions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock uploadthing/server — UTApi bukan class yang sesungguhnya di test
vi.mock('uploadthing/server', () => {
  function UTApi() {
    return {
      deleteFiles: vi.fn().mockResolvedValue(undefined),
    }
  }
  return { UTApi }
})
