'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MonitorIcon, SmartphoneIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { revokeSession } from '@/actions/profile.actions'

interface SessionItem {
  id: string
  token: string
  ipAddress: string | null | undefined
  userAgent: string | null | undefined
  createdAt: Date
  expiresAt: Date
}

interface ActiveSessionsProps {
  sessions: SessionItem[]
  currentToken: string
}

function detectDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Perangkat Tidak Diketahui'
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Perangkat Mobile'
  }
  return 'Desktop / Browser'
}

function detectBrowser(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Browser Tidak Diketahui'
  const ua = userAgent.toLowerCase()
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('chrome')) return 'Chrome'
  if (ua.includes('safari')) return 'Safari'
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera'
  return 'Browser Lain'
}

function isMobile(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')
}

function formatWITA(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function ActiveSessions({ sessions, currentToken }: ActiveSessionsProps) {
  const [sessionList, setSessionList] = useState<SessionItem[]>(sessions)
  const [revokingTokens, setRevokingTokens] = useState<Set<string>>(new Set())

  async function handleRevoke(token: string) {
    setRevokingTokens((prev) => new Set(prev).add(token))
    try {
      const result = await revokeSession(token)
      if (result.success) {
        setSessionList((prev) => prev.filter((s) => s.token !== token))
        toast.success('Sesi berhasil diakhiri.')
      } else {
        toast.error(result.error)
      }
    } finally {
      setRevokingTokens((prev) => {
        const next = new Set(prev)
        next.delete(token)
        return next
      })
    }
  }

  if (sessionList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Tidak ada sesi aktif.</p>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Perangkat</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Login Pada</TableHead>
            <TableHead>Berlaku Hingga</TableHead>
            <TableHead className="w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessionList.map((session) => {
            const isCurrentSession = session.token === currentToken
            const isRevoking = revokingTokens.has(session.token)
            const mobile = isMobile(session.userAgent)

            return (
              <TableRow key={session.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {mobile ? (
                      <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <MonitorIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {detectBrowser(session.userAgent)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {detectDevice(session.userAgent)}
                      </span>
                    </div>
                    {isCurrentSession && (
                      <Badge variant="secondary" className="text-xs">
                        Sesi Ini
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {session.ipAddress ?? '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatWITA(session.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatWITA(session.expiresAt)}
                </TableCell>
                <TableCell>
                  {!isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isRevoking}
                      aria-label="Akhiri sesi ini"
                      onClick={() => handleRevoke(session.token)}
                    >
                      <XIcon className="size-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
