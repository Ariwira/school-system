'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { FeesTable } from './fees-table'
import { FeeForm } from './fee-form'
import { getFees } from '@/actions/fee.actions'
import type { FeeRow } from '@/lib/validations/fee'

export function FeesListClient() {
  const [data, setData] = useState<FeeRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FeeRow | null>(null)

  const perPage = 10

  const fetchData = useCallback(async (currentPage: number) => {
    setLoading(true)
    try {
      const result = await getFees({ page: currentPage, perPage })

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
  }, [])

  useEffect(() => {
    fetchData(page)
  }, [fetchData, page])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(newPage)
  }

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
    fetchData(page)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
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
          onPageChange={handlePageChange}
          onEdit={handleEdit}
        />
      )}

      {/* Sheet form tambah/edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editTarget ? 'Edit Tarif Biaya' : 'Tambah Tarif Biaya'}
            </SheetTitle>
            <SheetDescription>
              {editTarget
                ? `Perbarui tarif ${editTarget.feeType.toUpperCase()} tahun ${editTarget.year}.`
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
