import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAuth()
  } catch {
    redirect('/login')
  }

  return <>{children}</>
}
