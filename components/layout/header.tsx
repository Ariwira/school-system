'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MenuIcon, UserIcon, LogOutIcon } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DashboardBreadcrumb } from '@/components/layout/breadcrumb'
import { SidebarContent } from '@/components/layout/sidebar'
import { SubAppSwitcher, type SubappItem } from '@/components/layout/subapp-switcher'
import type { UserRole } from '@/lib/auth-helpers'
import { useState } from 'react'

interface HeaderProps {
  userName: string
  userEmail: string
  userAvatar?: string | null
  userRole: UserRole
  subapps: SubappItem[]
  currentSubappKey?: string | null
  subAppKey?: string
  subappType?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  foundation: 'Yayasan',
  school: 'Sekolah',
}

export function Header({
  userName,
  userEmail,
  userAvatar,
  userRole,
  subapps,
  currentSubappKey,
  subAppKey,
  subappType,
}: HeaderProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Buka menu navigasi"
        onClick={() => setMobileOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>

      {/* Mobile sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Navigasi</SheetTitle>
          </SheetHeader>
          <SidebarContent
            role={userRole}
            onNavigate={() => setMobileOpen(false)}
            subAppKey={subAppKey}
            subappType={subappType}
          />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <div className="flex-1 overflow-hidden">
        <DashboardBreadcrumb />
      </div>

      {/* SubApp Switcher */}
      <SubAppSwitcher
        userRole={userRole}
        subapps={subapps}
        currentKey={currentSubappKey}
      />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Menu pengguna" className="cursor-pointer rounded-full outline-none">
          <Avatar size="default">
            {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground text-sm">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
                <span className="text-xs text-muted-foreground">
                  {ROLE_LABELS[userRole]}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/profile" />}>
              <UserIcon className="size-4" />
              Profil Saya
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOutIcon className="size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
