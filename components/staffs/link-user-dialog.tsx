'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { linkUserAccount, getAvailableUsers } from '@/actions/staff.actions'
import type { StaffWithUser } from '@/lib/validations/staff'

interface LinkUserDialogProps {
  staff: StaffWithUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  subAppKey?: string
}

export function LinkUserDialog({
  staff,
  open,
  onOpenChange,
  onSuccess,
  subAppKey,
}: LinkUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [availableUsers, setAvailableUsers] = useState<
    { id: string; name: string; email: string }[]
  >([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !staff) {
      setAvailableUsers([])
      setSearch('')
      setSelectedUserId(null)
      return
    }

    setLoadingUsers(true)
    getAvailableUsers(staff.instituteId, subAppKey)
      .then((result) => {
        if (result.success) {
          setAvailableUsers(result.data)
        } else {
          toast.error(result.error)
        }
      })
      .catch(() => toast.error('Gagal memuat daftar user.'))
      .finally(() => setLoadingUsers(false))
  }, [open, staff, subAppKey])

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  function handleLink() {
    if (!staff || !selectedUserId) return

    startTransition(async () => {
      const result = await linkUserAccount(staff.id, selectedUserId, subAppKey)
      if (result.success) {
        toast.success(`Akun user berhasil dihubungkan ke staf "${staff.name}".`)
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hubungkan Akun User</DialogTitle>
          <DialogDescription>
            Pilih akun user yang akan dihubungkan ke staf{' '}
            <strong>{staff?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* User list */}
          <div className="max-h-64 overflow-y-auto rounded-md border">
            {loadingUsers ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Memuat daftar user...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {availableUsers.length === 0
                  ? 'Tidak ada user yang tersedia untuk institusi ini.'
                  : 'Tidak ada user yang cocok dengan pencarian.'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-muted transition-colors border-b last:border-b-0 ${
                    selectedUserId === user.id ? 'bg-muted' : ''
                  }`}
                >
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </button>
              ))
            )}
          </div>

          {selectedUserId && (
            <p className="text-xs text-muted-foreground">
              User terpilih:{' '}
              <strong>
                {availableUsers.find((u) => u.id === selectedUserId)?.name}
              </strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button onClick={handleLink} disabled={!selectedUserId || isPending}>
            {isPending ? 'Menghubungkan...' : 'Hubungkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
