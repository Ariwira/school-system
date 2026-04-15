import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { StudentForm } from '@/components/students/student-form'

export const metadata = {
  title: 'Tambah Siswa — School ERP',
}

export default async function NewSuperadminStudentPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

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
        <h1 className="text-2xl font-bold tracking-tight">Tambah Siswa</h1>
        <p className="text-muted-foreground">
          Isi formulir di bawah untuk menambahkan siswa baru.
        </p>
      </div>

      <StudentForm
        mode="create"
        isSuperadmin
        redirectTo="/superadmin/students"
      />
    </div>
  )
}
