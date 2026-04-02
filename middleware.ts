import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

type UserRole = 'superadmin' | 'foundation' | 'school'

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]

const AUTH_REDIRECT_ROUTES = ['/login', '/register']

const ROLE_PROTECTED_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/superadmin', roles: ['superadmin'] },
  { prefix: '/foundation', roles: ['foundation', 'superadmin'] },
  { prefix: '/school', roles: ['school', 'superadmin'] },
]

export async function middleware(request: NextRequest) {
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

  // Jika sudah login, periksa akses berdasarkan role
  if (isAuthenticated && userRole) {
    for (const { prefix, roles } of ROLE_PROTECTED_PREFIXES) {
      if (pathname.startsWith(prefix)) {
        if (!roles.includes(userRole)) {
          return NextResponse.redirect(new URL('/', request.url))
        }
        break
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
