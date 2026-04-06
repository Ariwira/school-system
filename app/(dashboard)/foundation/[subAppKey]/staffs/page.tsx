import { redirect } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { StaffsListClient } from '@/components/staffs/staffs-list-client'

interface FoundationStaffsPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: FoundationStaffsPageProps) {
  const { subAppKey } = await params
  return {
    title: `Staf Yayasan — ${subAppKey} — School ERP`,
  }
}

export default async function FoundationStaffsPage({ params }: FoundationStaffsPageProps) {
  const { subAppKey } = await params

  let instituteId: string | undefined

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'foundation') {
      redirect('/')
    }

    instituteId = subapp.instituteId ?? undefined
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Staf</h1>
        <p className="text-muted-foreground">
          Kelola data staf yayasan ini.
        </p>
      </div>

      <StaffsListClient
        subAppKey={subAppKey}
        instituteId={instituteId}
      />
    </div>
  )
}
