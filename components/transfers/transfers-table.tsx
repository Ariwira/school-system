'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, XCircleIcon, ExternalLinkIcon, EyeIcon, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
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
import { cancelTransfer } from '@/actions/transfer.actions'
import { statusConfig, transferMethodLabels, formatRupiah, formatDateWITA } from './transfer-utils'
import type { TransferRow, TransferStatus } from '@/lib/validations/transfer'
import { ApproveTransferSheet } from './approve-transfer-sheet'

interface TransfersTableProps {
  data: TransferRow[]
  total: number
  page: number
  perPage: number
  onRefresh: () => void
  subAppKey?: string
  subappType?: string
  scopedInstituteId?: string
  basePath: string
}

export function TransfersTable({
  data,
  total,
  page,
  perPage,
  onRefresh,
  subAppKey,
  subappType,
  basePath,
}: TransfersTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cancelTarget, setCancelTarget] = useState<TransferRow | null>(null)
  const [approveTarget, setApproveTarget] = useState<TransferRow | null>(null)

  const canApproveCancel = subappType !== 'school'

  const handleCancel = useCallback(() => {
    if (!cancelTarget) return

    startTransition(async () => {
      const result = await cancelTransfer(cancelTarget.id, subAppKey)
      if (result.success) {
        toast.success('Transfer berhasil dibatalkan.')
      } else {
        toast.error(result.error)
      }
      setCancelTarget(null)
      onRefresh()
    })
  }, [cancelTarget, subAppKey, onRefresh])

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dari</TableHead>
              <TableHead>Ke</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Pengajuan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  Belum ada data transfer.
                </TableCell>
              </TableRow>
            ) : (
              data.map((transfer) => {
                const statusInfo = statusConfig[transfer.status as TransferStatus] ?? statusConfig.pending
                return (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{transfer.transferFromName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{transfer.transferToName}</p>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatRupiah(transfer.amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transferMethodLabels[transfer.transferMethod] ?? transfer.transferMethod}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateWITA(transfer.issuedAt)}
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
                              Aksi Transfer
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => router.push(`${basePath}/${transfer.id}`)}
                              className="cursor-pointer"
                            >
                              <EyeIcon className="size-4 mr-2" />
                              Detail Transfer
                            </DropdownMenuItem>

                            {transfer.receiptFile && (
                              <DropdownMenuItem
                                onClick={() => window.open(transfer.receiptFile!, '_blank')}
                                className="cursor-pointer"
                              >
                                <ExternalLinkIcon className="size-4 mr-2" />
                                Lihat Bukti
                              </DropdownMenuItem>
                            )}

                            {canApproveCancel && transfer.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setApproveTarget(transfer)}
                                  className="cursor-pointer"
                                >
                                  <CheckCircleIcon className="size-4 mr-2" />
                                  Setujui Transfer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setCancelTarget(transfer)}
                                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <XCircleIcon className="size-4 mr-2" />
                                  Batalkan Transfer
                                </DropdownMenuItem>
                              </>
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
        itemLabel="transfer"
      />

      {/* Dialog konfirmasi batalkan */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Transfer</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan transfer dari{' '}
              <strong>{cancelTarget?.transferFromName}</strong> ke{' '}
              <strong>{cancelTarget?.transferToName}</strong> sebesar{' '}
              <strong>{cancelTarget ? formatRupiah(cancelTarget.amount) : ''}</strong>? Tindakan ini
              tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={isPending}
            >
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? 'Memproses...' : 'Batalkan Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet approve */}
      {approveTarget && (
        <ApproveTransferSheet
          transfer={approveTarget}
          open={!!approveTarget}
          onOpenChange={(open) => !open && setApproveTarget(null)}
          onSuccess={() => {
            setApproveTarget(null)
            onRefresh()
          }}
          subAppKey={subAppKey}
        />
      )}
    </>
  )
}
