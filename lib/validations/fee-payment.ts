import { z } from 'zod'

export const paymentMethodValues = ['cash', 'transfer', 'virtual_account', 'qris', 'other'] as const
export type PaymentMethod = (typeof paymentMethodValues)[number]

export const paymentStatusValues = ['pending', 'paid', 'cancelled', 'refunded'] as const
export type PaymentStatus = (typeof paymentStatusValues)[number]

export const createFeePaymentSchema = z
  .object({
    studentId: z.string().uuid('ID siswa tidak valid'),
    feeId: z.string().uuid('ID tarif biaya tidak valid'),
    amountPaid: z
      .string()
      .min(1, 'Jumlah pembayaran wajib diisi')
      .regex(/^\d+(\.\d{1,2})?$/, 'Format jumlah pembayaran tidak valid'),
    paymentMethod: z.enum(paymentMethodValues, { message: 'Metode pembayaran tidak valid' }),
    receipt: z.string().max(100, 'Nomor kwitansi maksimal 100 karakter').optional().or(z.literal('')),
    receiptFile: z.string().url('URL bukti pembayaran tidak valid').optional().or(z.literal('')),
    paidDatetime: z.string().min(1, 'Tanggal & waktu bayar wajib diisi'),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'transfer' && !data.receiptFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bukti pembayaran wajib diupload untuk metode transfer.',
        path: ['receiptFile'],
      })
    }
  })

export const getFeePaymentsSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(paymentStatusValues).optional(),
  paymentMethod: z.enum(paymentMethodValues).optional(),
  feeYear: z.number().int().optional(),
  instituteId: z.string().uuid().optional(),
})

export type CreateFeePaymentInput = z.infer<typeof createFeePaymentSchema>
export type GetFeePaymentsInput = z.infer<typeof getFeePaymentsSchema>

export type FeePaymentRow = {
  id: string
  studentId: string
  studentName: string
  studentNumber: string
  feeId: string
  feeType: string
  feeYear: number
  feeAmount: string
  amountPaid: string
  paymentMethod: PaymentMethod
  receipt: string | null
  receiptFile: string | null
  status: PaymentStatus
  paidDatetime: Date
  createdAt: Date
  updatedAt: Date
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
