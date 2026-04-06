'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BuildingIcon,
  UsersIcon,
  GraduationCapIcon,
  CreditCardIcon,
  ReceiptIcon,
  ArrowLeftRightIcon,
  SchoolIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type UserRole = 'superadmin' | 'user'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

// Nav items untuk superadmin.
// User (foundation/school) mendapatkan nav dari sub-app specific layout.
const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  superadmin: [
    {
      label: 'Institusi',
      href: '/superadmin/institutes',
      icon: <BuildingIcon className="size-4" />,
    },
    {
      label: 'Staf',
      href: '/superadmin/staffs',
      icon: <UsersIcon className="size-4" />,
    },
    {
      label: 'Siswa',
      href: '/superadmin/students',
      icon: <GraduationCapIcon className="size-4" />,
    },
    {
      label: 'Biaya',
      href: '/superadmin/fees',
      icon: <CreditCardIcon className="size-4" />,
    },
    {
      label: 'Pembayaran SPP',
      href: '/superadmin/fee-payments',
      icon: <ReceiptIcon className="size-4" />,
    },
    {
      label: 'Transfer Dana',
      href: '/superadmin/transfers',
      icon: <ArrowLeftRightIcon className="size-4" />,
    },
  ],
  user: [],
}

interface SidebarNavProps {
  role: UserRole
  onNavigate?: () => void
}

export function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role] ?? []

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

interface SidebarContentProps {
  role: UserRole
  onNavigate?: () => void
}

export function SidebarContent({ role, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col gap-4 py-4">
      {/* Logo / App name */}
      <div className="flex items-center gap-2 px-6">
        <SchoolIcon className="size-6 text-primary" />
        <span className="text-base font-semibold tracking-tight">
          School ERP
        </span>
      </div>

      <div className="h-px bg-border mx-3" />

      <SidebarNav role={role} onNavigate={onNavigate} />
    </div>
  )
}

interface SidebarDesktopProps {
  role: UserRole
}

export function SidebarDesktop({ role }: SidebarDesktopProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:border-r lg:bg-background lg:shrink-0">
      <SidebarContent role={role} />
    </aside>
  )
}
