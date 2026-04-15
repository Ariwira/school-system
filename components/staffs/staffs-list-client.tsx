'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/data-table/search-input'
import { FilterSelect } from '@/components/data-table/filter-select'
import { StaffsTable } from './staffs-table'
import { LinkUserDialog } from './link-user-dialog'
import { getStaffs } from '@/actions/staff.actions'
import type { StaffWithUser, StaffStatus, StaffDepartment } from '@/lib/validations/staff'

interface StaffsListClientProps {
  subAppKey?: string
  showInstitute?: boolean
  /** Base path untuk navigasi form tambah/edit, contoh: /superadmin/staffs */
  basePath: string
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
  showInstitute = false,
  basePath,
}: StaffsListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const departmentFilter = searchParams.get('department') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<StaffWithUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

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
    router.push(`${basePath}/new`)
  }

  function handleEdit(staff: StaffWithUser) {
    router.push(`${basePath}/${staff.id}/edit`)
  }

  function handleLinkUser(staff: StaffWithUser) {
    setLinkTarget(staff)
    setLinkDialogOpen(true)
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
