import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { FeePaymentForm } from '@/components/fee-payments/fee-payment-form'

export const metadata = {
  title: 'Catat Pembayaran SPP — School ERP',
}

export default async function NewSuperadminFeePaymentPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/fee-payments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar pembayaran
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Catat Pembayaran SPP</h1>
        <p className="text-muted-foreground">
          Isi data pembayaran SPP siswa. Jika metode transfer, bukti pembayaran wajib diupload.
        </p>
      </div>

      <FeePaymentForm redirectTo="/superadmin/fee-payments" />
    </div>
  )
}
