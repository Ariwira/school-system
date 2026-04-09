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

const statusOptions: { value: StudentStatus | 'all'; label: string }[] = [
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
  const [data, setData] = useState<StudentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')

  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StudentRow | null>(null)

  const perPage = 10

  const fetchData = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      currentStatus: StudentStatus | 'all',
      currentYear: string,
    ) => {
      setLoading(true)
      try {
        const result = await getStudents(
          {
            page: currentPage,
            perPage,
            search: currentSearch || undefined,
            status: currentStatus !== 'all' ? currentStatus : undefined,
            generationYear:
              currentYear !== 'all' ? Number(currentYear) : undefined,
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
    },
    [subAppKey],
  )

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

  // Initial load and debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      fetchData(1, search, statusFilter, yearFilter)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, statusFilter, yearFilter, fetchData])

  useEffect(() => {
    fetchYears()
  }, [fetchYears])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(newPage, search, statusFilter, yearFilter)
  }

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
    fetchData(page, search, statusFilter, yearFilter)
    fetchYears()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NISN, atau no. siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StudentStatus | 'all')}
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

          {availableYears.length > 0 && (
            <Select
              value={yearFilter}
              onValueChange={(val) => setYearFilter(val ?? 'all')}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Semua Angkatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Angkatan</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    Angkatan {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onRefresh={() => fetchData(page, search, statusFilter, yearFilter)}
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
