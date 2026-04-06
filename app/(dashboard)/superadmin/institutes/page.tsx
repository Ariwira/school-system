import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { InstitutesListClient } from '@/components/institutes/institutes-list-client'

export const metadata = {
  title: 'Manajemen Institusi — School ERP',
}

export default async function InstitutesPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Institusi</h1>
        <p className="text-muted-foreground">
          Kelola yayasan dan sekolah yang terdaftar dalam sistem.
        </p>
      </div>

      <InstitutesListClient />
    </div>
  )
}
