'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/actions/profile.actions'

const schema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  defaultName: string
  defaultEmail: string
}

export function ProfileForm({ defaultName, defaultEmail }: ProfileFormProps) {
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultName, email: defaultEmail },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    try {
      const result = await updateProfile(values)
      if (result.success) {
        toast.success('Profil berhasil diperbarui.')
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
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          placeholder="Nama lengkap"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@contoh.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Mengubah email akan mereset status verifikasi email Anda.
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
      </Button>
    </form>
  )
}
