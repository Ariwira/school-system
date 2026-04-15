import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getStudentById } from '@/actions/student.actions'
import { StudentForm } from '@/components/students/student-form'

interface EditSchoolStudentPageProps {
  params: Promise<{ subAppKey: string; id: string }>
}

export async function generateMetadata({ params }: EditSchoolStudentPageProps) {
  const { subAppKey } = await params
  return {
    title: `Edit Siswa — ${subAppKey} — School ERP`,
  }
}

export default async function EditSchoolStudentPage({ params }: EditSchoolStudentPageProps) {
  const { subAppKey, id } = await params

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'school') {
      redirect('/')
    }
  } catch {
    redirect('/login')
  }

  const result = await getStudentById(id, subAppKey)
  if (!result.success) {
    notFound()
  }

  const student = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/school/${subAppKey}/students`}
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
        subAppKey={subAppKey}
        redirectTo={`/school/${subAppKey}/students`}
      />
    </div>
  )
}
