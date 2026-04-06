import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'

export const metadata = {
  title: 'Superadmin Panel — School ERP',
}

export default async function SuperadminDashboardPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Superadmin Panel</h1>
      <p className="text-muted-foreground">
        Selamat datang di panel superadmin. Gunakan menu di sidebar untuk mengelola sistem.
      </p>
    </div>
  )
}
