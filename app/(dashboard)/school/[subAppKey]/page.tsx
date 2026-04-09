import { redirect } from 'next/navigation'
import {
  GraduationCap,
  Clock,
  Receipt,
  ArrowDownLeft,
} from 'lucide-react'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getSchoolStats } from '@/actions/dashboard.actions'
import { StatCard } from '@/components/dashboard/stat-card'

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>
}) {
  const { subAppKey } = await params
  return {
    title: `Dashboard Sekolah — ${subAppKey} — School ERP`,
  }
}

export default async function SchoolSubappPage({
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

  const statsResult = await getSchoolStats(subAppKey).catch(() => null)

  const stats = statsResult?.success ? statsResult.data : null

  const now = new Date()
  const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Sekolah</h1>
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
            title="Siswa Aktif"
            value={stats.totalActiveStudents}
            description="Siswa berstatus aktif di sekolah ini"
            icon={GraduationCap}
          />
          <StatCard
            title="Siswa Pending"
            value={stats.totalPendingStudents}
            description="Siswa menunggu aktivasi"
            icon={Clock}
          />
          <StatCard
            title={`SPP Belum Dibayar Bulan Ini`}
            value={stats.totalUnpaidSppThisMonth}
            description={`Tagihan SPP pending — ${monthName}`}
            icon={Receipt}
          />
          <StatCard
            title="Transfer Masuk Pending"
            value={stats.totalIncomingPendingTransfers}
            description="Transfer dana ke sekolah ini yang belum disetujui"
            icon={ArrowDownLeft}
          />
        </div>
      )}
    </div>
  )
}
