'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, MailCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null)

    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      if (error.status === 429) {
        setServerError('Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.')
      } else {
        setServerError('Terjadi kesalahan. Silakan coba lagi.')
      }
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <MailCheck className="size-12 text-primary" />
          </div>
          <CardTitle>Email Terkirim</CardTitle>
          <CardDescription>
            Kami telah mengirimkan tautan reset kata sandi ke email Anda. Silakan
            periksa kotak masuk atau folder spam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tautan berlaku selama 1 jam. Jika tidak menerima email, pastikan alamat
            email yang Anda masukkan sudah benar.
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

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Lupa Kata Sandi</CardTitle>
        <CardDescription>
          Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset kata sandi.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <p className="text-sm font-medium text-destructive">{serverError}</p>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="nama@sekolah.ac.id"
                      autoComplete="email"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Ingat kata sandi?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Kembali masuk
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
