'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Image from 'next/image'
import { UploadIcon } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadFiles } from '@/lib/uploadthing-client'
import {
  createInstituteSchema,
  updateInstituteSchema,
  type InstituteWithParent,
} from '@/lib/validations/institute'
import {
  createInstitute,
  updateInstitute,
  getFoundations,
} from '@/actions/institute.actions'

type CreateFormValues = z.infer<typeof createInstituteSchema>
type UpdateFormValues = z.infer<typeof updateInstituteSchema>

interface InstituteFormProps {
  mode: 'create' | 'edit'
  defaultValues?: InstituteWithParent
}

export function InstituteForm({ mode, defaultValues }: InstituteFormProps) {
  const router = useRouter()
  const [foundations, setFoundations] = useState<{ id: string; name: string }[]>([])
  const [loadingFoundations, setLoadingFoundations] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(defaultValues?.image ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = mode === 'edit'

  const schema = isEdit ? updateInstituteSchema : createInstituteSchema

  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      address: defaultValues?.address ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      type: defaultValues?.type ?? 'foundation',
      parentId: defaultValues?.parentId ?? null,
      establishedYear: defaultValues?.establishedYear ?? null,
      image: defaultValues?.image ?? null,
      ...(isEdit ? { oldImage: defaultValues?.image ?? null } : {}),
    },
  })

  const watchedType = form.watch('type')

  // Load foundations when type is school
  useEffect(() => {
    if (watchedType === 'school') {
      setLoadingFoundations(true)
      getFoundations()
        .then((result) => {
          if (result.success) {
            setFoundations(result.data)
          } else {
            toast.error(result.error)
          }
        })
        .catch(() => toast.error('Gagal memuat daftar yayasan.'))
        .finally(() => setLoadingFoundations(false))
    } else {
      form.setValue('parentId', null)
    }
  }, [watchedType, form])

  // Sync logoUrl to form
  useEffect(() => {
    form.setValue('image', logoUrl ?? null)
  }, [logoUrl, form])

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Ukuran file logo maksimal 4MB.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format logo harus JPG, PNG, atau WebP.')
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await uploadFiles('instituteImageUploader', { files: [file] })
      const newUrl = uploaded[0]?.ufsUrl
      if (!newUrl) {
        toast.error('Gagal mendapatkan URL logo yang diunggah.')
        return
      }
      setLogoUrl(newUrl)
      toast.success('Logo berhasil diunggah.')
    } catch {
      toast.error('Gagal mengunggah logo. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function onSubmit(values: CreateFormValues | UpdateFormValues) {
    setIsSubmitting(true)
    try {
      if (isEdit && defaultValues) {
        const updateValues = values as UpdateFormValues
        const result = await updateInstitute(defaultValues.id, {
          ...updateValues,
          oldImage: defaultValues.image ?? null,
        })
        if (result.success) {
          toast.success('Institusi berhasil diperbarui.')
          router.push('/superadmin/institutes')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      } else {
        const createValues = values as CreateFormValues
        const result = await createInstitute(createValues)
        if (result.success) {
          toast.success('Institusi berhasil dibuat.')
          router.push('/superadmin/institutes')
          router.refresh()
        } else {
          toast.error(result.error)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nama */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Institusi</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Yayasan Al-Ikhlas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipe */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Institusi</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEdit}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe institusi" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="foundation">Yayasan</SelectItem>
                  <SelectItem value="school">Sekolah</SelectItem>
                </SelectContent>
              </Select>
              {isEdit && (
                <FormDescription>
                  Tipe institusi tidak dapat diubah setelah dibuat.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent — tampil hanya jika tipe school */}
        {watchedType === 'school' && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yayasan Induk</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                  disabled={loadingFoundations}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingFoundations
                            ? 'Memuat daftar yayasan...'
                            : 'Pilih yayasan induk'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {foundations.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                    {foundations.length === 0 && !loadingFoundations && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Belum ada yayasan tersedia.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Alamat */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Masukkan alamat lengkap institusi"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Telepon */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telepon</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 0811-2345-6789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email (opsional) */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email{' '}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contoh@yayasan.sch.id"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tahun Berdiri (opsional) */}
        <FormField
          control={form.control}
          name="establishedYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tahun Berdiri{' '}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Contoh: 1995"
                  min={1900}
                  max={new Date().getFullYear()}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    field.onChange(val === '' ? null : parseInt(val, 10))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Logo Institusi */}
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>
                Logo{' '}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </FormLabel>
              <div className="space-y-3">
                {logoUrl && (
                  <div className="relative w-24 h-24 rounded-lg border overflow-hidden bg-muted">
                    <Image
                      src={logoUrl}
                      alt="Logo institusi"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <UploadIcon className="size-3.5 mr-1.5" />
                    {isUploading ? 'Mengunggah...' : logoUrl ? 'Ganti Logo' : 'Unggah Logo'}
                  </Button>

                  {logoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoUrl(null)}
                      disabled={isUploading}
                    >
                      Hapus Logo
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
              </div>
              <FormDescription>Format: JPG, PNG, WebP. Maksimal 4MB.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting
              ? isEdit
                ? 'Menyimpan...'
                : 'Membuat...'
              : isEdit
                ? 'Simpan Perubahan'
                : 'Buat Institusi'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/superadmin/institutes')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </Form>
  )
}
