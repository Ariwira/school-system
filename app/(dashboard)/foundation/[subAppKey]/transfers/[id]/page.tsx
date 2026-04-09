import { redirect, notFound } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getTransferById } from '@/actions/transfer.actions'
import { TransferDetailClient } from '@/components/transfers/transfer-detail-client'

interface FoundationTransferDetailPageProps {
  params: Promise<{ subAppKey: string; id: string }>
}

export async function generateMetadata({ params }: FoundationTransferDetailPageProps) {
  const { subAppKey, id } = await params
  return {
    title: `Detail Transfer ${id.slice(0, 8)}... — ${subAppKey} — School ERP`,
  }
}

export default async function FoundationTransferDetailPage({
  params,
}: FoundationTransferDetailPageProps) {
  const { subAppKey, id } = await params

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'foundation') {
      redirect('/')
    }
  } catch {
    redirect('/login')
  }

  const result = await getTransferById(id, subAppKey)

  if (!result.success) {
    notFound()
  }

  return (
    <TransferDetailClient
      transfer={result.data}
      subAppKey={subAppKey}
      subappType="foundation"
      backPath={`/foundation/${subAppKey}/transfers`}
    />
  )
}
