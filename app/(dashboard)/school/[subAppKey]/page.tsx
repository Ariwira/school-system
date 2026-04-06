import { redirect } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string>>
}) {
  const { subAppKey } = await params
  return {
    title: `Dashboard Sekolah — ${subAppKey} — School ERP`,
  }
}

export default async function SchoolSubappPage({
  params,
}: {
  params: Promise<Record<string, string>>
}) {
  const { subAppKey } = await params

  let subappName: string

  try {
    const { subapp } = await requireSubappAccess(subAppKey)
    subappName = subapp.name ?? subAppKey
  } catch {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Dashboard Sekolah
      </h1>
      <p className="text-muted-foreground">
        Selamat datang di dashboard{' '}
        <span className="font-medium text-foreground">{subappName}</span>.
        Fitur lengkap sedang dalam pengembangan.
      </p>
    </div>
  )
}
