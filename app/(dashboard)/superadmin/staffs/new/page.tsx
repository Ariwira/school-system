import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { StaffForm } from '@/components/staffs/staff-form'

export const metadata = {
  title: 'Tambah Staf — School ERP',
}

export default async function NewStaffSuperadminPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/staffs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar staf
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Staf</h1>
        <p className="text-muted-foreground">
          Isi formulir di bawah untuk menambahkan staf baru.
        </p>
      </div>

      <StaffForm mode="create" isSuperadmin redirectTo="/superadmin/staffs" />
    </div>
  )
}
