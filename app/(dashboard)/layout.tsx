import { redirect } from 'next/navigation'
import { requireAuth, getUserSubapps } from '@/lib/auth-helpers'
import type { UserRole } from '@/lib/auth-helpers'
import { Header } from '@/components/layout/header'
import { SidebarDesktop } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session: Awaited<ReturnType<typeof requireAuth>>

  try {
    session = await requireAuth()
  } catch {
    redirect('/login')
  }

  const { user } = session
  const userRole = (user as { role?: UserRole }).role ?? 'school'

  let subapps: Awaited<ReturnType<typeof getUserSubapps>> = []

  if (userRole !== 'superadmin') {
    try {
      subapps = await getUserSubapps(user.id)
    } catch {
      // gagal fetch subapps — lanjut dengan list kosong
      subapps = []
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — fixed on left */}
      <SidebarDesktop role={userRole} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={user.name}
          userEmail={user.email}
          userAvatar={(user as { avatar?: string | null }).avatar ?? null}
          userRole={userRole}
          subapps={subapps}
          currentSubappKey={null}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
