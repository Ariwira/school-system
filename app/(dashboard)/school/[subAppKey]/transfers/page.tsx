import { redirect } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { TransfersListClient } from '@/components/transfers/transfers-list-client'

interface SchoolTransfersPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: SchoolTransfersPageProps) {
  const { subAppKey } = await params
  return {
    title: `Transfer Dana — ${subAppKey} — School ERP`,
  }
}

export default async function SchoolTransfersPage({ params }: SchoolTransfersPageProps) {
  const { subAppKey } = await params

  let scopedInstituteId: string | undefined

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'school') {
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
          Lihat riwayat transfer dana yang melibatkan sekolah ini.
        </p>
      </div>

      <TransfersListClient
        subAppKey={subAppKey}
        subappType="school"
        scopedInstituteId={scopedInstituteId}
        basePath={`/school/${subAppKey}/transfers`}
      />
    </div>
  )
}
