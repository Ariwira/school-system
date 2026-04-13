'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanIcon,
  EyeIcon,
  MoreHorizontalIcon,
} from 'lucide-react'
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
import {
  activateStudent,
  deactivateStudent,
  cancelStudent,
} from '@/actions/student.actions'
import type { StudentRow, StudentStatus } from '@/lib/validations/student'

interface StudentsTableProps {
  data: StudentRow[]
  total: number
  page: number
  perPage: number
  onEdit: (student: StudentRow) => void
  onRefresh: () => void
  subAppKey?: string
  showInstitute?: boolean
}

const statusConfig: Record<
  StudentStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  active: { label: 'Aktif', variant: 'default' },
  inactive: { label: 'Tidak Aktif', variant: 'outline' },
  canceled: { label: 'Dibatalkan', variant: 'destructive' },
  graduated: { label: 'Lulus', variant: 'outline' },
  transferred: { label: 'Pindah', variant: 'outline' },
  dropped: { label: 'Keluar', variant: 'outline' },
}

type ConfirmAction = {
  type: 'activate' | 'deactivate' | 'cancel'
  student: StudentRow
}

export function StudentsTable({
  data,
  total,
  page,
  perPage,
  onEdit,
  onRefresh,
  subAppKey,
  showInstitute = false,
}: StudentsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const handleConfirm = useCallback(() => {
    if (!confirmAction) return

    startTransition(async () => {
      const { type, student } = confirmAction
      let result: { success: boolean; error?: string }

      if (type === 'activate') {
        result = await activateStudent(student.id, subAppKey)
        if (result.success) {
          toast.success(`Siswa "${student.name}" berhasil diaktifkan.`)
        }
      } else if (type === 'deactivate') {
        result = await deactivateStudent(student.id, subAppKey)
        if (result.success) {
          toast.success(`Siswa "${student.name}" berhasil dinonaktifkan.`)
        }
      } else {
        result = await cancelStudent(student.id, subAppKey)
        if (result.success) {
          toast.success(`Pendaftaran siswa "${student.name}" berhasil dibatalkan.`)
        }
      }

      if (!result.success && result.error) {
        toast.error(result.error)
      }

      setConfirmAction(null)
      onRefresh()
    })
  }, [confirmAction, subAppKey, onRefresh])

  function getDetailHref(student: StudentRow): string {
    if (subAppKey) {
      return `/school/${subAppKey}/students/${student.id}`
    }
    return `/superadmin/students/${student.id}`
  }

  function getConfirmDialogContent() {
    if (!confirmAction) return null
    const { type, student } = confirmAction

    if (type === 'activate') {
      return {
        title: 'Aktifkan Siswa',
        description: (
          <>
            Apakah Anda yakin ingin mengaktifkan siswa <strong>{student.name}</strong>? Status
            akan berubah dari <em>pending</em> menjadi <em>aktif</em>.
          </>
        ),
        confirmLabel: 'Aktifkan',
        variant: 'default' as const,
      }
    }
    if (type === 'deactivate') {
      return {
        title: 'Nonaktifkan Siswa',
        description: (
          <>
            Apakah Anda yakin ingin menonaktifkan siswa <strong>{student.name}</strong>? Status
            tidak dapat dikembalikan menjadi aktif.
          </>
        ),
        confirmLabel: 'Nonaktifkan',
        variant: 'default' as const,
      }
    }
    return {
      title: 'Batalkan Pendaftaran',
      description: (
        <>
          Apakah Anda yakin ingin membatalkan pendaftaran siswa <strong>{student.name}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </>
      ),
      confirmLabel: 'Batalkan Pendaftaran',
      variant: 'destructive' as const,
    }
  }

  const dialogContent = getConfirmDialogContent()

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead>No. Siswa</TableHead>
              {showInstitute && <TableHead>Institusi</TableHead>}
              <TableHead>Angkatan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showInstitute ? 7 : 6}
                  className="text-center text-muted-foreground py-10"
                >
                  Belum ada data siswa.
                </TableCell>
              </TableRow>
            ) : (
              data.map((student) => {
                const statusInfo = statusConfig[student.status]
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        {student.email && (
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{student.nisn}</TableCell>
                    <TableCell className="text-sm">{student.studentNumber}</TableCell>
                    {showInstitute && (
                      <TableCell className="text-sm">{student.instituteName}</TableCell>
                    )}
                    <TableCell className="text-sm">{student.generationYear}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
                            <DropdownMenuItem render={<Link href={getDetailHref(student)} />}>
                              <EyeIcon className="size-4" />
                              Detail Siswa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(student)}>
                              <PencilIcon className="size-4" />
                              Edit Data
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          {(student.status === 'pending' || student.status === 'active') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                {student.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ type: 'activate', student })}
                                  >
                                    <CheckCircleIcon className="size-4" />
                                    Aktifkan
                                  </DropdownMenuItem>
                                )}
                                {student.status === 'active' && (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setConfirmAction({ type: 'deactivate', student })}
                                  >
                                    <XCircleIcon className="size-4" />
                                    Nonaktifkan
                                  </DropdownMenuItem>
                                )}
                                {student.status === 'pending' && (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setConfirmAction({ type: 'cancel', student })}
                                  >
                                    <BanIcon className="size-4" />
                                    Batalkan
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginasi */}
      <UrlPagination
        total={total}
        page={page}
        perPage={perPage}
        itemLabel="siswa"
      />

      {/* Dialog konfirmasi aksi status */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>
              {dialogContent?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              variant={dialogContent?.variant ?? 'default'}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? 'Memproses...' : dialogContent?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
