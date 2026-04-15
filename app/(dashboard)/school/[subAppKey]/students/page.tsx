import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { StudentsListClient } from '@/components/students/students-list-client'

interface SchoolStudentsPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: SchoolStudentsPageProps) {
  const { subAppKey } = await params
  return {
    title: `Siswa Sekolah — ${subAppKey} — School ERP`,
  }
}

export default async function SchoolStudentsPage({ params }: SchoolStudentsPageProps) {
  const { subAppKey } = await params

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'school') {
      redirect('/')
    }
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Siswa</h1>
        <p className="text-muted-foreground">
          Kelola data siswa sekolah ini.
        </p>
      </div>

      <Suspense fallback={<div className="rounded-md border p-8 text-center text-muted-foreground text-sm">Memuat data...</div>}>
        <StudentsListClient
          subAppKey={subAppKey}
          basePath={`/school/${subAppKey}/students`}
        />
      </Suspense>
    </div>
  )
}
