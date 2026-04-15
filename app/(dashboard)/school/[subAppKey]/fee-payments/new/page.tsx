import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { FeePaymentForm } from '@/components/fee-payments/fee-payment-form'

interface NewSchoolFeePaymentPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: NewSchoolFeePaymentPageProps) {
  const { subAppKey } = await params
  return {
    title: `Catat Pembayaran SPP — ${subAppKey} — School ERP`,
  }
}

export default async function NewSchoolFeePaymentPage({ params }: NewSchoolFeePaymentPageProps) {
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/school/${subAppKey}/fee-payments`}
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

      <FeePaymentForm
        subAppKey={subAppKey}
        redirectTo={`/school/${subAppKey}/fee-payments`}
      />
    </div>
  )
}
