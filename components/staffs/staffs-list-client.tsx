'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StaffsTable } from './staffs-table'
import { StaffForm } from './staff-form'
import { LinkUserDialog } from './link-user-dialog'
import { getStaffs } from '@/actions/staff.actions'
import type { StaffWithUser } from '@/lib/validations/staff'

interface StaffsListClientProps {
  subAppKey?: string
  instituteId?: string
  isSuperadmin?: boolean
  showInstitute?: boolean
}

export function StaffsListClient({
  subAppKey,
  instituteId,
  isSuperadmin = false,
  showInstitute = false,
}: StaffsListClientProps) {
  const [data, setData] = useState<StaffWithUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Sheet states
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffWithUser | null>(null)

  // Link user dialog
  const [linkTarget, setLinkTarget] = useState<StaffWithUser | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const perPage = 10

  const fetchData = useCallback(
    async (currentPage: number, currentSearch: string) => {
      setLoading(true)
      try {
        const result = await getStaffs(
          {
            page: currentPage,
            perPage,
            search: currentSearch || undefined,
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
    },
    [subAppKey],
  )

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      fetchData(1, search)
    }, 400)

    return () => clearTimeout(timeout)
  }, [search, fetchData])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(newPage, search)
  }

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
    fetchData(page, search)
  }

  function handleLinkSuccess() {
    fetchData(page, search)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, no. staf, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
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
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onLinkUser={handleLinkUser}
          onRefresh={() => fetchData(page, search)}
          subAppKey={subAppKey}
          showInstitute={showInstitute}
        />
      )}

      {/* Sheet form untuk tambah/edit staf */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
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
