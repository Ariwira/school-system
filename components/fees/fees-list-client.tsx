'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FilterSelect } from '@/components/data-table/filter-select'
import { FeesTable } from './fees-table'
import { FeeForm } from './fee-form'
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
  const searchParams = useSearchParams()

  const feeTypeFilter = searchParams.get('feeType') ?? 'all'
  const yearFilter = searchParams.get('year') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<FeeRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FeeRow | null>(null)

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
    setEditTarget(null)
    setSheetOpen(true)
  }

  function handleEdit(fee: FeeRow) {
    setEditTarget(fee)
    setSheetOpen(true)
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    setEditTarget(null)
    fetchData()
    fetchYears()
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

      {/* Sheet form tambah/edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editTarget ? 'Edit Tarif Biaya' : 'Tambah Tarif Biaya'}
            </SheetTitle>
            <SheetDescription>
              {editTarget
                ? `Perbarui tarif ${editTarget.feeType.toUpperCase()} ${editTarget.year} Sem ${editTarget.semester === 1 ? 'Ganjil' : 'Genap'}.`
                : 'Isi data untuk mendefinisikan tarif biaya baru.'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FeeForm
              mode={editTarget ? 'edit' : 'create'}
              defaultValues={editTarget ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
