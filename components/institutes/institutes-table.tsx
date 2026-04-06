'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PencilIcon, PowerOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { deactivateInstitute } from '@/actions/institute.actions'
import type { InstituteWithParent } from '@/lib/validations/institute'

interface InstitutesTableProps {
  data: InstituteWithParent[]
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
}

export function InstitutesTable({
  data,
  total,
  page,
  perPage,
  onPageChange,
}: InstitutesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deactivateTarget, setDeactivateTarget] = useState<InstituteWithParent | null>(null)

  const totalPages = Math.ceil(total / perPage)

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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/superadmin/institutes/${institute.id}`)
                        }
                      >
                        <PencilIcon className="size-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeactivateTarget(institute)}
                      >
                        <PowerOffIcon className="size-3.5 mr-1" />
                        Nonaktifkan
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginasi */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} dari{' '}
            {total} institusi
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => onPageChange(page - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => onPageChange(page + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

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
