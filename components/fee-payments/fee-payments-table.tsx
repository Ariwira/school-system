'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, ExternalLinkIcon, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UrlPagination } from '@/components/data-table/url-pagination'
import { confirmPayment } from '@/actions/fee-payment.actions'
import type { FeePaymentRow, PaymentStatus, PaymentMethod } from '@/lib/validations/fee-payment'

interface FeePaymentsTableProps {
  data: FeePaymentRow[]
  total: number
  page: number
  perPage: number
  onRefresh: () => void
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function FeePaymentsTable({
  data,
  total,
  page,
  perPage,
  onRefresh,
  subAppKey,
}: FeePaymentsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmTarget, setConfirmTarget] = useState<FeePaymentRow | null>(null)

  const handleConfirm = useCallback(() => {
    if (!confirmTarget) return

    startTransition(async () => {
      const result = await confirmPayment(confirmTarget.id, subAppKey)
      if (result.success) {
        toast.success(`Pembayaran dari ${confirmTarget.studentName} berhasil dikonfirmasi.`)
      } else {
        toast.error(result.error)
      }
      setConfirmTarget(null)
      onRefresh()
    })
  }, [confirmTarget, subAppKey, onRefresh])

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Biaya</TableHead>
              <TableHead>Jumlah Dibayar</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>No. Kwitansi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Bayar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  Belum ada data pembayaran.
                </TableCell>
              </TableRow>
            ) : (
              data.map((payment) => {
                const statusInfo = statusConfig[payment.status]
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground">{payment.studentNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {feeTypeLabels[payment.feeType] ?? payment.feeType} {payment.feeYear} Sem {payment.feeSemester === 1 ? 'Ganjil' : 'Genap'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tarif: {formatRupiah(payment.feeAmount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatRupiah(payment.amountPaid)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {paymentMethodLabels[payment.paymentMethod]}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {payment.receipt ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateWITA(payment.paidDatetime)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                          disabled={isPending}
                        >
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Buka menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                              Aksi Pembayaran
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            {payment.receiptFile && (
                              <DropdownMenuItem
                                onClick={() => window.open(payment.receiptFile!, '_blank')}
                                className="cursor-pointer"
                              >
                                <ExternalLinkIcon className="size-4 mr-2" />
                                Lihat Bukti
                              </DropdownMenuItem>
                            )}
                            {payment.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => setConfirmTarget(payment)}
                                className="cursor-pointer"
                              >
                                <CheckCircleIcon className="size-4 mr-2" />
                                Konfirmasi Pembayaran
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginasi */}
      <UrlPagination
        total={total}
        page={page}
        perPage={perPage}
        itemLabel="pembayaran"
      />

      {/* Dialog konfirmasi pembayaran */}
      <Dialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengonfirmasi pembayaran dari{' '}
              <strong>{confirmTarget?.studentName}</strong> sebesar{' '}
              <strong>{confirmTarget ? formatRupiah(confirmTarget.amountPaid) : ''}</strong>? Status
              akan berubah dari <em>pending</em> menjadi <em>lunas</em>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
