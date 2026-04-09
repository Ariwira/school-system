import { redirect } from 'next/navigation'
import {
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
} from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getFoundationStats } from '@/actions/dashboard.actions'
import { StatCard } from '@/components/dashboard/stat-card'
import { formatRupiah } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>
}) {
  const { subAppKey } = await params
  return {
    title: `Dashboard Yayasan — ${subAppKey} — School ERP`,
  }
}

export default async function FoundationSubappPage({
  params,
}: {
  params: Promise<Record<string, string>>
}) {
  const { subAppKey } = await params

  let subappName: string

  try {
    const { subapp } = await requireSubappAccess(subAppKey)
    subappName = subapp.name ?? subAppKey
  } catch {
    redirect('/login')
  }

  const statsResult = await getFoundationStats(subAppKey).catch(() => null)

  const stats = statsResult?.success ? statsResult.data : null

  const now = new Date()
  const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Yayasan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ringkasan statistik{' '}
          <span className="text-foreground font-medium">{subappName}</span>.
        </p>
      </div>

      {statsResult && !statsResult.success && (
        <p className="text-destructive text-sm">{statsResult.error}</p>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <StatCard
            title="Total Staf Yayasan"
            value={stats.totalFoundationStaffs}
            description="Staf aktif di yayasan ini"
            icon={Users}
          />
          <StatCard
            title="Transfer Keluar Pending"
            value={stats.totalOutgoingPendingTransfers}
            description="Transfer dari yayasan ini yang belum disetujui"
            icon={ArrowUpRight}
          />
          <StatCard
            title="Transfer Masuk Pending"
            value={stats.totalIncomingPendingTransfers}
            description="Transfer ke yayasan ini yang belum disetujui"
            icon={ArrowDownLeft}
          />
          <StatCard
            title={`Total Dana Ditransfer Bulan Ini`}
            value={formatRupiah(stats.totalTransferredThisMonth)}
            description={`Transfer disetujui — ${monthName}`}
            icon={Banknote}
          />
        </div>
      )}
    </div>
  )
}
