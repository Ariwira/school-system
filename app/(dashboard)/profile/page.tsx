import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'
import { getActiveSessions } from '@/actions/profile.actions'
import { ProfileForm } from '@/components/profile/profile-form'
import { AvatarUploader } from '@/components/profile/avatar-uploader'
import { PasswordForm } from '@/components/profile/password-form'
import { ActiveSessions } from '@/components/profile/active-sessions'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Profil Saya — School ERP',
}

export default async function ProfilePage() {
  let session: Awaited<ReturnType<typeof requireAuth>>

  try {
    session = await requireAuth()
  } catch {
    redirect('/login')
  }

  const { user } = session
  const userAvatar = (user as { avatar?: string | null }).avatar ?? null
  const currentToken = (session.session as { token?: string }).token ?? ''

  const sessionsResult = await getActiveSessions()
  const activeSessions = sessionsResult.success ? sessionsResult.data : []

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun, avatar, password, dan sesi aktif Anda.
        </p>
      </div>

      <Separator />

      {/* Info Profil */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Info Profil</h2>
          <p className="text-sm text-muted-foreground">
            Perbarui nama dan alamat email Anda.
          </p>
        </div>
        <ProfileForm defaultName={user.name} defaultEmail={user.email} />
      </section>

      <Separator />

      {/* Avatar */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Avatar</h2>
          <p className="text-sm text-muted-foreground">
            Foto profil yang ditampilkan di header aplikasi.
          </p>
        </div>
        <AvatarUploader currentAvatar={userAvatar} userName={user.name} />
      </section>

      <Separator />

      {/* Keamanan */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Keamanan</h2>
          <p className="text-sm text-muted-foreground">
            Ubah password akun Anda. Password lama wajib diverifikasi.
          </p>
        </div>
        <PasswordForm />
      </section>

      <Separator />

      {/* Sesi Aktif */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Sesi Aktif</h2>
          <p className="text-sm text-muted-foreground">
            Daftar perangkat yang sedang login ke akun Anda. Akhiri sesi yang tidak dikenal.
          </p>
        </div>
        <ActiveSessions sessions={activeSessions} currentToken={currentToken} />
      </section>
    </div>
  )
}
