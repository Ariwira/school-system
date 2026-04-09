'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cancelTransfer, confirmReceived, getStaffsForTransfer } from '@/actions/transfer.actions'
import { statusConfig, transferMethodLabels, formatRupiah, formatDateWITA } from './transfer-utils'
import type { TransferRow, TransferStatus } from '@/lib/validations/transfer'
import { ApproveTransferSheet } from './approve-transfer-sheet'

interface StaffOption {
  id: string
  name: string
  staffNumber: string
}

interface TransferDetailClientProps {
  transfer: TransferRow
  subAppKey?: string
  subappType?: string
  backPath: string
}

export function TransferDetailClient({
  transfer: initialTransfer,
  subAppKey,
  subappType,
  backPath,
}: TransferDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [transfer, setTransfer] = useState(initialTransfer)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [approveSheetOpen, setApproveSheetOpen] = useState(false)
  const [confirmReceiveDialogOpen, setConfirmReceiveDialogOpen] = useState(false)
  const [receiverStaffs, setReceiverStaffs] = useState<StaffOption[]>([])
  const [selectedReceiverId, setSelectedReceiverId] = useState('')
  const [loadingReceivers, setLoadingReceivers] = useState(false)

  const canApproveCancel = subappType !== 'school'
  const statusInfo = statusConfig[transfer.status as TransferStatus] ?? statusConfig.pending

  const fetchReceivers = useCallback(async () => {
    setLoadingReceivers(true)
    try {
      const result = await getStaffsForTransfer(transfer.transferToId, subAppKey)
      if (result.success) {
        setReceiverStaffs(result.data)
      }
    } catch {
      // silent
    } finally {
      setLoadingReceivers(false)
    }
  }, [transfer.transferToId, subAppKey])

  useEffect(() => {
    if (confirmReceiveDialogOpen) {
      fetchReceivers()
    }
  }, [confirmReceiveDialogOpen, fetchReceivers])

  const handleCancel = useCallback(() => {
    startTransition(async () => {
      const result = await cancelTransfer(transfer.id, subAppKey)
      if (result.success) {
        toast.success('Transfer berhasil dibatalkan.')
        setCancelDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
        setCancelDialogOpen(false)
      }
    })
  }, [transfer.id, subAppKey, router])

  const handleConfirmReceive = useCallback(() => {
    if (!selectedReceiverId) {
      toast.error('Pilih staf penerima terlebih dahulu.')
      return
    }

    startTransition(async () => {
      const result = await confirmReceived(transfer.id, selectedReceiverId, subAppKey)
      if (result.success) {
        toast.success('Penerimaan transfer berhasil dikonfirmasi.')
        setConfirmReceiveDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
        setConfirmReceiveDialogOpen(false)
      }
    })
  }, [transfer.id, selectedReceiverId, subAppKey, router])

  // Keep local transfer state in sync with router refresh
  useEffect(() => {
    setTransfer(initialTransfer)
  }, [initialTransfer])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" render={<Link href={backPath} />}>
          <ArrowLeftIcon className="size-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Detail Transfer</h1>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">ID: {transfer.id}</p>
        </div>
        <div className="flex gap-2">
          {canApproveCancel && transfer.status === 'pending' && (
            <>
              <Button onClick={() => setApproveSheetOpen(true)} disabled={isPending}>
                <CheckCircleIcon className="size-4 mr-2" />
                Setujui
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isPending}
              >
                <XCircleIcon className="size-4 mr-2" />
                Batalkan
              </Button>
            </>
          )}
          {transfer.status === 'approved' && !transfer.receiverId && (
            <Button onClick={() => setConfirmReceiveDialogOpen(true)} disabled={isPending}>
              <CheckCircleIcon className="size-4 mr-2" />
              Konfirmasi Terima
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Dari</span>
              <span className="font-medium">{transfer.transferFromName}</span>
              <span className="text-muted-foreground">Ke</span>
              <span className="font-medium">{transfer.transferToName}</span>
              <span className="text-muted-foreground">Jumlah</span>
              <span className="font-bold text-base">{formatRupiah(transfer.amount)}</span>
              <span className="text-muted-foreground">Metode</span>
              <span>{transferMethodLabels[transfer.transferMethod] ?? transfer.transferMethod}</span>
              <span className="text-muted-foreground">Tanggal Pengajuan</span>
              <span>{formatDateWITA(transfer.issuedAt)}</span>
              {transfer.approvedAt && (
                <>
                  <span className="text-muted-foreground">Tanggal Disetujui</span>
                  <span>{formatDateWITA(transfer.approvedAt)}</span>
                </>
              )}
              {transfer.receipt && (
                <>
                  <span className="text-muted-foreground">No. Referensi</span>
                  <span className="font-mono">{transfer.receipt}</span>
                </>
              )}
              {transfer.notes && (
                <>
                  <span className="text-muted-foreground">Catatan</span>
                  <span className="col-span-1">{transfer.notes}</span>
                </>
              )}
            </div>
            {transfer.receiptFile && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  render={<a href={transfer.receiptFile} target="_blank" rel="noopener noreferrer" />}
                >
                  <ExternalLinkIcon className="size-3.5 mr-1" />
                  Lihat Bukti Transfer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Workflow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alur Proses</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-muted-foreground/20 space-y-6 pl-6">
              {/* Step 1: Pengajuan */}
              <li className="relative">
                <div className="absolute -left-[1.65rem] flex size-5 items-center justify-center rounded-full bg-primary">
                  <UserIcon className="size-3 text-primary-foreground" />
                </div>
                <p className="text-sm font-semibold">Pengajuan</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {transfer.issuerName} &bull; {formatDateWITA(transfer.issuedAt)}
                </p>
              </li>

              {/* Step 2: Pengirim */}
              <li className="relative">
                <div className="absolute -left-[1.65rem] flex size-5 items-center justify-center rounded-full bg-primary">
                  <UserIcon className="size-3 text-primary-foreground" />
                </div>
                <p className="text-sm font-semibold">Pengirim</p>
                <p className="text-xs text-muted-foreground mt-0.5">{transfer.senderName}</p>
              </li>

              {/* Step 3: Approval */}
              <li className="relative">
                <div
                  className={`absolute -left-[1.65rem] flex size-5 items-center justify-center rounded-full ${
                    transfer.approverId
                      ? transfer.status === 'cancelled'
                        ? 'bg-destructive'
                        : 'bg-primary'
                      : 'bg-muted border border-muted-foreground/30'
                  }`}
                >
                  <UserIcon
                    className={`size-3 ${transfer.approverId ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  />
                </div>
                <p className="text-sm font-semibold">
                  {transfer.status === 'cancelled' ? 'Dibatalkan' : 'Disetujui'}
                </p>
                {transfer.approverId ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {transfer.approverName} &bull;{' '}
                    {transfer.approvedAt ? formatDateWITA(transfer.approvedAt) : '-'}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Menunggu persetujuan...</p>
                )}
              </li>

              {/* Step 4: Penerima */}
              <li className="relative">
                <div
                  className={`absolute -left-[1.65rem] flex size-5 items-center justify-center rounded-full ${
                    transfer.receiverId
                      ? 'bg-primary'
                      : 'bg-muted border border-muted-foreground/30'
                  }`}
                >
                  <UserIcon
                    className={`size-3 ${transfer.receiverId ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  />
                </div>
                <p className="text-sm font-semibold">Konfirmasi Terima</p>
                {transfer.receiverId ? (
                  <p className="text-xs text-muted-foreground mt-0.5">{transfer.receiverName}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {transfer.status === 'approved' ? 'Menunggu konfirmasi...' : '-'}
                  </p>
                )}
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Dialog batalkan */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Transfer</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan transfer dari{' '}
              <strong>{transfer.transferFromName}</strong> ke{' '}
              <strong>{transfer.transferToName}</strong> sebesar{' '}
              <strong>{formatRupiah(transfer.amount)}</strong>? Tindakan ini tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isPending}
            >
              Kembali
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              {isPending ? 'Memproses...' : 'Batalkan Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi terima */}
      <Dialog open={confirmReceiveDialogOpen} onOpenChange={setConfirmReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penerimaan</DialogTitle>
            <DialogDescription>
              Pilih staf dari <strong>{transfer.transferToName}</strong> yang menerima transfer
              sebesar <strong>{formatRupiah(transfer.amount)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">Staf Penerima</Label>
            <Select
              value={selectedReceiverId}
              onValueChange={(val) => setSelectedReceiverId(val ?? '')}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingReceivers ? 'Memuat staf...' : 'Pilih staf penerima'}
                />
              </SelectTrigger>
              <SelectContent>
                {receiverStaffs.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {loadingReceivers ? 'Memuat...' : 'Tidak ada staf aktif.'}
                  </div>
                ) : (
                  receiverStaffs.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <span className="font-medium">{staff.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {staff.staffNumber}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmReceiveDialogOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmReceive}
              disabled={isPending || !selectedReceiverId}
            >
              {isPending ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet approve */}
      <ApproveTransferSheet
        transfer={transfer}
        open={approveSheetOpen}
        onOpenChange={setApproveSheetOpen}
        onSuccess={() => {
          setApproveSheetOpen(false)
          router.refresh()
        }}
        subAppKey={subAppKey}
      />
    </div>
  )
}
