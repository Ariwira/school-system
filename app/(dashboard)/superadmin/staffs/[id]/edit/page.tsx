import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { getStaffById } from '@/actions/staff.actions'
import { StaffForm } from '@/components/staffs/staff-form'

export const metadata = {
  title: 'Edit Staf — School ERP',
}

interface EditStaffSuperadminPageProps {
  params: Promise<{ id: string }>
}

export default async function EditStaffSuperadminPage({ params }: EditStaffSuperadminPageProps) {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const { id } = await params

  const result = await getStaffById(id)
  if (!result.success) {
    notFound()
  }

  const staff = result.data

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
        <h1 className="text-2xl font-bold tracking-tight">Edit Staf</h1>
        <p className="text-muted-foreground">
          Perbarui data staf {staff.name}.
        </p>
      </div>

      <StaffForm
        mode="edit"
        defaultValues={staff}
        isSuperadmin
        redirectTo="/superadmin/staffs"
      />
    </div>
  )
}
