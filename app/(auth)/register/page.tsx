'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
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

const registerSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
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

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null)

    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    })

    if (error) {
      if (error.status === 422 || error.status === 400) {
        setServerError('Email sudah terdaftar. Silakan gunakan email lain.')
      } else if (error.status === 429) {
        setServerError('Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.')
      } else {
        setServerError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.')
      }
      return
    }

    router.push('/register/check-email')
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Daftar Akun</CardTitle>
        <CardDescription>Buat akun baru untuk mengakses School ERP</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <p className="text-sm font-medium text-destructive">{serverError}</p>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Nama Anda"
                      autoComplete="name"
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi</FormLabel>
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
                  <FormLabel>Konfirmasi Kata Sandi</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Ulangi kata sandi"
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
              {isSubmitting ? 'Mendaftar...' : 'Daftar'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Masuk
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
