import { z } from 'zod'

export const createInstituteSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nama institusi minimal 2 karakter')
      .max(200, 'Nama institusi maksimal 200 karakter'),
    address: z
      .string()
      .min(5, 'Alamat minimal 5 karakter')
      .max(500, 'Alamat maksimal 500 karakter'),
    phone: z
      .string()
      .min(5, 'Telepon minimal 5 karakter')
      .max(20, 'Telepon maksimal 20 karakter'),
    email: z
      .string()
      .email('Format email tidak valid')
      .max(200, 'Email maksimal 200 karakter')
      .optional()
      .or(z.literal('')),
    type: z.enum(['foundation', 'school']),
    parentId: z.string().uuid('ID yayasan tidak valid').optional().nullable(),
    establishedYear: z
      .number()
      .int()
      .min(1900, 'Tahun berdiri tidak valid')
      .max(new Date().getFullYear(), 'Tahun berdiri tidak boleh melebihi tahun ini')
      .optional()
      .nullable(),
    image: z.string().url('URL logo tidak valid').optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'school' && !data.parentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Institusi tipe sekolah wajib memilih yayasan induk',
        path: ['parentId'],
      })
    }
    if (data.type === 'foundation' && data.parentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Institusi tipe yayasan tidak boleh memiliki yayasan induk',
        path: ['parentId'],
      })
    }
  })

export const updateInstituteSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nama institusi minimal 2 karakter')
      .max(200, 'Nama institusi maksimal 200 karakter'),
    address: z
      .string()
      .min(5, 'Alamat minimal 5 karakter')
      .max(500, 'Alamat maksimal 500 karakter'),
    phone: z
      .string()
      .min(5, 'Telepon minimal 5 karakter')
      .max(20, 'Telepon maksimal 20 karakter'),
    email: z
      .string()
      .email('Format email tidak valid')
      .max(200, 'Email maksimal 200 karakter')
      .optional()
      .or(z.literal('')),
    type: z.enum(['foundation', 'school']),
    parentId: z.string().uuid('ID yayasan tidak valid').optional().nullable(),
    establishedYear: z
      .number()
      .int()
      .min(1900, 'Tahun berdiri tidak valid')
      .max(new Date().getFullYear(), 'Tahun berdiri tidak boleh melebihi tahun ini')
      .optional()
      .nullable(),
    image: z.string().url('URL logo tidak valid').optional().nullable(),
    oldImage: z.string().url().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'school' && !data.parentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Institusi tipe sekolah wajib memilih yayasan induk',
        path: ['parentId'],
      })
    }
    if (data.type === 'foundation' && data.parentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Institusi tipe yayasan tidak boleh memiliki yayasan induk',
        path: ['parentId'],
      })
    }
  })

export const getInstitutesSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  type: z.enum(['foundation', 'school']).optional(),
})

export type CreateInstituteInput = z.infer<typeof createInstituteSchema>
export type UpdateInstituteInput = z.infer<typeof updateInstituteSchema>
export type GetInstitutesInput = z.infer<typeof getInstitutesSchema>

export type InstituteWithParent = {
  id: string
  name: string
  address: string
  phone: string
  email: string | null
  image: string | null
  establishedYear: number | null
  type: 'foundation' | 'school'
  parentId: string | null
  parentName: string | null
  createdAt: Date
  updatedAt: Date
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
