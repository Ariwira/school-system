'use client'

import { useRouter } from 'next/navigation'
import { ChevronDownIcon, BuildingIcon, SchoolIcon, ShieldIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserRole } from '@/lib/auth-helpers'

export type SubappItem = {
  id: string
  key: string
  type: string
  name: string | null
  image: string | null
  instituteId: string | null
}

interface SubAppSwitcherProps {
  userRole: UserRole
  subapps: SubappItem[]
  currentKey?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  foundation: 'Yayasan',
  school: 'Sekolah',
}

function SubappIcon({ type }: { type: string }) {
  if (type === 'superadmin') return <ShieldIcon className="size-4 shrink-0 text-muted-foreground" />
  if (type === 'foundation') return <BuildingIcon className="size-4 shrink-0 text-muted-foreground" />
  return <SchoolIcon className="size-4 shrink-0 text-muted-foreground" />
}

function getSubappInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function SubAppSwitcher({
  userRole,
  subapps,
  currentKey,
}: SubAppSwitcherProps) {
  const router = useRouter()

  function handleNavigate(key: string, type: string) {
    if (type === 'superadmin') {
      router.push('/superadmin/institutes')
    } else if (type === 'foundation') {
      router.push(`/foundation/${key}`)
    } else {
      router.push(`/school/${key}`)
    }
  }

  // Tidak punya subapp dan bukan superadmin
  if (userRole !== 'superadmin' && subapps.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
        <span className="text-sm text-muted-foreground">Belum ada akses</span>
      </div>
    )
  }

  // Tentukan item yang sedang aktif
  const currentSubapp = currentKey ? subapps.find((s) => s.key === currentKey) : null
  const isOnSuperadminPanel = !currentKey && userRole === 'superadmin'

  // Label yang ditampilkan di trigger button
  const triggerLabel = isOnSuperadminPanel
    ? 'Super Admin'
    : (currentSubapp?.name ?? currentSubapp?.key ?? (userRole === 'superadmin' ? 'Super Admin' : subapps[0]?.name ?? 'SubApp'))

  const triggerType = isOnSuperadminPanel
    ? 'superadmin'
    : (currentSubapp?.type ?? (userRole === 'superadmin' ? 'superadmin' : subapps[0]?.type ?? ''))

  const triggerImage = isOnSuperadminPanel ? null : (currentSubapp?.image ?? subapps[0]?.image ?? null)

  // Hanya 1 subapp dan bukan superadmin — tampil label saja tanpa dropdown
  if (userRole !== 'superadmin' && subapps.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
        <Avatar size="sm">
          {triggerImage && <AvatarImage src={triggerImage} alt={triggerLabel} />}
          <AvatarFallback className="text-xs">{getSubappInitials(triggerLabel)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{triggerLabel}</span>
        <Badge variant="secondary" className="text-xs">
          {TYPE_LABELS[triggerType] ?? triggerType}
        </Badge>
      </div>
    )
  }

  // Superadmin atau lebih dari 1 subapp — tampilkan dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Pilih panel"
        className="flex h-auto items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {triggerType === 'superadmin' ? (
          <ShieldIcon className="size-4 text-muted-foreground" />
        ) : (
          <Avatar size="sm">
            {triggerImage && <AvatarImage src={triggerImage} alt={triggerLabel} />}
            <AvatarFallback className="text-xs">{getSubappInitials(triggerLabel)}</AvatarFallback>
          </Avatar>
        )}
        <span className="text-sm font-medium">{triggerLabel}</span>
        <Badge variant="secondary" className="text-xs">
          {TYPE_LABELS[triggerType] ?? triggerType}
        </Badge>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Pindah Panel
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* Panel Superadmin — hanya tampil jika user adalah superadmin */}
        {userRole === 'superadmin' && (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => handleNavigate('superadmin', 'superadmin')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                <ShieldIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">Super Admin</span>
                <span className="text-xs text-muted-foreground">Panel administrasi</span>
              </div>
              {isOnSuperadminPanel && (
                <span className="size-2 rounded-full bg-primary shrink-0" />
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        {subapps.length > 0 && userRole === 'superadmin' && (
          <DropdownMenuSeparator />
        )}

        <DropdownMenuGroup>
          {subapps.map((subapp) => {
            const isActive = currentSubapp?.id === subapp.id
            return (
              <DropdownMenuItem
                key={subapp.id}
                onClick={() => handleNavigate(subapp.key, subapp.type)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Avatar size="sm">
                  {subapp.image && <AvatarImage src={subapp.image} alt={subapp.name ?? ''} />}
                  <AvatarFallback className="text-xs">{getSubappInitials(subapp.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{subapp.name ?? subapp.key}</span>
                  <div className="flex items-center gap-1.5">
                    <SubappIcon type={subapp.type} />
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABELS[subapp.type] ?? subapp.type}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <span className="size-2 rounded-full bg-primary shrink-0" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
