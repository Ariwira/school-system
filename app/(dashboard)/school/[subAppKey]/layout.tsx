import { redirect } from 'next/navigation'
import { requireSubappAccess, getUserSubapps } from '@/lib/auth-helpers'
import { Header } from '@/components/layout/header'
import { SidebarDesktop } from '@/components/layout/sidebar'
import type { Subapp } from '@/lib/db/schema'
import type { UserRole } from '@/lib/auth-helpers'

export default async function SchoolSubappLayout(
  props: LayoutProps<'/school/[subAppKey]'>
) {
  const { subAppKey } = await props.params

  let session: Awaited<ReturnType<typeof requireSubappAccess>>['session']
  let subapp: Awaited<ReturnType<typeof requireSubappAccess>>['subapp']

  try {
    const result = await requireSubappAccess(subAppKey)
    session = result.session
    subapp = result.subapp
  } catch {
    redirect('/login')
  }

  if (subapp.type !== 'school') {
    redirect('/')
  }

  const { user } = session
  const userRole = (user as { role?: UserRole }).role ?? 'user'

  let subapps: Subapp[] = []
  try {
    subapps = await getUserSubapps(user.id)
  } catch {
    subapps = []
  }

  return (
    <div className="flex min-h-screen">
      <SidebarDesktop role={userRole} subAppKey={subAppKey} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={user.name}
          userEmail={user.email}
          userAvatar={(user as { avatar?: string | null }).avatar ?? null}
          userRole={userRole}
          subapps={subapps}
          currentSubappKey={subAppKey}
          subAppKey={subAppKey}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{props.children}</main>
      </div>
    </div>
  )
}
