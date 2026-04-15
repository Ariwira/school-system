import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { FeeForm } from '@/components/fees/fee-form'

export const metadata = {
  title: 'Tambah Tarif Biaya — School ERP',
}

export default async function NewFeePage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/fees"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar tarif biaya
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Tarif Biaya</h1>
        <p className="text-muted-foreground">
          Isi formulir di bawah untuk mendefinisikan tarif biaya baru.
        </p>
      </div>

      <FeeForm mode="create" redirectTo="/superadmin/fees" />
    </div>
  )
}