import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getStaffById } from '@/actions/staff.actions'
import { StaffForm } from '@/components/staffs/staff-form'

interface EditFoundationStaffPageProps {
  params: Promise<{ subAppKey: string; id: string }>
}

export async function generateMetadata({ params }: EditFoundationStaffPageProps) {
  const { subAppKey } = await params
  return {
    title: `Edit Staf — ${subAppKey} — School ERP`,
  }
}

export default async function EditFoundationStaffPage({ params }: EditFoundationStaffPageProps) {
  const { subAppKey, id } = await params

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'foundation') {
      redirect('/')
    }
  } catch {
    redirect('/login')
  }

  const result = await getStaffById(id, subAppKey)
  if (!result.success) {
    notFound()
  }

  const staff = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/foundation/${subAppKey}/staffs`}
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
        subAppKey={subAppKey}
        redirectTo={`/foundation/${subAppKey}/staffs`}
      />
    </div>
  )
}
