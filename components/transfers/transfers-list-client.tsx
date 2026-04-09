'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransfersTable } from './transfers-table'
import { CreateTransferSheet } from './create-transfer-sheet'
import { getTransfers } from '@/actions/transfer.actions'
import type { TransferRow, TransferStatus, TransferMethod } from '@/lib/validations/transfer'

interface TransfersListClientProps {
  subAppKey?: string
  subappType?: string
  scopedInstituteId?: string
  basePath: string
}

const statusOptions: { value: TransferStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const directionOptions: { value: 'all' | 'outgoing' | 'incoming'; label: string }[] = [
  { value: 'all', label: 'Semua Arah' },
  { value: 'outgoing', label: 'Keluar' },
  { value: 'incoming', label: 'Masuk' },
]

const methodOptions: { value: TransferMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Metode' },
  { value: 'cash', label: 'Tunai' },
  { value: 'bank_transfer', label: 'Transfer Bank' },
  { value: 'other', label: 'Lainnya' },
]

export function TransfersListClient({
  subAppKey,
  subappType,
  scopedInstituteId,
  basePath,
}: TransfersListClientProps) {
  const [data, setData] = useState<TransferRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'outgoing' | 'incoming'>('all')
  const [methodFilter, setMethodFilter] = useState<TransferMethod | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const perPage = 10

  const fetchData = useCallback(
    async (
      currentPage: number,
      currentStatus: TransferStatus | 'all',
      currentDirection: 'all' | 'outgoing' | 'incoming',
      currentMethod: TransferMethod | 'all',
    ) => {
      setLoading(true)
      try {
        const result = await getTransfers(
          {
            page: currentPage,
            perPage,
            status: currentStatus !== 'all' ? currentStatus : undefined,
            direction: currentDirection !== 'all' ? currentDirection : undefined,
            transferMethod: currentMethod !== 'all' ? currentMethod : undefined,
          },
          subAppKey,
        )

        if (result.success) {
          setData(result.data.data)
          setTotal(result.data.total)
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error('Gagal memuat data transfer.')
      } finally {
        setLoading(false)
      }
    },
    [subAppKey],
  )

  useEffect(() => {
    setPage(1)
    fetchData(1, statusFilter, directionFilter, methodFilter)
  }, [statusFilter, directionFilter, methodFilter, fetchData])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(newPage, statusFilter, directionFilter, methodFilter)
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    fetchData(page, statusFilter, directionFilter, methodFilter)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as TransferStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {scopedInstituteId && (
            <Select
              value={directionFilter}
              onValueChange={(val) =>
                setDirectionFilter(val as 'all' | 'outgoing' | 'incoming')
              }
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Semua Arah" />
              </SelectTrigger>
              <SelectContent>
                {directionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={methodFilter}
            onValueChange={(val) => setMethodFilter(val as TransferMethod | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Semua Metode" />
            </SelectTrigger>
            <SelectContent>
              {methodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setSheetOpen(true)}>
          <PlusIcon className="size-4 mr-2" />
          Buat Transfer
        </Button>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
          Memuat data...
        </div>
      ) : (
        <TransfersTable
          data={data}
          total={total}
          page={page}
          perPage={perPage}
          onPageChange={handlePageChange}
          onRefresh={() => fetchData(page, statusFilter, directionFilter, methodFilter)}
          subAppKey={subAppKey}
          subappType={subappType}
          scopedInstituteId={scopedInstituteId}
          basePath={basePath}
        />
      )}

      {/* Sheet form buat transfer */}
      <CreateTransferSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handleFormSuccess}
        subAppKey={subAppKey}
        scopedInstituteId={scopedInstituteId}
      />
    </div>
  )
}
