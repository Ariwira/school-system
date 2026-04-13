import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'

/**
 * Root dashboard layout — hanya auth guard.
 * Sidebar dan Header dirender masing-masing oleh subpath layout:
 *   - /superadmin/...             → superadmin/layout.tsx
 *   - /foundation/[subAppKey]/... → foundation/[subAppKey]/layout.tsx
 *   - /school/[subAppKey]/...     → school/[subAppKey]/layout.tsx
 *   - / (portal)                  → page.tsx embed header-nya sendiri
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAuth()
  } catch {
    redirect('/login')
  }

  return <>{children}</>
}
