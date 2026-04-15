import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { TransferForm } from '@/components/transfers/transfer-form'

export const metadata = {
  title: 'Buat Transfer Dana — School ERP',
}

export default async function NewSuperadminTransferPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/transfers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar transfer
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Buat Transfer Dana</h1>
        <p className="text-muted-foreground">
          Isi formulir di bawah untuk membuat pengajuan transfer dana antar institusi.
        </p>
      </div>

      <TransferForm redirectTo="/superadmin/transfers" />
    </div>
  )
}
