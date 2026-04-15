'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/data-table/search-input'
import { FilterSelect } from '@/components/data-table/filter-select'
import { FeePaymentsTable } from './fee-payments-table'
import { getFeePayments, getFeeYears } from '@/actions/fee-payment.actions'
import { FeePaymentsExportButtons } from './fee-payments-export-buttons'
import type { FeePaymentRow, PaymentStatus, PaymentMethod } from '@/lib/validations/fee-payment'

interface FeePaymentsListClientProps {
  subAppKey?: string
  /** Base path untuk navigasi form tambah, contoh: /school/sma-1/fee-payments */
  basePath: string
}

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'refunded', label: 'Dikembalikan' },
]

const methodOptions = [
  { value: 'all', label: 'Semua Metode' },
  { value: 'cash', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'virtual_account', label: 'Virtual Account' },
  { value: 'qris', label: 'QRIS' },
  { value: 'other', label: 'Lainnya' },
]

export function FeePaymentsListClient({ subAppKey, basePath }: FeePaymentsListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const methodFilter = searchParams.get('method') ?? 'all'
  const feeYearFilter = searchParams.get('feeYear') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<FeePaymentRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const perPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getFeePayments(
        {
          page,
          perPage,
          search: search || undefined,
          status: statusFilter !== 'all' ? (statusFilter as PaymentStatus) : undefined,
          paymentMethod: methodFilter !== 'all' ? (methodFilter as PaymentMethod) : undefined,
          feeYear: feeYearFilter !== 'all' ? Number(feeYearFilter) : undefined,
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
      toast.error('Gagal memuat data pembayaran.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, methodFilter, feeYearFilter, subAppKey])

  const fetchYears = useCallback(async () => {
    try {
      const result = await getFeeYears(subAppKey)
      if (result.success) {
        setAvailableYears(result.data)
      }
    } catch {
      // silent — non-critical
    }
  }, [subAppKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchYears()
  }, [fetchYears])

  const yearOptions = [
    { value: 'all', label: 'Semua Tahun' },
    ...availableYears.map((y) => ({ value: String(y), label: String(y) })),
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Cari nama siswa atau no. siswa..."
            paramKey="search"
            className="max-w-sm"
          />
          <FilterSelect
            options={statusOptions}
            paramKey="status"
            placeholder="Semua Status"
            className="w-[160px]"
          />
          <FilterSelect
            options={methodOptions}
            paramKey="method"
            placeholder="Semua Metode"
            className="w-[160px]"
          />
          {availableYears.length > 0 && (
            <FilterSelect
              options={yearOptions}
              paramKey="feeYear"
              placeholder="Semua Tahun"
              className="w-[140px]"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {subAppKey && (
            <FeePaymentsExportButtons
              subAppKey={subAppKey}
              search={search || undefined}
              status={statusFilter}
              paymentMethod={methodFilter}
              feeYear={feeYearFilter !== 'all' ? Number(feeYearFilter) : undefined}
            />
          )}
          <Button onClick={() => router.push(`${basePath}/new`)}>
            <PlusIcon className="size-4 mr-2" />
            Catat Pembayaran
          </Button>
        </div>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
          Memuat data...
        </div>
      ) : (
        <FeePaymentsTable
          data={data}
          total={total}
          page={page}
          perPage={perPage}
          onRefresh={fetchData}
          subAppKey={subAppKey}
        />
      )}
    </div>
  )
}
