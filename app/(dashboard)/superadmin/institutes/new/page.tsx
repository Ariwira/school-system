import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { InstituteForm } from '@/components/institutes/institute-form'

export const metadata = {
  title: 'Tambah Institusi — School ERP',
}

export default async function NewInstitutePage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/institutes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar institusi
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Institusi</h1>
        <p className="text-muted-foreground">
          Isi formulir di bawah untuk mendaftarkan institusi baru.
        </p>
      </div>

      <InstituteForm mode="create" />
    </div>
  )
}
