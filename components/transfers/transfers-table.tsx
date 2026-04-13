'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExternalLinkIcon,
  EyeIcon,
  MoreHorizontalIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
                          render={<Button variant="outline" size="icon-sm" />}
                          disabled={isPending}
                        >
                          <MoreHorizontalIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuGroup>
                            <DropdownMenuItem render={<Link href={`${basePath}/${transfer.id}`} />}>
                              <EyeIcon className="size-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            {transfer.receiptFile && (
                              <DropdownMenuItem
                                render={<a href={transfer.receiptFile} target="_blank" rel="noopener noreferrer" />}
                              >
                                <ExternalLinkIcon className="size-4" />
                                Lihat Bukti
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                          {canApproveCancel && transfer.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => setApproveTarget(transfer)}>
                                  <CheckCircleIcon className="size-4" />
                                  Setujui
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setCancelTarget(transfer)}
                                >
                                  <XCircleIcon className="size-4" />
                                  Batalkan
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </>
                          )}
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
