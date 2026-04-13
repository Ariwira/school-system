'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PencilIcon, PowerOffIcon, MoreHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UrlPagination } from '@/components/data-table/url-pagination'
import { deactivateInstitute } from '@/actions/institute.actions'
import type { InstituteWithParent } from '@/lib/validations/institute'

interface InstitutesTableProps {
  data: InstituteWithParent[]
  total: number
  page: number
  perPage: number
}

export function InstitutesTable({
  data,
  total,
  page,
  perPage,
}: InstitutesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deactivateTarget, setDeactivateTarget] = useState<InstituteWithParent | null>(null)

  const handleDeactivate = useCallback(() => {
    if (!deactivateTarget) return

    startTransition(async () => {
      const result = await deactivateInstitute(deactivateTarget.id)
      if (result.success) {
        toast.success(`Institusi "${deactivateTarget.name}" berhasil divalidasi.`)
        setDeactivateTarget(null)
        router.refresh()
      } else {
        toast.error(result.error)
        setDeactivateTarget(null)
      }
    })
  }, [deactivateTarget, router])

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Makassar', // WITA
    })
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Yayasan Induk</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-10"
                >
                  Belum ada data institusi.
                </TableCell>
              </TableRow>
            ) : (
              data.map((institute) => (
                <TableRow key={institute.id}>
                  <TableCell className="font-medium">{institute.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={institute.type === 'foundation' ? 'default' : 'secondary'}
                    >
                      {institute.type === 'foundation' ? 'Yayasan' : 'Sekolah'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {institute.parentName ? (
                      <span className="text-sm">{institute.parentName}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>{institute.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(institute.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="outline" size="icon-sm" />}
                        disabled={isPending}
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => router.push(`/superadmin/institutes/${institute.id}`)}
                          >
                            <PencilIcon className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeactivateTarget(institute)}
                          >
                            <PowerOffIcon className="size-4" />
                            Nonaktifkan
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginasi */}
      <UrlPagination
        total={total}
        page={page}
        perPage={perPage}
        itemLabel="institusi"
      />

      {/* Dialog konfirmasi deactivate */}
      <Dialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan Institusi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menonaktifkan institusi{' '}
              <strong>{deactivateTarget?.name}</strong>? Institusi tidak dapat
              dinonaktifkan jika masih memiliki staf atau siswa aktif.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isPending}
            >
              {isPending ? 'Memproses...' : 'Nonaktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
