import { redirect } from 'next/navigation'
import {
  Building2,
  Users,
  GraduationCap,
  ArrowLeftRight,
  Banknote,
} from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { getSuperadminStats } from '@/actions/dashboard.actions'
import { StatCard } from '@/components/dashboard/stat-card'
import { formatRupiah } from '@/lib/utils'

export const metadata = {
  title: 'Superadmin Panel — School ERP',
}

export default async function SuperadminDashboardPage() {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const statsResult = await getSuperadminStats()

  const stats = statsResult.success ? statsResult.data : null

  const now = new Date()
  const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Superadmin Panel</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ringkasan statistik seluruh sistem.
        </p>
      </div>

      {!statsResult.success && (
        <p className="text-destructive text-sm">{statsResult.error}</p>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Institusi"
            value={stats.totalInstitutes}
            description="Semua yayasan dan sekolah terdaftar"
            icon={Building2}
          />
          <StatCard
            title="Total Staf Aktif"
            value={stats.totalStaffs}
            description="Staf berstatus aktif di seluruh institusi"
            icon={Users}
          />
          <StatCard
            title="Total Siswa Aktif"
            value={stats.totalActiveStudents}
            description="Siswa berstatus aktif di seluruh sekolah"
            icon={GraduationCap}
          />
          <StatCard
            title="Transfer Pending"
            value={stats.totalPendingTransfers}
            description="Transfer dana menunggu persetujuan"
            icon={ArrowLeftRight}
          />
          <StatCard
            title={`Total SPP Bulan Ini`}
            value={formatRupiah(stats.totalSppThisMonth)}
            description={`Pembayaran SPP terkonfirmasi — ${monthName}`}
            icon={Banknote}
          />
        </div>
      )}
    </div>
  )
}
