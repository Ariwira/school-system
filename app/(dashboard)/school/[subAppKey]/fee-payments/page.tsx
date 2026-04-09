import { redirect } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { FeePaymentsListClient } from '@/components/fee-payments/fee-payments-list-client'

interface SchoolFeePaymentsPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: SchoolFeePaymentsPageProps) {
  const { subAppKey } = await params
  return {
    title: `Pembayaran SPP — ${subAppKey} — School ERP`,
  }
}

export default async function SchoolFeePaymentsPage({ params }: SchoolFeePaymentsPageProps) {
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
        <h1 className="text-2xl font-bold tracking-tight">Pembayaran SPP</h1>
        <p className="text-muted-foreground">
          Kelola pencatatan dan konfirmasi pembayaran SPP siswa sekolah ini.
        </p>
      </div>

      <FeePaymentsListClient subAppKey={subAppKey} />
    </div>
  )
}
