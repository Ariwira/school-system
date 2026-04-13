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
import { StaffsTable } from './staffs-table'
import { StaffForm } from './staff-form'
import { LinkUserDialog } from './link-user-dialog'
import { getStaffs } from '@/actions/staff.actions'
import type { StaffWithUser, StaffStatus, StaffDepartment } from '@/lib/validations/staff'

interface StaffsListClientProps {
  subAppKey?: string
  instituteId?: string
  isSuperadmin?: boolean
  showInstitute?: boolean
}

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'resigned', label: 'Keluar' },
]

const departmentOptions = [
  { value: 'all', label: 'Semua Departemen' },
  { value: 'academic', label: 'Akademik' },
  { value: 'administration', label: 'Administrasi' },
  { value: 'finance', label: 'Keuangan' },
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'SDM' },
  { value: 'other', label: 'Lainnya' },
]

export function StaffsListClient({
  subAppKey,
  instituteId,
  isSuperadmin = false,
  showInstitute = false,
}: StaffsListClientProps) {
  const searchParams = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const departmentFilter = searchParams.get('department') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<StaffWithUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Sheet states
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffWithUser | null>(null)

  // Link user dialog
  const [linkTarget, setLinkTarget] = useState<StaffWithUser | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const perPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getStaffs(
        {
          page,
          perPage,
          search: search || undefined,
          status: statusFilter !== 'all' ? (statusFilter as StaffStatus) : undefined,
          department: departmentFilter !== 'all' ? (departmentFilter as StaffDepartment) : undefined,
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
      toast.error('Gagal memuat data staf.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, departmentFilter, subAppKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleAddNew() {
    setEditTarget(null)
    setSheetOpen(true)
  }

  function handleEdit(staff: StaffWithUser) {
    setEditTarget(staff)
    setSheetOpen(true)
  }

  function handleLinkUser(staff: StaffWithUser) {
    setLinkTarget(staff)
    setLinkDialogOpen(true)
  }

  function handleFormSuccess() {
    setSheetOpen(false)
    setEditTarget(null)
    fetchData()
  }

  function handleLinkSuccess() {
    fetchData()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Cari nama, no. staf, atau email..."
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
            options={departmentOptions}
            paramKey="department"
            placeholder="Semua Departemen"
            className="w-[175px]"
          />
        </div>

        <Button onClick={handleAddNew}>
          <PlusIcon className="size-4 mr-2" />
          Tambah Staf
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
          Memuat data...
        </div>
      ) : (
        <StaffsTable
          data={data}
          total={total}
          page={page}
          perPage={perPage}
          onEdit={handleEdit}
          onLinkUser={handleLinkUser}
          onRefresh={fetchData}
          subAppKey={subAppKey}
          showInstitute={showInstitute}
        />
      )}

      {/* Sheet form untuk tambah/edit staf */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editTarget ? 'Edit Staf' : 'Tambah Staf Baru'}
            </SheetTitle>
            <SheetDescription>
              {editTarget
                ? `Perbarui data staf ${editTarget.name}.`
                : 'Isi data untuk menambahkan staf baru.'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <StaffForm
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

      {/* Dialog link user */}
      <LinkUserDialog
        staff={linkTarget}
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open)
          if (!open) setLinkTarget(null)
        }}
        onSuccess={handleLinkSuccess}
        subAppKey={subAppKey}
      />
    </div>
  )
}
