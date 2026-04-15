import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { TransferForm } from '@/components/transfers/transfer-form'

interface NewFoundationTransferPageProps {
  params: Promise<{ subAppKey: string }>
}

export async function generateMetadata({ params }: NewFoundationTransferPageProps) {
  const { subAppKey } = await params
  return {
    title: `Buat Transfer Dana — ${subAppKey} — School ERP`,
  }
}

export default async function NewFoundationTransferPage({ params }: NewFoundationTransferPageProps) {
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/foundation/${subAppKey}/transfers`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar transfer
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Buat Transfer Dana</h1>
        <p className="text-muted-foreground">
          Isi formulir di bawah untuk membuat pengajuan transfer dana antar institusi.
        </p>
      </div>

      <TransferForm
        subAppKey={subAppKey}
        scopedInstituteId={scopedInstituteId}
        redirectTo={`/foundation/${subAppKey}/transfers`}
      />
    </div>
  )
}
