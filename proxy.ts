import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

type UserRole = 'superadmin' | 'user'

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]

const AUTH_REDIRECT_ROUTES = ['/login', '/register']

/**
 * Ekstrak subapp key dari pathname untuk pola /foundation/{key}/* atau /school/{key}/*.
 * Mengembalikan key jika ditemukan, atau null jika tidak cocok.
 */
function extractSubappKey(pathname: string): string | null {
  const match = pathname.match(/^\/(?:foundation|school)\/([^/]+)(?:\/|$)/)
  return match ? match[1] : null
}

/**
 * Periksa apakah user memiliki akses ke subapp tertentu melalui query DB.
 * Dipanggil hanya untuk user biasa (non-superadmin).
 */
async function hasSubappAccess(userId: string, subappKey: string): Promise<boolean> {
  // Import dinamis untuk menghindari bundling DB di edge runtime
  // Middleware berjalan di Node.js runtime (bukan Edge)
  const { db } = await import('@/lib/db')
  const { userSubapps, subapps } = await import('@/lib/db/schema')
  const { eq, and } = await import('drizzle-orm')

  const result = await db
    .select({ id: userSubapps.id })
    .from(userSubapps)
    .innerJoin(subapps, eq(userSubapps.subappId, subapps.id))
    .where(
      and(
        eq(userSubapps.userId, userId),
        eq(subapps.key, subappKey),
      ),
    )
    .limit(1)

  return result.length > 0
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ambil session dari cookie melalui better-auth
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
  try {
    session = await auth.api.getSession({ headers: request.headers })
  } catch {
    // Jika gagal membaca session, anggap tidak ada session
    session = null
  }

  const isAuthenticated = !!session?.user
  const userRole = isAuthenticated
    ? ((session!.user as { role?: string }).role as UserRole | undefined)
    : undefined

  // Jika sudah login dan mengakses halaman auth (login/register) → redirect ke /
  if (isAuthenticated && AUTH_REDIRECT_ROUTES.some((r) => pathname === r)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Jika belum login dan mengakses route yang dilindungi → redirect ke /login
  if (!isAuthenticated && !PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah login, periksa akses berdasarkan konteks path
  if (isAuthenticated && userRole) {
    // /superadmin/* → hanya superadmin
    if (pathname.startsWith('/superadmin')) {
      if (userRole !== 'superadmin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // /foundation/{key}/* atau /school/{key}/* → cek akses ke subapp
    else if (pathname.startsWith('/foundation/') || pathname.startsWith('/school/')) {
      const subappKey = extractSubappKey(pathname)

      if (subappKey) {
        // Superadmin bypass — akses semua SubApp
        if (userRole !== 'superadmin') {
          // User biasa — verifikasi akses ke SubApp dari DB
          const allowed = await hasSubappAccess(session!.user.id, subappKey)
          if (!allowed) {
            return NextResponse.redirect(new URL('/', request.url))
          }
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali:
     * - _next/static (file statis Next.js)
     * - _next/image (optimasi gambar)
     * - favicon.ico
     * - api/auth (Better Auth handler)
     * - api/uploadthing (Uploadthing handler)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/auth|api/uploadthing).*)',
  ],
}
