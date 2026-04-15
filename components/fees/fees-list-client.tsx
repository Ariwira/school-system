'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/data-table/filter-select'
import { FeesTable } from './fees-table'
import { getFees, getFeeYears } from '@/actions/fee.actions'
import type { FeeRow, FeeType } from '@/lib/validations/fee'

const feeTypeOptions = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'registration', label: 'Pendaftaran' },
  { value: 'spp', label: 'SPP' },
  { value: 'building', label: 'Gedung' },
  { value: 'uniform', label: 'Seragam' },
  { value: 'book', label: 'Buku' },
  { value: 'activity', label: 'Kegiatan' },
  { value: 'other', label: 'Lainnya' },
]

export function FeesListClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const feeTypeFilter = searchParams.get('feeType') ?? 'all'
  const yearFilter = searchParams.get('year') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<FeeRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const perPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getFees({
        page,
        perPage,
        feeType: feeTypeFilter !== 'all' ? (feeTypeFilter as FeeType) : undefined,
        year: yearFilter !== 'all' ? Number(yearFilter) : undefined,
      })

      if (result.success) {
        setData(result.data.data)
        setTotal(result.data.total)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Gagal memuat data tarif biaya.')
    } finally {
      setLoading(false)
    }
  }, [page, feeTypeFilter, yearFilter])

  const fetchYears = useCallback(async () => {
    try {
      const result = await getFeeYears()
      if (result.success) {
        setAvailableYears(result.data)
      }
    } catch {
      // silent — non-critical
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchYears()
  }, [fetchYears])

  function handleAddNew() {
    router.push('/superadmin/fees/new')
  }

  function handleEdit(fee: FeeRow) {
    router.push(`/superadmin/fees/${fee.id}/edit`)
  }

  const yearOptions = [
    { value: 'all', label: 'Semua Tahun' },
    ...availableYears.map((y) => ({ value: String(y), label: String(y) })),
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <FilterSelect
            options={feeTypeOptions}
            paramKey="feeType"
            placeholder="Semua Tipe"
            className="w-[140px]"
          />
          {availableYears.length > 0 && (
            <FilterSelect
              options={yearOptions}
              paramKey="year"
              placeholder="Semua Tahun"
              className="w-[140px]"
            />
          )}
        </div>

        <Button onClick={handleAddNew}>
          <PlusIcon className="size-4 mr-2" />
          Tambah Tarif
        </Button>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
          Memuat data...
        </div>
      ) : (
        <FeesTable
          data={data}
          total={total}
          page={page}
          perPage={perPage}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}