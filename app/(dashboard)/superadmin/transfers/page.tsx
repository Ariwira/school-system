import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { TransfersListClient } from '@/components/transfers/transfers-list-client'

export const metadata = {
  title: 'Transfer Dana — School ERP',
}

export default async function SuperadminTransfersPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transfer Dana</h1>
        <p className="text-muted-foreground">
          Kelola transfer dana antar institusi dan pantau status persetujuannya.
        </p>
      </div>

      <TransfersListClient basePath="/superadmin/transfers" />
    </div>
  )
}
