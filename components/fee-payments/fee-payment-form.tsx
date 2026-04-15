'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2Icon, SearchIcon, UploadIcon } from 'lucide-react'
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
import { createFeePayment, getActiveStudentsForPayment } from '@/actions/fee-payment.actions'
import { getFeesForPayment } from '@/actions/fee.actions'
import {
  createFeePaymentSchema,
  paymentMethodValues,
  type CreateFeePaymentInput,
} from '@/lib/validations/fee-payment'
import { uploadFiles } from '@/lib/uploadthing-client'

interface StudentOption {
  id: string
  name: string
  studentNumber: string
  nisn: string
}

interface FeeOption {
  id: string
  feeType: string
  year: number
  semester: number
  amount: string
}

interface FeePaymentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  subAppKey?: string
  /** Jika diset, redirect ke URL ini setelah sukses (untuk halaman form tersendiri) */
  redirectTo?: string
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer Bank',
  virtual_account: 'Virtual Account',
  qris: 'QRIS',
  other: 'Lainnya',
}

function formatAmountInput(value: string): string {
  return value.replace(/[^\d]/g, '')
}

function parseAmountToDecimal(formatted: string): string {
  const numeric = formatted.replace(/[^\d]/g, '')
  return numeric || '0'
}

export function FeePaymentForm({ onSuccess, onCancel, subAppKey, redirectTo }: FeePaymentFormProps) {
  const router = useRouter()
  const [students, setStudents] = useState<StudentOption[]>([])
  const [feeOptions, setFeeOptions] = useState<FeeOption[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingFees, setLoadingFees] = useState(false)
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<CreateFeePaymentInput>({
    resolver: zodResolver(createFeePaymentSchema),
    defaultValues: {
      studentId: '',
      feeId: '',
      amountPaid: '',
      paymentMethod: 'cash',
      receipt: '',
      receiptFile: '',
      paidDatetime: new Date().toISOString().slice(0, 16),
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const paymentMethod = form.watch('paymentMethod')
  const isTransfer = paymentMethod === 'transfer'

  // Fetch active students
  const fetchStudents = useCallback(
    async (search: string) => {
      setLoadingStudents(true)
      try {
        const result = await getActiveStudentsForPayment(subAppKey, search || undefined)
        if (result.success) {
          setStudents(result.data)
        }
      } catch {
        // silent
      } finally {
        setLoadingStudents(false)
      }
    },
    [subAppKey],
  )

  // Fetch fees
  const fetchFees = useCallback(async () => {
    setLoadingFees(true)
    try {
      const result = await getFeesForPayment(subAppKey)
      if (result.success) {
        setFeeOptions(result.data)
      }
    } catch {
      // silent
    } finally {
      setLoadingFees(false)
    }
  }, [subAppKey])

  useEffect(() => {
    fetchStudents('')
    fetchFees()
  }, [fetchStudents, fetchFees])

  // Debounce student search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStudents(studentSearch)
    }, 400)
    return () => clearTimeout(timeout)
  }, [studentSearch, fetchStudents])

  // Sync uploaded receipt URL to form
  useEffect(() => {
    form.setValue('receiptFile', uploadedReceiptUrl)
    if (uploadedReceiptUrl) {
      form.clearErrors('receiptFile')
    }
  }, [uploadedReceiptUrl, form])

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file harus JPG, PNG, WebP, atau PDF.')
      return
    }

    const maxSize = file.type === 'application/pdf' ? 8 * 1024 * 1024 : 4 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(
        file.type === 'application/pdf'
          ? 'Ukuran file PDF maksimal 8MB.'
          : 'Ukuran file gambar maksimal 4MB.',
      )
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await uploadFiles('receiptUploader', { files: [file] })
      const url = uploaded[0]?.ufsUrl
      if (url) {
        setUploadedReceiptUrl(url)
        toast.success('Bukti pembayaran berhasil diupload.')
      } else {
        toast.error('Upload gagal. Silakan coba lagi.')
      }
    } catch {
      toast.error('Upload gagal. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function onSubmit(data: CreateFeePaymentInput) {
    const result = await createFeePayment(data, subAppKey)

    if (result.success) {
      toast.success('Pembayaran berhasil dicatat.')
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        onSuccess?.()
      }
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Pilih Siswa */}
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Siswa</FormLabel>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NISN, atau no. siswa..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8 mb-2"
                  disabled={isSubmitting}
                />
              </div>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingStudents
                          ? 'Memuat siswa...'
                          : 'Pilih siswa aktif'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {loadingStudents ? 'Memuat...' : 'Tidak ada siswa aktif ditemukan.'}
                    </div>
                  ) : (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <span className="font-medium">{student.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {student.studentNumber} / {student.nisn}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pilih Tarif Biaya */}
        <FormField
          control={form.control}
          name="feeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarif Biaya</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingFees ? 'Memuat tarif...' : 'Pilih tarif biaya SPP'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {feeOptions.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {loadingFees ? 'Memuat...' : 'Belum ada tarif biaya.'}
                    </div>
                  ) : (
                    feeOptions.map((fee) => (
                      <SelectItem key={fee.id} value={fee.id}>
                        {fee.feeType.toUpperCase()} {fee.year} Sem {fee.semester === 1 ? 'Ganjil' : 'Genap'} — Rp{' '}
                        {Number(fee.amount).toLocaleString('id-ID')}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Jumlah Dibayar */}
        <FormField
          control={form.control}
          name="amountPaid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah Dibayar (Rp)</FormLabel>
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
                    value={field.value ? Number(field.value).toLocaleString('id-ID') : ''}
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

        {/* Metode Pembayaran */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metode Pembayaran</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethodValues.map((method) => (
                    <SelectItem key={method} value={method}>
                      {paymentMethodLabels[method] ?? method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nomor Kwitansi (opsional) */}
        <FormField
          control={form.control}
          name="receipt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nomor Kwitansi{' '}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Contoh: KWT-001"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tanggal & Waktu Bayar */}
        <FormField
          control={form.control}
          name="paidDatetime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal &amp; Waktu Bayar</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="datetime-local"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Upload Bukti (wajib jika transfer) */}
        <FormField
          control={form.control}
          name="receiptFile"
          render={() => (
            <FormItem>
              <FormLabel>
                Bukti Pembayaran
                {isTransfer && <span className="text-destructive ml-1">*</span>}
                {!isTransfer && (
                  <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
                )}
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {uploadedReceiptUrl ? (
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/50">
                      <UploadIcon className="size-4 text-green-600" />
                      <span className="text-sm text-green-700 flex-1 truncate">
                        Bukti berhasil diupload
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedReceiptUrl('')
                          form.setValue('receiptFile', '')
                        }}
                        disabled={isSubmitting}
                      >
                        Hapus
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        render={<a href={uploadedReceiptUrl} target="_blank" rel="noopener noreferrer" />}
                      >
                        Lihat
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                        disabled={isSubmitting || isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2Icon className="size-3.5 mr-1 animate-spin" />
                            Mengupload...
                          </>
                        ) : (
                          <>
                            <UploadIcon className="size-3.5 mr-1" />
                            Pilih File
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WebP (maks. 4MB) atau PDF (maks. 8MB)
                      </p>
                    </div>
                  )}
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
            ) : (
              'Catat Pembayaran'
            )}
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
