import Link from 'next/link'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VerifyEmailPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams
  const error = params.error

  if (error === 'TOKEN_EXPIRED') {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Clock className="size-12 text-amber-500" />
          </div>
          <CardTitle>Tautan Kedaluwarsa</CardTitle>
          <CardDescription>
            Tautan verifikasi sudah kedaluwarsa. Tautan berlaku selama 1 jam. Silakan
            minta tautan baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Masuk ke akun Anda dan minta pengiriman ulang email verifikasi.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants(), 'w-full')}
          >
            Masuk untuk Minta Ulang
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
          >
            Ke Halaman Utama
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <AlertCircle className="size-12 text-destructive" />
          </div>
          <CardTitle>Verifikasi Gagal</CardTitle>
          <CardDescription>
            Tautan verifikasi tidak valid. Pastikan Anda mengklik tautan yang benar
            dari email Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Jika masalah terus berlanjut, silakan hubungi administrator sistem.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className={buttonVariants()}>
            Kembali ke Halaman Masuk
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <div className="flex justify-center mb-2">
          <CheckCircle className="size-12 text-primary" />
        </div>
        <CardTitle>Email Terverifikasi</CardTitle>
        <CardDescription>
          Selamat! Email Anda telah berhasil diverifikasi. Akun Anda sekarang aktif
          dan siap digunakan.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center">
        <Link href="/login" className={buttonVariants()}>
          Masuk Sekarang
        </Link>
      </CardFooter>
    </Card>
  )
}
