import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { getFeeById } from '@/actions/fee.actions'
import { FeeForm } from '@/components/fees/fee-form'

export const metadata = {
  title: 'Edit Tarif Biaya — School ERP',
}

interface EditFeePageProps {
  params: Promise<{ id: string }>
}

export default async function EditFeePage({ params }: EditFeePageProps) {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const { id } = await params

  const result = await getFeeById(id)
  if (!result.success) {
    notFound()
  }

  const fee = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/fees"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar tarif biaya
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Tarif Biaya</h1>
        <p className="text-muted-foreground">
          Perbarui tarif {fee.feeType.toUpperCase()} {fee.year} Sem{' '}
          {fee.semester === 1 ? 'Ganjil' : 'Genap'}.
        </p>
      </div>

      <FeeForm mode="edit" defaultValues={fee} redirectTo="/superadmin/fees" />
    </div>
  )
}