import { z } from 'zod'

export const transferMethodValues = ['cash', 'bank_transfer', 'other'] as const
export type TransferMethod = (typeof transferMethodValues)[number]

export const transferStatusValues = ['pending', 'approved', 'rejected', 'cancelled'] as const
export type TransferStatus = (typeof transferStatusValues)[number]

export const createTransferSchema = z.object({
  transferFromId: z.string().uuid('ID institusi asal tidak valid'),
  transferToId: z.string().uuid('ID institusi tujuan tidak valid'),
  amount: z
    .string()
    .min(1, 'Jumlah transfer wajib diisi')
    .regex(/^\d+(\.\d{1,2})?$/, 'Format jumlah transfer tidak valid'),
  issuerId: z.string().uuid('ID issuer tidak valid'),
  senderId: z.string().uuid('ID pengirim tidak valid'),
  transferMethod: z.enum(transferMethodValues, { message: 'Metode transfer tidak valid' }),
  issuedAt: z.string().min(1, 'Tanggal pengajuan wajib diisi'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.transferFromId === data.transferToId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Institusi asal dan tujuan tidak boleh sama.',
      path: ['transferToId'],
    })
  }
})

export const approveTransferSchema = z
  .object({
    approverId: z.string().uuid('ID approver tidak valid'),
    receipt: z
      .string()
      .max(100, 'Nomor referensi maksimal 100 karakter')
      .optional()
      .or(z.literal('')),
    receiptFile: z
      .string()
      .url('URL bukti transfer tidak valid')
      .optional()
      .or(z.literal('')),
    transferMethod: z.enum(transferMethodValues),
  })
  .superRefine((data, ctx) => {
    if (data.transferMethod === 'bank_transfer' && !data.receiptFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bukti transfer wajib diupload untuk metode transfer bank.',
        path: ['receiptFile'],
      })
    }
  })

export const getTransfersSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  status: z.enum(transferStatusValues).optional(),
  direction: z.enum(['all', 'outgoing', 'incoming']).optional(),
  transferMethod: z.enum(transferMethodValues).optional(),
  instituteId: z.string().uuid().optional(),
})

export type CreateTransferInput = z.infer<typeof createTransferSchema>
export type ApproveTransferInput = z.infer<typeof approveTransferSchema>
export type GetTransfersInput = z.infer<typeof getTransfersSchema>

export type TransferRow = {
  id: string
  transferFromId: string
  transferFromName: string
  transferToId: string
  transferToName: string
  amount: string
  issuerId: string
  issuerName: string
  senderId: string
  senderName: string
  receiverId: string | null
  receiverName: string | null
  approverId: string | null
  approverName: string | null
  issuedAt: Date
  approvedAt: Date | null
  status: TransferStatus
  transferMethod: TransferMethod
  receipt: string | null
  receiptFile: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
