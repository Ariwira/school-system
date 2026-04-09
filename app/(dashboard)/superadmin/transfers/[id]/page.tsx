import { redirect, notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { getTransferById } from '@/actions/transfer.actions'
import { TransferDetailClient } from '@/components/transfers/transfer-detail-client'

interface SuperadminTransferDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SuperadminTransferDetailPageProps) {
  const { id } = await params
  return {
    title: `Detail Transfer ${id.slice(0, 8)}... — School ERP`,
  }
}

export default async function SuperadminTransferDetailPage({
  params,
}: SuperadminTransferDetailPageProps) {
  const { id } = await params

  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const result = await getTransferById(id)

  if (!result.success) {
    notFound()
  }

  return (
    <TransferDetailClient
      transfer={result.data}
      backPath="/superadmin/transfers"
    />
  )
}
