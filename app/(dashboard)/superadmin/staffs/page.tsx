import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { StaffsListClient } from '@/components/staffs/staffs-list-client'

export const metadata = {
  title: 'Manajemen Staf — School ERP',
}

export default async function SuperadminStaffsPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Staf</h1>
        <p className="text-muted-foreground">
          Kelola data staf dari semua institusi.
        </p>
      </div>

      <StaffsListClient isSuperadmin showInstitute />
    </div>
  )
}
