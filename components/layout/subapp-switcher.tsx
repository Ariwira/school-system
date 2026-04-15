'use client'

import { useRouter } from 'next/navigation'
import { ChevronDownIcon, BuildingIcon, SchoolIcon } from 'lucide-react'
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
  if (type === 'foundation') {
    return <BuildingIcon className="size-4 shrink-0 text-muted-foreground" />
  }
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

  // Superadmin — tampilkan dropdown dengan Superadmin Panel + semua institusi
  if (userRole === 'superadmin') {
    const currentSubapp = currentKey
      ? subapps.find((s) => s.key === currentKey)
      : null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Pilih Panel"
          className="flex h-auto items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {currentSubapp ? (
            <>
              <SubappIcon type={currentSubapp.type} />
              <span className="text-sm font-medium">
                {currentSubapp.name ?? currentSubapp.key}
              </span>
              <Badge variant="secondary" className="text-xs">
                {TYPE_LABELS[currentSubapp.type] ?? currentSubapp.type}
              </Badge>
            </>
          ) : (
            <>
              <BuildingIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Super Admin</span>
            </>
          )}
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Panel
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push('/superadmin/institutes')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <BuildingIcon className="size-4 shrink-0 text-muted-foreground" />
              <span>Superadmin Panel</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {subapps.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Institusi
                </DropdownMenuLabel>
                {subapps.map((subapp) => (
                  <DropdownMenuItem
                    key={subapp.id}
                    onClick={() => handleNavigate(subapp)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar size="sm">
                      {subapp.image && (
                        <AvatarImage
                          src={subapp.image}
                          alt={subapp.name ?? ''}
                        />
                      )}
                      <AvatarFallback className="text-xs">
                        {getSubappInitials(subapp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {subapp.name ?? subapp.key}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <SubappIcon type={subapp.type} />
                        <span className="text-xs text-muted-foreground">
                          {TYPE_LABELS[subapp.type] ?? subapp.type}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Tidak punya subapp sama sekali
  if (subapps.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
        <span className="text-sm text-muted-foreground">Belum ada akses</span>
      </div>
    )
  }

  const current = currentKey
    ? subapps.find((s) => s.key === currentKey)
    : subapps[0]

  const displaySubapp = current ?? subapps[0]

  function handleNavigate(subapp: SubappItem) {
    const path =
      subapp.type === 'foundation'
        ? `/foundation/${subapp.key}`
        : `/school/${subapp.key}`
    router.push(path)
  }

  // Hanya 1 subapp — tampil label saja tanpa dropdown
  if (subapps.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
        <Avatar size="sm">
          {displaySubapp.image && (
            <AvatarImage
              src={displaySubapp.image}
              alt={displaySubapp.name ?? ''}
            />
          )}
          <AvatarFallback className="text-xs">
            {getSubappInitials(displaySubapp.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-medium">
            {displaySubapp.name ?? displaySubapp.key}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {TYPE_LABELS[displaySubapp.type] ?? displaySubapp.type}
        </Badge>
      </div>
    )
  }

  // Lebih dari 1 subapp — tampilkan dropdown switcher
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Pilih SubApp"
        className="flex h-auto items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Avatar size="sm">
          {displaySubapp.image && (
            <AvatarImage
              src={displaySubapp.image}
              alt={displaySubapp.name ?? ''}
            />
          )}
          <AvatarFallback className="text-xs">
            {getSubappInitials(displaySubapp.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start leading-none">
          <span className="text-sm font-medium">
            {displaySubapp.name ?? displaySubapp.key}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {TYPE_LABELS[displaySubapp.type] ?? displaySubapp.type}
        </Badge>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Pilih Sub-Aplikasi
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {subapps.map((subapp) => {
          const isActive = displaySubapp.id === subapp.id
          return (
            <DropdownMenuItem
              key={subapp.id}
              onClick={() => handleNavigate(subapp)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Avatar size="sm">
                {subapp.image && (
                  <AvatarImage src={subapp.image} alt={subapp.name ?? ''} />
                )}
                <AvatarFallback className="text-xs">
                  {getSubappInitials(subapp.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {subapp.name ?? subapp.key}
                </span>
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
