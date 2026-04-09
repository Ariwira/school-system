import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { FeesListClient } from '@/components/fees/fees-list-client'

export const metadata = {
  title: 'Tarif Biaya SPP — School ERP',
}

export default async function SuperadminFeesPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarif Biaya SPP</h1>
        <p className="text-muted-foreground">
          Definisikan besaran biaya SPP per tahun akademik.
        </p>
      </div>

      <FeesListClient />
    </div>
  )
}
