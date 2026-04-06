import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { requireAuth, getUserSubapps } from '@/lib/auth-helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { Subapp } from '@/lib/db/schema'

type UserRole = 'superadmin' | 'user'

const TYPE_LABEL: Record<string, string> = {
  foundation: 'Yayasan',
  school: 'Sekolah',
  superadmin: 'Superadmin',
}

const TYPE_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  foundation: 'default',
  school: 'secondary',
  superadmin: 'destructive',
}

function subappHref(subapp: Subapp): string {
  if (subapp.type === 'superadmin') return '/superadmin'
  return `/${subapp.type}/${subapp.key}`
}

export default async function DashboardPortalPage() {
  let session: Awaited<ReturnType<typeof requireAuth>>

  try {
    session = await requireAuth()
  } catch {
    redirect('/login')
  }

  const { user } = session
  const userRole = ((user as { role?: string }).role ?? 'user') as UserRole

  let subappList: Subapp[] = []

  if (userRole === 'superadmin') {
    // Superadmin: tampilkan tile panel superadmin + semua institusi
    const all = await getUserSubapps(user.id)
    // Tambahkan tile superadmin panel secara virtual di depan
    const superadminTile: Subapp = {
      id: 'superadmin-panel',
      key: 'superadmin',
      type: 'superadmin',
      name: 'Superadmin Panel',
      image: null,
      instituteId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    subappList = [superadminTile, ...all]
  } else {
    subappList = await getUserSubapps(user.id)

    // Jika hanya 1 subapp → redirect langsung
    if (subappList.length === 1 && subappList[0]) {
      redirect(subappHref(subappList[0]))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Selamat Datang, {user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Pilih aplikasi yang ingin Anda akses.
        </p>
      </div>

      {subappList.length === 0 ? (
        <p className="text-muted-foreground">
          Anda belum memiliki akses ke sub-aplikasi manapun. Hubungi administrator.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subappList.map((subapp) => (
            <Card key={subapp.id} className="flex flex-col">
              <CardHeader className="items-center pb-2">
                {subapp.image ? (
                  <div className="relative size-16 overflow-hidden rounded-full border">
                    <Image
                      src={subapp.image}
                      alt={subapp.name ?? subapp.key}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-full border bg-muted text-2xl font-bold text-muted-foreground">
                    {(subapp.name ?? subapp.key).slice(0, 1).toUpperCase()}
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col items-center gap-2 text-center">
                <p className="font-medium leading-tight">
                  {subapp.name ?? subapp.key}
                </p>
                <Badge variant={TYPE_VARIANT[subapp.type] ?? 'outline'}>
                  {TYPE_LABEL[subapp.type] ?? subapp.type}
                </Badge>
              </CardContent>

              <CardFooter className="justify-center pt-2">
                <Button
                  size="sm"
                  className="w-full"
                  render={<Link href={subappHref(subapp)} />}
                >
                  Masuk
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
