import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getTransferById } from '@/actions/transfer.actions'
import { formatRupiah } from '@/components/transfers/transfer-utils'

interface EditSchoolTransferPageProps {
  params: Promise<{ subAppKey: string; id: string }>
}

export async function generateMetadata({ params }: EditSchoolTransferPageProps) {
  const { subAppKey } = await params
  return {
    title: `Detail Transfer — ${subAppKey} — School ERP`,
  }
}

export default async function EditSchoolTransferPage({ params }: EditSchoolTransferPageProps) {
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

  const transfer = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/school/${subAppKey}/transfers`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar transfer
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Detail Transfer</h1>
        <p className="text-muted-foreground">
          Transfer dari {transfer.transferFromName} ke {transfer.transferToName} sebesar{' '}
          {formatRupiah(transfer.amount)}.
        </p>
      </div>

      <div className="rounded-md border p-6 text-sm space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dari</span>
          <span className="font-medium">{transfer.transferFromName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ke</span>
          <span className="font-medium">{transfer.transferToName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Jumlah</span>
          <span className="font-medium">{formatRupiah(transfer.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Issuer</span>
          <span>{transfer.issuerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pengirim</span>
          <span>{transfer.senderName}</span>
        </div>
        {transfer.notes && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Catatan</span>
            <span className="text-right max-w-xs">{transfer.notes}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Sekolah hanya dapat melihat riwayat transfer. Gunakan halaman detail untuk konfirmasi penerimaan.
      </p>
      <Link
        href={`/school/${subAppKey}/transfers/${id}`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        Lihat detail transfer
      </Link>
    </div>
  )
}
