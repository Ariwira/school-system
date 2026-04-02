import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export default function CheckEmailPage() {
  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <div className="flex justify-center mb-2">
          <MailCheck className="size-12 text-primary" />
        </div>
        <CardTitle>Cek Email Anda</CardTitle>
        <CardDescription>
          Kami telah mengirim tautan verifikasi ke email Anda. Silakan buka email dan
          klik tautan untuk mengaktifkan akun Anda.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          Tidak menerima email? Periksa folder spam atau tautan verifikasi mungkin
          sudah kedaluwarsa.
        </p>
      </CardContent>

      <CardFooter className="justify-center">
        <Link href="/login" className={buttonVariants({ variant: 'outline' })}>
          Kembali ke Halaman Masuk
        </Link>
      </CardFooter>
    </Card>
  )
}
