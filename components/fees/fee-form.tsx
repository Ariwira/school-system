'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFee, updateFee } from '@/actions/fee.actions'
import {
  createFeeSchema,
  updateFeeSchema,
  type CreateFeeInput,
  type UpdateFeeInput,
  type FeeRow,
} from '@/lib/validations/fee'

interface FeeFormProps {
  mode: 'create' | 'edit'
  defaultValues?: FeeRow
  onSuccess: () => void
  onCancel: () => void
}

const feeTypeLabels: Record<string, string> = {
  registration: 'Pendaftaran',
  spp: 'SPP',
  building: 'Gedung',
  uniform: 'Seragam',
  book: 'Buku',
  activity: 'Kegiatan',
  other: 'Lainnya',
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

function formatAmountInput(value: string): string {
  // Strip non-numeric characters for input
  return value.replace(/[^\d]/g, '')
}

function parseAmountToDecimal(formatted: string): string {
  const numeric = formatted.replace(/[^\d]/g, '')
  return numeric || '0'
}

export function FeeForm({ mode, defaultValues, onSuccess, onCancel }: FeeFormProps) {
  const schema = mode === 'create' ? createFeeSchema : updateFeeSchema

  const defaultAmount = defaultValues?.amount
    ? String(Math.round(Number(defaultValues.amount)))
    : ''

  const form = useForm<CreateFeeInput | UpdateFeeInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      feeType: defaultValues?.feeType ?? 'spp',
      year: defaultValues?.year ?? currentYear,
      semester: defaultValues?.semester ?? 1,
      amount: defaultAmount,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(data: CreateFeeInput | UpdateFeeInput) {
    const result =
      mode === 'create'
        ? await createFee(data as CreateFeeInput)
        : await updateFee(defaultValues!.id, data as UpdateFeeInput)

    if (result.success) {
      toast.success(
        mode === 'create'
          ? 'Tarif biaya berhasil ditambahkan.'
          : 'Tarif biaya berhasil diperbarui.',
      )
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Tipe Biaya */}
        <FormField
          control={form.control}
          name="feeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Biaya</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe biaya" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(feeTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tahun Akademik */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tahun Akademik</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                defaultValue={String(field.value)}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun akademik" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Semester */}
        <FormField
          control={form.control}
          name="semester"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semester</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                defaultValue={String(field.value)}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                  <SelectItem value="2">Semester 2 (Genap)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Besaran Biaya */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Besaran Biaya (Rp)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="pl-10"
                    disabled={isSubmitting}
                    value={
                      field.value
                        ? Number(field.value).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={(e) => {
                      const raw = formatAmountInput(e.target.value)
                      field.onChange(parseAmountToDecimal(raw))
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : mode === 'create' ? (
              'Tambah Tarif'
            ) : (
              'Simpan Perubahan'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </Form>
  )
}
