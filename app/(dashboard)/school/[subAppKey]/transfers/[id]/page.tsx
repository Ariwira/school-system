import { redirect, notFound } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getTransferById } from '@/actions/transfer.actions'
import { TransferDetailClient } from '@/components/transfers/transfer-detail-client'

interface SchoolTransferDetailPageProps {
  params: Promise<{ subAppKey: string; id: string }>
}

export async function generateMetadata({ params }: SchoolTransferDetailPageProps) {
  const { subAppKey, id } = await params
  return {
    title: `Detail Transfer ${id.slice(0, 8)}... — ${subAppKey} — School ERP`,
  }
}

export default async function SchoolTransferDetailPage({
  params,
}: SchoolTransferDetailPageProps) {
  const { subAppKey, id } = await params

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'school') {
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
      subappType="school"
      backPath={`/school/${subAppKey}/transfers`}
    />
  )
}
