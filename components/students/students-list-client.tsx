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
import { SearchInput } from '@/components/data-table/search-input'
import { FilterSelect } from '@/components/data-table/filter-select'
import { StudentsTable } from './students-table'
import { StudentForm } from './student-form'
import { getStudents, getGenerationYears } from '@/actions/student.actions'
import type { StudentRow, StudentStatus } from '@/lib/validations/student'

interface StudentsListClientProps {
  subAppKey?: string
  instituteId?: string
  isSuperadmin?: boolean
  showInstitute?: boolean
}

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'canceled', label: 'Dibatalkan' },
  { value: 'graduated', label: 'Lulus' },
  { value: 'transferred', label: 'Pindah' },
  { value: 'dropped', label: 'Keluar' },
]

export function StudentsListClient({
  subAppKey,
  instituteId,
  isSuperadmin = false,
  showInstitute = false,
}: StudentsListClientProps) {
  const searchParams = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const yearFilter = searchParams.get('year') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<StudentRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StudentRow | null>(null)

  const perPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getStudents(
        {
          page,
          perPage,
          search: search || undefined,
          status: statusFilter !== 'all' ? (statusFilter as StudentStatus) : undefined,
          generationYear: yearFilter !== 'all' ? Number(yearFilter) : undefined,
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
      toast.error('Gagal memuat data siswa.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, yearFilter, subAppKey])

  const fetchYears = useCallback(async () => {
    try {
      const result = await getGenerationYears(subAppKey)
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

  function handleAddNew() {
    setEditTarget(null)
    setSheetOpen(true)
  }

  function handleEdit(student: StudentRow) {
    setEditTarget(student)
    setSheetOpen(true)
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    setEditTarget(null)
    fetchData()
    fetchYears()
  }

  const yearOptions = [
    { value: 'all', label: 'Semua Angkatan' },
    ...availableYears.map((y) => ({ value: String(y), label: `Angkatan ${y}` })),
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Cari nama, NISN, atau no. siswa..."
            paramKey="search"
            className="max-w-sm"
          />
          <FilterSelect
            options={statusOptions}
            paramKey="status"
            placeholder="Semua Status"
            className="w-[160px]"
          />
          {availableYears.length > 0 && (
            <FilterSelect
              options={yearOptions}
              paramKey="year"
              placeholder="Semua Angkatan"
              className="w-[155px]"
            />
          )}
        </div>

        <Button onClick={handleAddNew}>
          <PlusIcon className="size-4 mr-2" />
          Tambah Siswa
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
          Memuat data...
        </div>
      ) : (
        <StudentsTable
          data={data}
          total={total}
          page={page}
          perPage={perPage}
          onEdit={handleEdit}
          onRefresh={fetchData}
          subAppKey={subAppKey}
          showInstitute={showInstitute}
        />
      )}

      {/* Sheet form tambah/edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editTarget ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            </SheetTitle>
            <SheetDescription>
              {editTarget
                ? `Perbarui data siswa ${editTarget.name}.`
                : 'Isi data untuk menambahkan siswa baru.'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <StudentForm
              mode={editTarget ? 'edit' : 'create'}
              defaultValues={editTarget ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setSheetOpen(false)}
              subAppKey={subAppKey}
              instituteId={instituteId}
              isSuperadmin={isSuperadmin}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
