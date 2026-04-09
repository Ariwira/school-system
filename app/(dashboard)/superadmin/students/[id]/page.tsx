import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { getStudentById } from '@/actions/student.actions'
import { StudentPaymentHistory } from '@/components/fee-payments/student-payment-history'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SuperadminStudentDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SuperadminStudentDetailPageProps) {
  const { id } = await params
  return {
    title: `Detail Siswa — ${id} — School ERP`,
  }
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  active: { label: 'Aktif', variant: 'default' },
  inactive: { label: 'Tidak Aktif', variant: 'outline' },
  canceled: { label: 'Dibatalkan', variant: 'destructive' },
  graduated: { label: 'Lulus', variant: 'outline' },
  transferred: { label: 'Pindah', variant: 'outline' },
  dropped: { label: 'Keluar', variant: 'outline' },
}

const genderLabels: Record<string, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
}

export default async function SuperadminStudentDetailPage({
  params,
}: SuperadminStudentDetailPageProps) {
  const { id } = await params

  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const result = await getStudentById(id)

  if (!result.success) {
    notFound()
  }

  const student = result.data
  const statusInfo = statusConfig[student.status] ?? { label: student.status, variant: 'secondary' as const }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" render={<Link href="/superadmin/students" />}>
          <ArrowLeftIcon className="size-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
          <p className="text-muted-foreground text-sm">{student.instituteName}</p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Siswa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">NISN</span>
              <span className="font-mono">{student.nisn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Siswa</span>
              <span>{student.studentNumber}</span>
            </div>
            {student.nik && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">NIK</span>
                <span className="font-mono">{student.nik}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jenis Kelamin</span>
              <span>{genderLabels[student.gender] ?? student.gender}</span>
            </div>
            {student.dob && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Lahir</span>
                <span>{student.dob}</span>
              </div>
            )}
            {student.pob && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempat Lahir</span>
                <span>{student.pob}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telepon</span>
                <span>{student.phone}</span>
              </div>
            )}
            {student.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{student.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tahun Angkatan</span>
              <span>{student.generationYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal Masuk</span>
              <span>{student.admissionDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Institusi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{student.instituteName}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pembayaran SPP</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentPaymentHistory studentId={student.id} />
        </CardContent>
      </Card>
    </div>
  )
}
