import { z } from 'zod'

export const createStudentSchema = z.object({
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
  generationYear: z
    .number()
    .int('Tahun angkatan harus bilangan bulat')
    .min(1900, 'Tahun angkatan tidak valid')
    .max(2100, 'Tahun angkatan tidak valid'),
  admissionDate: z.string().min(1, 'Tanggal masuk wajib diisi'),
  instituteId: z.string().uuid('ID institusi tidak valid'),
})

export const updateStudentSchema = z.object({
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
  generationYear: z
    .number()
    .int('Tahun angkatan harus bilangan bulat')
    .min(1900, 'Tahun angkatan tidak valid')
    .max(2100, 'Tahun angkatan tidak valid'),
  admissionDate: z.string().min(1, 'Tanggal masuk wajib diisi'),
})

export const getStudentsSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z
    .enum(['pending', 'active', 'inactive', 'canceled', 'graduated', 'transferred', 'dropped'])
    .optional(),
  generationYear: z.number().int().optional(),
  instituteId: z.string().uuid().optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type GetStudentsInput = z.infer<typeof getStudentsSchema>

export type StudentStatus =
  | 'pending'
  | 'active'
  | 'inactive'
  | 'canceled'
  | 'graduated'
  | 'transferred'
  | 'dropped'

export type StudentRow = {
  id: string
  instituteId: string
  instituteName: string
  name: string
  nik: string | null
  nisn: string
  studentNumber: string
  dob: string | null
  pob: string | null
  gender: 'male' | 'female'
  phone: string | null
  email: string | null
  generationYear: number
  admissionDate: string
  status: StudentStatus
  createdAt: Date
  updatedAt: Date
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
