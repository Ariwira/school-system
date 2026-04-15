import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { getStudentById } from '@/actions/student.actions'
import { StudentForm } from '@/components/students/student-form'

export const metadata = {
  title: 'Edit Siswa — School ERP',
}

interface EditSuperadminStudentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSuperadminStudentPage({ params }: EditSuperadminStudentPageProps) {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const { id } = await params

  const result = await getStudentById(id)
  if (!result.success) {
    notFound()
  }

  const student = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/students"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar siswa
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Siswa</h1>
        <p className="text-muted-foreground">
          Perbarui data siswa {student.name}.
        </p>
      </div>

      <StudentForm
        mode="edit"
        defaultValues={student}
        isSuperadmin
        redirectTo="/superadmin/students"
      />
    </div>
  )
}
