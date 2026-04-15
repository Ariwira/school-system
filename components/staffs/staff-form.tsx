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
import {
  createStaffSchema,
  updateStaffSchema,
  type StaffWithUser,
} from '@/lib/validations/staff'
import { createStaff, updateStaff, getInstitutesForStaff } from '@/actions/staff.actions'

// Unified form schema (superset of both create + update)
const formSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama staf minimal 2 karakter')
    .max(200, 'Nama staf maksimal 200 karakter'),
  nik: z
    .string()
    .max(20, 'NIK maksimal 20 karakter')
    .optional()
    .or(z.literal('')),
  staffNumber: z
    .string()
    .min(2, 'Nomor staf minimal 2 karakter')
    .max(50, 'Nomor staf maksimal 50 karakter'),
  phone: z
    .string()
    .min(5, 'Telepon minimal 5 karakter')
    .max(20, 'Telepon maksimal 20 karakter'),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(200, 'Email maksimal 200 karakter'),
  gender: z.enum(['male', 'female'], { message: 'Gender tidak valid' }),
  dob: z.string().min(1, 'Tanggal lahir wajib diisi'),
  pob: z
    .string()
    .max(100, 'Tempat lahir maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  department: z.enum(['academic', 'administration', 'finance', 'it', 'hr', 'other'], {
    message: 'Departemen tidak valid',
  }),
  joinDate: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'resigned']).default('active'),
  instituteId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface StaffFormProps {
  mode: 'create' | 'edit'
  defaultValues?: StaffWithUser
  onSuccess?: () => void
  onCancel?: () => void
  subAppKey?: string
  /** Preset instituteId for foundation/school routes */
  instituteId?: string
  isSuperadmin?: boolean
  /** Jika diset, redirect ke URL ini setelah sukses (untuk halaman form tersendiri) */
  redirectTo?: string
}

const departmentOptions = [
  { value: 'academic', label: 'Akademik' },
  { value: 'administration', label: 'Administrasi' },
  { value: 'finance', label: 'Keuangan' },
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'SDM' },
  { value: 'other', label: 'Lainnya' },
]

const statusOptions = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
  { value: 'resigned', label: 'Resign' },
]

export function StaffForm({
  mode,
  defaultValues,
  onSuccess,
  onCancel,
  subAppKey,
  instituteId,
  isSuperadmin = false,
  redirectTo,
}: StaffFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [institutesOptions, setInstitutesOptions] = useState<
    { id: string; name: string; type: string }[]
  >([])

  const isEdit = mode === 'edit'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      nik: defaultValues?.nik ?? '',
      staffNumber: defaultValues?.staffNumber ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      gender: defaultValues?.gender ?? 'male',
      dob: defaultValues?.dob ?? '',
      pob: defaultValues?.pob ?? '',
      department: defaultValues?.department ?? 'academic',
      joinDate: defaultValues?.joinDate ?? '',
      status: defaultValues?.status ?? 'active',
      instituteId: defaultValues?.instituteId ?? instituteId ?? '',
    },
  })

  // Load institusi options for superadmin create mode
  useEffect(() => {
    if (isSuperadmin && !isEdit) {
      getInstitutesForStaff()
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
        const updatePayload = updateStaffSchema.safeParse(values)
        if (!updatePayload.success) {
          toast.error(updatePayload.error.issues[0]?.message ?? 'Data tidak valid.')
          return
        }
        const result = await updateStaff(defaultValues.id, updatePayload.data, subAppKey)
        if (result.success) {
          toast.success('Data staf berhasil diperbarui.')
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
        const createPayload = createStaffSchema.safeParse({
          ...values,
          instituteId: instituteIdToUse,
        })
        if (!createPayload.success) {
          toast.error(createPayload.error.issues[0]?.message ?? 'Data tidak valid.')
          return
        }
        const result = await createStaff(createPayload.data, subAppKey)
        if (result.success) {
          toast.success('Staf berhasil dibuat.')
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
                <Input placeholder="Contoh: Ahmad Fauzi" {...field} />
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

        {/* Nomor Staf */}
        <FormField
          control={form.control}
          name="staffNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Staf</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: STF-2024-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ahmad@sekolah.sch.id" {...field} />
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
                <Input placeholder="Contoh: 0812-3456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

          {/* Tanggal Lahir */}
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Lahir</FormLabel>
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
          {/* Departemen */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departemen</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih departemen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departmentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tanggal Bergabung (opsional) */}
        <FormField
          control={form.control}
          name="joinDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tanggal Bergabung{' '}
                <span className="font-normal text-muted-foreground">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? 'Menyimpan...'
                : 'Membuat...'
              : isEdit
                ? 'Simpan Perubahan'
                : 'Tambah Staf'}
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
