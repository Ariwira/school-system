'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExternalLinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getFeePaymentsByStudent } from '@/actions/fee-payment.actions'
import type { FeePaymentRow, PaymentStatus, PaymentMethod } from '@/lib/validations/fee-payment'

interface StudentPaymentHistoryProps {
  studentId: string
  subAppKey?: string
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  paid: { label: 'Lunas', variant: 'default' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
  refunded: { label: 'Dikembalikan', variant: 'outline' },
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  virtual_account: 'Virtual Account',
  qris: 'QRIS',
  other: 'Lainnya',
}

const feeTypeLabels: Record<string, string> = {
  spp: 'SPP',
  registration: 'Pendaftaran',
  building: 'Gedung',
  uniform: 'Seragam',
  book: 'Buku',
  activity: 'Kegiatan',
  other: 'Lainnya',
}

function formatRupiah(amount: string): string {
  const num = Number(amount)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

function formatDateWITA(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function StudentPaymentHistory({ studentId, subAppKey }: StudentPaymentHistoryProps) {
  const [payments, setPayments] = useState<FeePaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getFeePaymentsByStudent(studentId, subAppKey)
      if (result.success) {
        setPayments(result.data)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Gagal memuat riwayat pembayaran.')
    } finally {
      setLoading(false)
    }
  }, [studentId, subAppKey])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Memuat riwayat pembayaran...
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        Belum ada riwayat pembayaran untuk siswa ini.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Biaya</TableHead>
            <TableHead>Jumlah Dibayar</TableHead>
            <TableHead>Metode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Bukti</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const statusInfo = statusConfig[payment.status]
            return (
              <TableRow key={payment.id}>
                <TableCell>
                  <p className="text-sm font-medium">
                    {feeTypeLabels[payment.feeType] ?? payment.feeType} {payment.feeYear}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tarif: {formatRupiah(payment.feeAmount)}
                  </p>
                </TableCell>
                <TableCell className="font-medium">
                  {formatRupiah(payment.amountPaid)}
                </TableCell>
                <TableCell className="text-sm">
                  {paymentMethodLabels[payment.paymentMethod]}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateWITA(payment.paidDatetime)}
                </TableCell>
                <TableCell>
                  {payment.receiptFile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      render={<a href={payment.receiptFile} target="_blank" rel="noopener noreferrer" />}
                    >
                      <ExternalLinkIcon className="size-3.5 mr-1" />
                      Lihat
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
