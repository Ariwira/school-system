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

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)

    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    })

    if (error) {
      if (error.status === 401) {
        setServerError('Email atau kata sandi salah.')
      } else if (error.status === 429) {
        setServerError('Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.')
      } else {
        setServerError('Terjadi kesalahan. Silakan coba lagi.')
      }
      return
    }

    router.push('/')
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Masuk</CardTitle>
        <CardDescription>Masuk ke akun School ERP Anda</CardDescription>
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Kata Sandi</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Daftar
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
