import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { TransfersListClient } from '@/components/transfers/transfers-list-client'

interface FoundationTransfersPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: FoundationTransfersPageProps) {
  const { subAppKey } = await params
  return {
    title: `Transfer Dana — ${subAppKey} — School ERP`,
  }
}

export default async function FoundationTransfersPage({ params }: FoundationTransfersPageProps) {
  const { subAppKey } = await params

  let scopedInstituteId: string | undefined

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'foundation') {
      redirect('/')
    }

    scopedInstituteId = subapp.instituteId ?? undefined
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transfer Dana</h1>
        <p className="text-muted-foreground">
          Kelola transfer dana yayasan ini dan pantau status persetujuannya.
        </p>
      </div>

      <Suspense fallback={<div className="rounded-md border p-8 text-center text-muted-foreground text-sm">Memuat data...</div>}>
        <TransfersListClient
          subAppKey={subAppKey}
          subappType="foundation"
          scopedInstituteId={scopedInstituteId}
          basePath={`/foundation/${subAppKey}/transfers`}
        />
      </Suspense>
    </div>
  )
}
