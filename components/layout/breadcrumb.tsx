'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRightIcon, HomeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const SEGMENT_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  foundation: 'Yayasan',
  school: 'Sekolah',
  institutes: 'Institusi',
  staffs: 'Staf',
  students: 'Siswa',
  fees: 'Biaya',
  'fee-payments': 'Pembayaran SPP',
  transfers: 'Transfer Dana',
  profile: 'Profil',
  new: 'Tambah',
  edit: 'Ubah',
}

function formatSegment(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter(
      (seg) =>
        // Skip dynamic route-like segments that look like UUIDs or IDs
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          seg
        )
    )

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = formatSegment(segment)
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Beranda"
      >
        <HomeIcon className="size-4" />
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRightIcon className="size-3.5 shrink-0" />
          {crumb.isLast ? (
            <span
              className="font-medium text-foreground"
              aria-current="page"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className={cn('hover:text-foreground transition-colors')}
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
