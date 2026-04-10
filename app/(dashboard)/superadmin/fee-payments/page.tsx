import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { FeePaymentsListClient } from '@/components/fee-payments/fee-payments-list-client'

export const metadata = {
  title: 'Pembayaran SPP — School ERP',
}

export default async function SuperadminFeePaymentsPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pembayaran SPP</h1>
        <p className="text-muted-foreground">
          Kelola pencatatan dan konfirmasi pembayaran SPP dari semua institusi.
        </p>
      </div>

      <Suspense fallback={<div className="rounded-md border p-8 text-center text-muted-foreground text-sm">Memuat data...</div>}>
        <FeePaymentsListClient />
      </Suspense>
    </div>
  )
}
