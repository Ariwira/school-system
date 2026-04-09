import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { StudentsListClient } from '@/components/students/students-list-client'

export const metadata = {
  title: 'Manajemen Siswa — School ERP',
}

export default async function SuperadminStudentsPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Siswa</h1>
        <p className="text-muted-foreground">
          Kelola data siswa dari semua institusi.
        </p>
      </div>

      <StudentsListClient isSuperadmin showInstitute />
    </div>
  )
}
