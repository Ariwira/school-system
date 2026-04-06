import { z } from 'zod'

export const createStaffSchema = z.object({
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
  instituteId: z.string().uuid('ID institusi tidak valid'),
})

export const updateStaffSchema = z.object({
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
  status: z.enum(['active', 'inactive', 'resigned']),
})

export const getStaffsSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  instituteId: z.string().uuid().optional(),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
export type GetStaffsInput = z.infer<typeof getStaffsSchema>

export type StaffWithUser = {
  id: string
  userId: string | null
  instituteId: string
  instituteName: string
  name: string
  nik: string | null
  staffNumber: string
  phone: string
  email: string
  gender: 'male' | 'female'
  dob: string
  pob: string | null
  department: 'academic' | 'administration' | 'finance' | 'it' | 'hr' | 'other'
  joinDate: string | null
  status: 'active' | 'inactive' | 'resigned'
  userName: string | null
  userEmail: string | null
  createdAt: Date
  updatedAt: Date
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
