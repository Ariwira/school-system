import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { getInstituteById } from '@/actions/institute.actions'
import { InstituteForm } from '@/components/institutes/institute-form'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Detail Institusi — School ERP',
}

interface InstituteDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InstituteDetailPage({ params }: InstituteDetailPageProps) {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const { id } = await params

  const result = await getInstituteById(id)
  if (!result.success) {
    notFound()
  }

  const institute = result.data

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/superadmin/institutes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeftIcon className="size-4" />
          Kembali ke daftar institusi
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{institute.name}</h1>
          <Badge variant={institute.type === 'foundation' ? 'default' : 'secondary'}>
            {institute.type === 'foundation' ? 'Yayasan' : 'Sekolah'}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Perbarui informasi institusi. Tipe institusi tidak dapat diubah.
        </p>
      </div>

      <InstituteForm mode="edit" defaultValues={institute} />
    </div>
  )
}
