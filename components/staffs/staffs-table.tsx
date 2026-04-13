'use client'

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import {
  UserCheckIcon,
  UserXIcon,
  PencilIcon,
  PowerOffIcon,
  PowerIcon,
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
import { toggleStaffStatus, unlinkUserAccount } from '@/actions/staff.actions'
import type { StaffWithUser } from '@/lib/validations/staff'

interface StaffsTableProps {
  data: StaffWithUser[]
  total: number
  page: number
  perPage: number
  onEdit: (staff: StaffWithUser) => void
  onLinkUser: (staff: StaffWithUser) => void
  onRefresh: () => void
  subAppKey?: string
  showInstitute?: boolean
}

const departmentLabels: Record<string, string> = {
  academic: 'Akademik',
  administration: 'Administrasi',
  finance: 'Keuangan',
  it: 'IT',
  hr: 'SDM',
  other: 'Lainnya',
}

const statusConfig = {
  active: { label: 'Aktif', variant: 'default' as const },
  inactive: { label: 'Tidak Aktif', variant: 'secondary' as const },
  resigned: { label: 'Resign', variant: 'outline' as const },
}

export function StaffsTable({
  data,
  total,
  page,
  perPage,
  onEdit,
  onLinkUser,
  onRefresh,
  subAppKey,
  showInstitute = false,
}: StaffsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [toggleTarget, setToggleTarget] = useState<StaffWithUser | null>(null)
  const [unlinkTarget, setUnlinkTarget] = useState<StaffWithUser | null>(null)

  const handleToggleStatus = useCallback(() => {
    if (!toggleTarget) return

    startTransition(async () => {
      const result = await toggleStaffStatus(toggleTarget.id, subAppKey)
      if (result.success) {
        const newStatus = result.data.status === 'active' ? 'aktif' : 'tidak aktif'
        toast.success(`Status staf "${toggleTarget.name}" diubah menjadi ${newStatus}.`)
        setToggleTarget(null)
        onRefresh()
      } else {
        toast.error(result.error)
        setToggleTarget(null)
      }
    })
  }, [toggleTarget, subAppKey, onRefresh])

  const handleUnlink = useCallback(() => {
    if (!unlinkTarget) return

    startTransition(async () => {
      const result = await unlinkUserAccount(unlinkTarget.id, subAppKey)
      if (result.success) {
        toast.success(`Akun user berhasil dilepas dari staf "${unlinkTarget.name}".`)
        setUnlinkTarget(null)
        onRefresh()
      } else {
        toast.error(result.error)
        setUnlinkTarget(null)
      }
    })
  }, [unlinkTarget, subAppKey, onRefresh])

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>No. Staf</TableHead>
              {showInstitute && <TableHead>Institusi</TableHead>}
              <TableHead>Departemen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Akun</TableHead>
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
                  Belum ada data staf.
                </TableCell>
              </TableRow>
            ) : (
              data.map((staff) => {
                const statusInfo = statusConfig[staff.status]
                return (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-xs text-muted-foreground">{staff.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{staff.staffNumber}</TableCell>
                    {showInstitute && (
                      <TableCell className="text-sm">{staff.instituteName}</TableCell>
                    )}
                    <TableCell>
                      <span className="text-sm">
                        {departmentLabels[staff.department] ?? staff.department}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {staff.userId ? (
                        <Badge variant="outline" className="text-xs gap-1">
                          <UserCheckIcon className="size-3" />
                          {staff.userName ?? 'Terhubung'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Belum terhubung</span>
                      )}
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
                            <DropdownMenuItem onClick={() => onEdit(staff)}>
                              <PencilIcon className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            {staff.userId ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setUnlinkTarget(staff)}
                              >
                                <UserXIcon className="size-4" />
                                Lepas Akun
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => onLinkUser(staff)}>
                                <UserCheckIcon className="size-4" />
                                Link Akun
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                          {staff.status !== 'resigned' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                {staff.status === 'active' ? (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setToggleTarget(staff)}
                                  >
                                    <PowerOffIcon className="size-4" />
                                    Nonaktifkan
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setToggleTarget(staff)}>
                                    <PowerIcon className="size-4" />
                                    Aktifkan
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
        itemLabel="staf"
      />

      {/* Dialog konfirmasi toggle status */}
      <Dialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'} Staf
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin{' '}
              {toggleTarget?.status === 'active' ? 'menonaktifkan' : 'mengaktifkan'} staf{' '}
              <strong>{toggleTarget?.name}</strong>?
              {toggleTarget?.status === 'active' &&
                ' Staf yang tidak aktif tidak dapat login meskipun memiliki akun.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggleTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button onClick={handleToggleStatus} disabled={isPending}>
              {isPending
                ? 'Memproses...'
                : toggleTarget?.status === 'active'
                  ? 'Nonaktifkan'
                  : 'Aktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi unlink user */}
      <Dialog
        open={!!unlinkTarget}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lepas Akun User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin melepas hubungan akun{' '}
              <strong>{unlinkTarget?.userName}</strong> dari staf{' '}
              <strong>{unlinkTarget?.name}</strong>? User tidak akan lagi memiliki akses ke
              sub-aplikasi terkait staf ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnlinkTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleUnlink} disabled={isPending}>
              {isPending ? 'Memproses...' : 'Lepas Akun'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
