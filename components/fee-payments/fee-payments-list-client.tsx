'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FeePaymentsTable } from './fee-payments-table'
import { FeePaymentForm } from './fee-payment-form'
import { getFeePayments } from '@/actions/fee-payment.actions'
import type { FeePaymentRow, PaymentStatus, PaymentMethod } from '@/lib/validations/fee-payment'

interface FeePaymentsListClientProps {
  subAppKey?: string
}

const statusOptions: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'refunded', label: 'Dikembalikan' },
]

const methodOptions: { value: PaymentMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Metode' },
  { value: 'cash', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'virtual_account', label: 'Virtual Account' },
  { value: 'qris', label: 'QRIS' },
  { value: 'other', label: 'Lainnya' },
]

export function FeePaymentsListClient({ subAppKey }: FeePaymentsListClientProps) {
  const [data, setData] = useState<FeePaymentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')
  const [loading, setLoading] = useState(true)

  const [sheetOpen, setSheetOpen] = useState(false)

  const perPage = 10

  const fetchData = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentStatus: PaymentStatus | 'all',
      currentMethod: PaymentMethod | 'all',
    ) => {
      setLoading(true)
      try {
        const result = await getFeePayments(
          {
            page: currentPage,
            perPage,
            search: currentSearch || undefined,
            status: currentStatus !== 'all' ? currentStatus : undefined,
            paymentMethod: currentMethod !== 'all' ? currentMethod : undefined,
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
    },
    [subAppKey],
  )

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      fetchData(1, search, statusFilter, methodFilter)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, statusFilter, methodFilter, fetchData])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(newPage, search, statusFilter, methodFilter)
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    fetchData(page, search, statusFilter, methodFilter)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa atau no. siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as PaymentStatus | 'all')}
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

          <Select
            value={methodFilter}
            onValueChange={(val) => setMethodFilter(val as PaymentMethod | 'all')}
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
          Catat Pembayaran
        </Button>
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
          onPageChange={handlePageChange}
          onRefresh={() => fetchData(page, search, statusFilter, methodFilter)}
          subAppKey={subAppKey}
        />
      )}

      {/* Sheet form tambah pembayaran */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Catat Pembayaran SPP</SheetTitle>
            <SheetDescription>
              Isi data pembayaran SPP siswa. Jika metode transfer, bukti pembayaran wajib diupload.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FeePaymentForm
              onSuccess={handleFormSuccess}
              onCancel={() => setSheetOpen(false)}
              subAppKey={subAppKey}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
