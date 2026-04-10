import { z } from 'zod'

export const feeTypeValues = ['spp'] as const
export type FeeType = (typeof feeTypeValues)[number]

const semesterField = z
  .number()
  .int('Semester harus bilangan bulat')
  .min(1, 'Semester minimal 1')
  .max(2, 'Semester maksimal 2')

export const createFeeSchema = z.object({
  feeType: z.enum(feeTypeValues, { message: 'Tipe biaya tidak valid' }),
  year: z
    .number()
    .int('Tahun akademik harus bilangan bulat')
    .min(2000, 'Tahun akademik minimal 2000')
    .max(2100, 'Tahun akademik tidak valid'),
  semester: semesterField,
  amount: z
    .string()
    .min(1, 'Besaran biaya wajib diisi')
    .regex(/^\d+(\.\d{1,2})?$/, 'Format besaran biaya tidak valid'),
})

export const updateFeeSchema = z.object({
  feeType: z.enum(feeTypeValues, { message: 'Tipe biaya tidak valid' }),
  year: z
    .number()
    .int('Tahun akademik harus bilangan bulat')
    .min(2000, 'Tahun akademik minimal 2000')
    .max(2100, 'Tahun akademik tidak valid'),
  semester: semesterField,
  amount: z
    .string()
    .min(1, 'Besaran biaya wajib diisi')
    .regex(/^\d+(\.\d{1,2})?$/, 'Format besaran biaya tidak valid'),
})

export const getFeesSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  feeType: z.enum(feeTypeValues).optional(),
  year: z.number().int().optional(),
  semester: z.number().int().min(1).max(2).optional(),
})

export type CreateFeeInput = z.infer<typeof createFeeSchema>
export type UpdateFeeInput = z.infer<typeof updateFeeSchema>
export type GetFeesInput = z.infer<typeof getFeesSchema>

export type FeeRow = {
  id: string
  feeType: FeeType
  year: number
  semester: number
  amount: string
  paymentCount: number
  createdAt: Date
  updatedAt: Date
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
