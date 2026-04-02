'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Kata sandi minimal 8 karakter')
      .regex(/[a-zA-Z]/, 'Kata sandi harus mengandung huruf')
      .regex(/[0-9]/, 'Kata sandi harus mengandung angka'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const { isSubmitting } = form.formState

  if (!token) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <AlertCircle className="size-12 text-destructive" />
          </div>
          <CardTitle>Tautan Tidak Valid</CardTitle>
          <CardDescription>
            Tautan reset kata sandi tidak valid atau sudah kedaluwarsa. Silakan
            minta tautan baru.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/forgot-password" className={buttonVariants()}>
            Minta Tautan Baru
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <CheckCircle className="size-12 text-primary" />
          </div>
          <CardTitle>Kata Sandi Berhasil Diubah</CardTitle>
          <CardDescription>
            Kata sandi Anda telah berhasil diubah. Silakan masuk dengan kata sandi
            baru Anda.
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

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null)

    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token: token!,
    })

    if (error) {
      if (error.status === 400) {
        setServerError(
          'Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.',
        )
      } else if (error.status === 429) {
        setServerError('Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.')
      } else {
        setServerError('Terjadi kesalahan. Silakan coba lagi.')
      }
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset Kata Sandi</CardTitle>
        <CardDescription>Masukkan kata sandi baru untuk akun Anda.</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <p className="text-sm font-medium text-destructive">{serverError}</p>
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi Baru</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Min. 8 karakter, huruf dan angka"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Ulangi kata sandi baru"
                      autoComplete="new-password"
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Ingat kata sandi lama?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Kembali masuk
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
