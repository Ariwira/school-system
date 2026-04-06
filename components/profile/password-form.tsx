'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/actions/profile.actions'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z
      .string()
      .min(8, 'Password baru minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function PasswordForm() {
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    try {
      const result = await changePassword(values)
      if (result.success) {
        toast.success('Password berhasil diubah.')
        reset()
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Password Lama</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="Masukkan password lama"
          autoComplete="current-password"
          {...register('currentPassword')}
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Password Baru</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Minimal 8 karakter"
          autoComplete="new-password"
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Ulangi password baru"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Menyimpan...' : 'Ubah Password'}
      </Button>
    </form>
  )
}
