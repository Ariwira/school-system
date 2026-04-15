import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { StaffForm } from '@/components/staffs/staff-form'

interface NewSchoolStaffPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: NewSchoolStaffPageProps) {
  const { subAppKey } = await params
  return {
    title: `Tambah Staf — ${subAppKey} — School ERP`,
  }
}

export default async function NewSchoolStaffPage({ params }: NewSchoolStaffPageProps) {
  const { subAppKey } = await params

  let instituteId: string | undefined

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'school') {
      redirect('/')
    }

    instituteId = subapp.instituteId ?? undefined
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/school/${subAppKey}/staffs`}
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

      <StaffForm
        mode="create"
        subAppKey={subAppKey}
        instituteId={instituteId}
        redirectTo={`/school/${subAppKey}/staffs`}
      />
    </div>
  )
}
