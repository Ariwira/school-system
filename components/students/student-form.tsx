'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createStudentSchema, updateStudentSchema, type StudentRow } from '@/lib/validations/student'
import { createStudent, updateStudent, getInstitutesForStudent } from '@/actions/student.actions'

const formSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama siswa minimal 2 karakter')
    .max(200, 'Nama siswa maksimal 200 karakter'),
  nik: z
    .string()
    .max(20, 'NIK maksimal 20 karakter')
    .optional()
    .or(z.literal('')),
  nisn: z
    .string()
    .min(2, 'NISN minimal 2 karakter')
    .max(20, 'NISN maksimal 20 karakter'),
  studentNumber: z
    .string()
    .min(2, 'Nomor siswa minimal 2 karakter')
    .max(50, 'Nomor siswa maksimal 50 karakter'),
  dob: z
    .string()
    .optional()
    .or(z.literal('')),
  pob: z
    .string()
    .max(100, 'Tempat lahir maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female'], { message: 'Gender tidak valid' }),
  phone: z
    .string()
    .max(20, 'Telepon maksimal 20 karakter')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(200, 'Email maksimal 200 karakter')
    .optional()
    .or(z.literal('')),
  generationYear: z.coerce
    .number()
    .int('Tahun angkatan harus bilangan bulat')
    .min(1900, 'Tahun angkatan tidak valid')
    .max(2100, 'Tahun angkatan tidak valid'),
  admissionDate: z.string().min(1, 'Tanggal masuk wajib diisi'),
  instituteId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface StudentFormProps {
  mode: 'create' | 'edit'
  defaultValues?: StudentRow
  onSuccess?: () => void
  onCancel?: () => void
  subAppKey?: string
  instituteId?: string
  isSuperadmin?: boolean
  /** Jika diset, redirect ke URL ini setelah sukses (untuk halaman form tersendiri) */
  redirectTo?: string
}

export function StudentForm({
  mode,
  defaultValues,
  onSuccess,
  onCancel,
  subAppKey,
  instituteId,
  isSuperadmin = false,
  redirectTo,
}: StudentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [institutesOptions, setInstitutesOptions] = useState<
    { id: string; name: string }[]
  >([])

  const isEdit = mode === 'edit'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      nik: defaultValues?.nik ?? '',
      nisn: defaultValues?.nisn ?? '',
      studentNumber: defaultValues?.studentNumber ?? '',
      dob: defaultValues?.dob ?? '',
      pob: defaultValues?.pob ?? '',
      gender: defaultValues?.gender ?? 'male',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      generationYear: defaultValues?.generationYear ?? new Date().getFullYear(),
      admissionDate: defaultValues?.admissionDate ?? '',
      instituteId: defaultValues?.instituteId ?? instituteId ?? '',
    },
  })

  useEffect(() => {
    if (isSuperadmin && !isEdit) {
      getInstitutesForStudent()
        .then((result) => {
          if (result.success) {
            setInstitutesOptions(result.data)
          } else {
            toast.error(result.error)
          }
        })
        .catch(() => toast.error('Gagal memuat daftar institusi.'))
    }
  }, [isSuperadmin, isEdit])

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      if (isEdit && defaultValues) {
        const updatePayload = updateStudentSchema.safeParse(values)
        if (!updatePayload.success) {
          toast.error(updatePayload.error.issues[0]?.message ?? 'Data tidak valid.')
          return
        }
        const result = await updateStudent(defaultValues.id, updatePayload.data, subAppKey)
        if (result.success) {
          toast.success('Data siswa berhasil diperbarui.')
          if (redirectTo) {
            router.push(redirectTo)
          } else {
            onSuccess?.()
          }
        } else {
          toast.error(result.error)
        }
      } else {
        const instituteIdToUse = instituteId ?? values.instituteId ?? ''
        const createPayload = createStudentSchema.safeParse({
          ...values,
          instituteId: instituteIdToUse,
        })
        if (!createPayload.success) {
          toast.error(createPayload.error.issues[0]?.message ?? 'Data tidak valid.')
          return
        }
        const result = await createStudent(createPayload.data, subAppKey)
        if (result.success) {
          toast.success('Siswa berhasil ditambahkan.')
          if (redirectTo) {
            router.push(redirectTo)
          } else {
            onSuccess?.()
          }
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Institusi — hanya tampil saat superadmin create */}
        {isSuperadmin && !isEdit && (
          <FormField
            control={form.control}
            name="instituteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institusi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih institusi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {institutesOptions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                    {institutesOptions.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Belum ada institusi tersedia.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Nama */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Budi Santoso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* NIK (opsional) */}
        <FormField
          control={form.control}
          name="nik"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                NIK{' '}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="16 digit NIK"
                  maxLength={20}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* NISN */}
          <FormField
            control={form.control}
            name="nisn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NISN</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: 0012345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nomor Siswa */}
          <FormField
            control={form.control}
            name="studentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Siswa</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: SIS-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Kelamin</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Laki-laki</SelectItem>
                    <SelectItem value="female">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tahun Angkatan */}
          <FormField
            control={form.control}
            name="generationYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tahun Angkatan</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={String(new Date().getFullYear())}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Tanggal Lahir (opsional) */}
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tanggal Lahir{' '}
                  <span className="font-normal text-muted-foreground">(opsional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tanggal Masuk */}
          <FormField
            control={form.control}
            name="admissionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Masuk</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tempat Lahir (opsional) */}
        <FormField
          control={form.control}
          name="pob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tempat Lahir{' '}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: Makassar"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                    placeholder="siswa@sekolah.sch.id"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Telepon (opsional) */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Telepon{' '}
                  <span className="font-normal text-muted-foreground">(opsional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="0812-3456-7890"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? 'Menyimpan...'
                : 'Menambahkan...'
              : isEdit
                ? 'Simpan Perubahan'
                : 'Tambah Siswa'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (redirectTo) {
                router.push(redirectTo)
              } else {
                onCancel?.()
              }
            }}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </Form>
  )
}
