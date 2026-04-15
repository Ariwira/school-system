'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/data-table/filter-select'
import { TransfersTable } from './transfers-table'
import { getTransfers } from '@/actions/transfer.actions'
import type { TransferRow, TransferStatus, TransferMethod } from '@/lib/validations/transfer'

interface TransfersListClientProps {
  subAppKey?: string
  subappType?: string
  scopedInstituteId?: string
  basePath: string
}

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const directionOptions = [
  { value: 'all', label: 'Semua Arah' },
  { value: 'outgoing', label: 'Keluar' },
  { value: 'incoming', label: 'Masuk' },
]

const methodOptions = [
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
  const searchParams = useSearchParams()
  const router = useRouter()

  const statusFilter = searchParams.get('status') ?? 'all'
  const directionFilter = searchParams.get('direction') ?? 'all'
  const methodFilter = searchParams.get('method') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<TransferRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const perPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getTransfers(
        {
          page,
          perPage,
          status: statusFilter !== 'all' ? (statusFilter as TransferStatus) : undefined,
          direction: directionFilter !== 'all' ? (directionFilter as 'outgoing' | 'incoming') : undefined,
          transferMethod: methodFilter !== 'all' ? (methodFilter as TransferMethod) : undefined,
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
  }, [page, statusFilter, directionFilter, methodFilter, subAppKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterSelect
            options={statusOptions}
            paramKey="status"
            placeholder="Semua Status"
            className="w-[160px]"
          />
          {scopedInstituteId && (
            <FilterSelect
              options={directionOptions}
              paramKey="direction"
              placeholder="Semua Arah"
              className="w-[150px]"
            />
          )}
          <FilterSelect
            options={methodOptions}
            paramKey="method"
            placeholder="Semua Metode"
            className="w-[160px]"
          />
        </div>

        <Button onClick={() => router.push(basePath + '/new')}>
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
          onRefresh={fetchData}
          subAppKey={subAppKey}
          subappType={subappType}
          scopedInstituteId={scopedInstituteId}
          basePath={basePath}
        />
      )}
    </div>
  )
}
