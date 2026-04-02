# Product Requirements Document (PRD) — Re-Development
## School ERP System
**Versi:** 2.0 | **Tanggal:** 2026-04-01 | **Status:** Active — Ready for Development

---

## 1. Executive Summary & Tujuan Sistem

### Apa Sistem Ini?

**School ERP** adalah sistem manajemen administrasi terpusat untuk **institusi pendidikan berbasis yayasan** yang menaungi satu atau lebih sekolah. Sistem ini memungkinkan pengelolaan data staf, siswa, pembayaran SPP, dan transfer dana antar institusi dalam satu platform terintegrasi dengan kontrol akses berbasis peran yang ketat.

### Masalah yang Diselesaikan

| Masalah | Solusi |
|---|---|
| Data staf & siswa tersebar, tidak terpusat | Sistem manajemen terpusat per institusi |
| Tidak ada jejak pembayaran SPP yang terstruktur | Modul fee payment dengan status & history tracking |
| Transfer dana antar institusi tidak terdokumentasi | Modul transfer dengan multi-staf approval workflow |
| Tidak ada kontrol akses antar level yayasan & sekolah | RBAC ketat berbasis role (SuperAdmin / Foundation / School) |
| Struktur hierarki yayasan → sekolah tidak terdata | Model hierarkis institusi dengan relasi parent |

### Alur Bisnis Utama

```
Yayasan (Foundation)
    ├── Mengelola dana & staf yayasan
    ├── Mentransfer dana ke Sekolah (dengan approval workflow)
    └── Membawahi 1..N Sekolah
              ├── Mengelola data siswa
              ├── Memungut & mencatat pembayaran SPP
              └── Menerima transfer dana dari yayasan
```

---

## 2. Tech Stack — Re-Development

### Keputusan Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, Server Actions, ekosistem terbesar |
| Bahasa | TypeScript | Type-safety end-to-end |
| Database | PostgreSQL via **Neon** | Relational, constraint kuat, free tier 500MB |
| ORM | **Drizzle ORM** | Ringan, type-safe, syntax mirip SQL |
| Autentikasi | **Better Auth** | TypeScript-native, built-in RBAC & organization |
| File Storage | **Uploadthing** | Native Next.js, free 2GB, integrasi auth mudah |
| Styling | TailwindCSS v4 + shadcn/ui | Utility-first, komponen siap pakai |
| Validasi | Zod | Type-safe validation, integrasi React Hook Form |
| Form | React Hook Form | Performa tinggi, integrasi Zod |
| Deployment | **Vercel** | Native Next.js, free tier, git push langsung live |

### Kenapa Stack Ini (untuk Solo Dev)

- **100% free** untuk skala sekolah/yayasan kecil-menengah
- **Satu bahasa** (TypeScript) di seluruh stack — tidak ada context switching
- **Ekosistem pembelajaran terbesar** — mudah cari tutorial & solusi
- **Drizzle** mengajarkan SQL secara natural sambil menulis ORM
- **Better Auth** menyelesaikan gap RBAC terbesar dari sistem lama

### Struktur Direktori Proyek

```
school-erp/
├── app/
│   ├── (auth)/                    # Route group: halaman auth (tidak ada layout dashboard)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/               # Route group: halaman authenticated (ada layout sidebar)
│   │   ├── layout.tsx             # Layout dengan sidebar + header
│   │   ├── page.tsx               # Main menu (pilih sub-app)
│   │   ├── superadmin/
│   │   │   ├── layout.tsx         # Auth check: hanya superadmin
│   │   │   ├── page.tsx           # Dashboard superadmin
│   │   │   ├── institutes/
│   │   │   ├── staffs/
│   │   │   ├── students/
│   │   │   ├── fees/
│   │   │   ├── fee-payments/
│   │   │   └── transfers/
│   │   ├── foundation/
│   │   │   ├── [subAppKey]/
│   │   │   │   ├── layout.tsx     # Auth check: hanya foundation role
│   │   │   │   ├── page.tsx       # Dashboard foundation
│   │   │   │   ├── staffs/
│   │   │   │   └── transfers/
│   │   └── school/
│   │       └── [subAppKey]/
│   │           ├── layout.tsx     # Auth check: hanya school role
│   │           ├── page.tsx       # Dashboard school
│   │           ├── students/
│   │           ├── staffs/
│   │           ├── fee-payments/
│   │           └── transfers/
│   └── api/
│       ├── auth/
│       │   └── [...all]/
│       │       └── route.ts       # Better Auth handler
│       └── uploadthing/
│           └── route.ts           # Uploadthing handler
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/                    # Sidebar, Header, Breadcrumb
│   ├── data-table/                # Reusable table dengan pagination & filter
│   └── forms/                     # Form components per modul
├── lib/
│   ├── auth.ts                    # Better Auth config (server)
│   ├── auth-client.ts             # Better Auth config (client)
│   ├── db/
│   │   ├── index.ts               # Drizzle instance
│   │   └── schema/                # Schema per entitas
│   │       ├── users.ts
│   │       ├── institutes.ts
│   │       ├── staffs.ts
│   │       ├── students.ts
│   │       ├── fees.ts
│   │       ├── fee-payments.ts
│   │       ├── transfers.ts
│   │       └── subapps.ts
│   ├── uploadthing.ts             # Uploadthing config
│   └── validations/               # Zod schemas per modul
├── actions/                       # Server Actions per modul
│   ├── institute.actions.ts
│   ├── staff.actions.ts
│   ├── student.actions.ts
│   ├── fee.actions.ts
│   ├── fee-payment.actions.ts
│   └── transfer.actions.ts
├── hooks/                         # Custom React hooks
├── types/                         # TypeScript type definitions
├── drizzle.config.ts
├── middleware.ts                  # Next.js middleware (auth protection)
└── next.config.ts
```

---

## 3. User Personas & Role-Based Access Control (RBAC)

### Implementasi RBAC dengan Better Auth

Better Auth digunakan dengan plugin **organization** dan **access control** untuk mengelola role dan permission secara native.

```
Role Hierarchy:
├── superadmin   → Akses penuh ke semua data semua institusi
├── foundation   → Akses data yayasan + sekolah yang dinaungi
└── school       → Akses data sekolah spesifik saja
```

### Persona 1: Super Admin

- **Deskripsi**: Administrator platform, operator sistem (bukan pihak sekolah).
- **Akses URL**: `/superadmin/*`
- **Permission**:
  - `institute:read` `institute:create` `institute:update` `institute:delete`
  - `staff:read` `staff:create` `staff:update` `staff:delete`
  - `student:read` `student:create` `student:update` `student:delete`
  - `fee:read` `fee:create` `fee:update` `fee:delete`
  - `fee-payment:read` `fee-payment:create` `fee-payment:update`
  - `transfer:read` `transfer:create` `transfer:approve` `transfer:cancel`

### Persona 2: Foundation Admin (Admin Yayasan)

- **Deskripsi**: Staf administrasi yayasan, mengelola dana dan SDM yayasan.
- **Akses URL**: `/foundation/[subAppKey]/*`
- **Permission** (scoped ke institusinya saja):
  - `staff:read` `staff:create` `staff:update`
  - `transfer:read` `transfer:create` `transfer:approve` `transfer:cancel`
  - ❌ Tidak bisa akses data siswa & fee payment

### Persona 3: School Admin (Admin Sekolah)

- **Deskripsi**: Staf administrasi sekolah individual.
- **Akses URL**: `/school/[subAppKey]/*`
- **Permission** (scoped ke sekolahnya saja):
  - `student:read` `student:create` `student:update`
  - `staff:read` `staff:create` `staff:update`
  - `fee-payment:read` `fee-payment:create` `fee-payment:update`
  - `transfer:read`
  - ❌ Tidak bisa approve/cancel transfer
  - ❌ Tidak bisa akses data sekolah lain

### Penegakan RBAC di Next.js

RBAC ditegakkan di **3 lapisan** untuk keamanan berlapis:

```
Layer 1 — middleware.ts
  → Redirect ke login jika belum auth
  → Cek role dasar sebelum masuk route group

Layer 2 — layout.tsx per route group
  → Verifikasi role & kepemilikan subAppKey
  → Redirect 403 jika role tidak sesuai

Layer 3 — Server Actions / API
  → Re-validasi permission setiap operasi data
  → Filter query berdasarkan instituteId user
  → Tidak pernah trust data dari client
```

---

## 4. Data Model & Skema Database (Drizzle ORM)

### Skema Relasi

```
users ──(1:1)──► staffs ──(N:1)──► institutes ──(self N:1)──► institutes
                   │                    │
                   │ (4 roles)          ├──► students ──► fee_payments ──► fees
                   └──────────────────► transfers
                                        (from/to institutes)
```

### Skema Drizzle

#### `users`
```ts
export const users = pgTable('users', {
  id:                uuid('id').primaryKey().defaultRandom(),
  name:              text('name').notNull(),
  email:             text('email').notNull().unique(),
  emailVerified:     boolean('email_verified').notNull().default(false),
  password:          text('password'),          // hashed, nullable jika OAuth
  avatar:            text('avatar'),            // URL dari Uploadthing
  role:              userRoleEnum('role').notNull().default('school'),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
})

// Better Auth tambahan (sessions, accounts, verifications)
// di-generate otomatis oleh Better Auth
```

#### `institutes`
```ts
export const institutes = pgTable('institutes', {
  id:               uuid('id').primaryKey().defaultRandom(),
  parentId:         uuid('parent_id').references(() => institutes.id),
  name:             text('name').notNull().unique(),
  address:          text('address').notNull(),
  phone:            text('phone').notNull().unique(),
  email:            text('email').unique(),
  image:            text('image'),             // URL dari Uploadthing
  establishedYear:  smallint('established_year'),
  type:             instituteTypeEnum('type').notNull(), // 'foundation' | 'school'
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
})
```

#### `staffs`
```ts
export const staffs = pgTable('staffs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id).unique(),
  instituteId:  uuid('institute_id').notNull().references(() => institutes.id),
  name:         text('name').notNull(),
  nik:          text('nik').unique(),
  staffNumber:  text('staff_number').notNull().unique(),
  phone:        text('phone').notNull().unique(),
  email:        text('email').notNull().unique(),
  gender:       genderEnum('gender').notNull(),
  dob:          date('dob').notNull(),
  pob:          text('pob'),
  department:   departmentEnum('department').notNull(),
  joinDate:     date('join_date'),
  status:       staffStatusEnum('status').notNull().default('active'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
})
```

#### `students`
```ts
export const students = pgTable('students', {
  id:             uuid('id').primaryKey().defaultRandom(),
  instituteId:    uuid('institute_id').notNull().references(() => institutes.id),
  name:           text('name').notNull(),
  nik:            text('nik').unique(),
  nisn:           text('nisn').notNull().unique(),
  studentNumber:  text('student_number').notNull().unique(),
  dob:            date('dob'),
  pob:            text('pob'),
  gender:         genderEnum('gender').notNull(),
  phone:          text('phone').unique(),
  email:          text('email').unique(),
  generationYear: smallint('generation_year').notNull(),
  admissionDate:  date('admission_date').notNull(),
  status:         studentStatusEnum('status').notNull().default('pending'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
})
```

#### `fees`
```ts
export const fees = pgTable('fees', {
  id:        uuid('id').primaryKey().defaultRandom(),
  feeType:   feeTypeEnum('fee_type').notNull(),  // 'spp'
  year:      smallint('year').notNull(),
  amount:    numeric('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

#### `fee_payments`
```ts
export const feePayments = pgTable('fee_payments', {
  id:            uuid('id').primaryKey().defaultRandom(),
  feeId:         uuid('fee_id').notNull().references(() => fees.id),
  studentId:     uuid('student_id').notNull().references(() => students.id),
  amountPaid:    numeric('amount_paid', { precision: 12, scale: 2 }).notNull(),
  receipt:       text('receipt'),               // nomor kwitansi (string)
  receiptFile:   text('receipt_file'),          // URL bukti bayar dari Uploadthing
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status:        paymentStatusEnum('status').notNull().default('pending'),
  paidDatetime:  timestamp('paid_datetime').notNull(),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
})
```

#### `transfers`
```ts
export const transfers = pgTable('transfers', {
  id:               uuid('id').primaryKey().defaultRandom(),
  transferFromId:   uuid('transfer_from_id').notNull().references(() => institutes.id),
  transferToId:     uuid('transfer_to_id').notNull().references(() => institutes.id),
  amount:           numeric('amount', { precision: 12, scale: 2 }).notNull(),
  issuerId:         uuid('issuer_id').notNull().references(() => staffs.id),
  senderId:         uuid('sender_id').notNull().references(() => staffs.id),
  receiverId:       uuid('receiver_id').references(() => staffs.id),
  approverId:       uuid('approver_id').references(() => staffs.id),
  issuedAt:         timestamp('issued_at').notNull().defaultNow(),
  approvedAt:       timestamp('approved_at'),
  status:           transferStatusEnum('status').notNull().default('pending'),
  transferMethod:   transferMethodEnum('transfer_method').notNull(),
  receipt:          text('receipt'),            // nomor bukti transfer
  receiptFile:      text('receipt_file'),       // URL file bukti dari Uploadthing
  notes:            text('notes'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
})
```

#### `subapps`
```ts
export const subapps = pgTable('subapps', {
  id:          uuid('id').primaryKey().defaultRandom(),
  key:         text('key').notNull().unique(),  // 'superadmin' | 'foundation' | 'school'
  type:        text('type').notNull(),
  name:        text('name'),
  image:       text('image'),
  instituteId: uuid('institute_id').references(() => institutes.id),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
})
```

### Enum Values

```ts
// Role user
export const userRoleEnum = pgEnum('user_role', ['superadmin', 'foundation', 'school'])

// Tipe institusi
export const instituteTypeEnum = pgEnum('institute_type', ['foundation', 'school'])

// Gender
export const genderEnum = pgEnum('gender', ['male', 'female'])

// Departemen staf
export const departmentEnum = pgEnum('department', ['administration', 'teacher', 'others'])

// Status staf
export const staffStatusEnum = pgEnum('staff_status', ['active', 'inactive'])

// Status siswa
export const studentStatusEnum = pgEnum('student_status', ['pending', 'active', 'inactive', 'canceled'])

// Tipe biaya
export const feeTypeEnum = pgEnum('fee_type', ['spp'])

// Metode pembayaran
export const paymentMethodEnum = pgEnum('payment_method', ['transfer', 'cash'])

// Status pembayaran
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid'])

// Metode transfer dana
export const transferMethodEnum = pgEnum('transfer_method', ['transfer', 'cash'])

// Status transfer dana
export const transferStatusEnum = pgEnum('transfer_status', ['pending', 'success', 'canceled'])
```

---

## 5. Kebutuhan Fungsional (Core Features)

### Modul 0: Autentikasi

**User Stories:**
- Sebagai **pengguna**, saya bisa login dengan email dan password sehingga saya mengakses sistem sesuai role saya.
- Sebagai **pengguna**, saya bisa logout dari sistem sehingga sesi saya berakhir dengan aman.
- Sebagai **pengguna**, saya bisa mereset password via email sehingga saya tidak kehilangan akses jika lupa password.
- Sebagai **pengguna**, saya bisa memperbarui nama, email, dan avatar profil saya.
- Sebagai **pengguna**, saya bisa mengubah password dari halaman profil.

**Business Rules:**
- Login dibatasi **5 kali percobaan gagal per menit** (rate limiting).
- Password minimal **8 karakter**, harus mengandung huruf dan angka.
- Email harus **diverifikasi** sebelum bisa mengakses dashboard.
- Session berlaku selama **7 hari** (dengan remember me) atau **2 jam** (tanpa).
- Hanya staf yang terhubung ke akun user yang bisa login — siswa tidak punya akun.

**Implementasi Better Auth:**
```ts
// lib/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  emailVerification: { enabled: true },
  plugins: [
    organization(),       // untuk scoping data per institusi
    accessControl({
      permissions: {
        institute: ['read', 'create', 'update', 'delete'],
        staff:     ['read', 'create', 'update', 'delete'],
        student:   ['read', 'create', 'update', 'delete'],
        fee:       ['read', 'create', 'update', 'delete'],
        payment:   ['read', 'create', 'update'],
        transfer:  ['read', 'create', 'approve', 'cancel'],
      }
    }),
  ],
})
```

---

### Modul 1: Manajemen Institusi (Super Admin)

**User Stories:**
- Sebagai **Super Admin**, saya bisa melihat daftar semua institusi (yayasan dan sekolah) dengan paginasi dan filter, sehingga saya mendapat gambaran keseluruhan.
- Sebagai **Super Admin**, saya bisa membuat institusi baru dengan tipe yayasan atau sekolah.
- Sebagai **Super Admin**, saya bisa menghubungkan sekolah ke yayasan induknya sehingga hierarki terbentuk.
- Sebagai **Super Admin**, saya bisa memperbarui data institusi (nama, alamat, kontak, logo).
- Sebagai **Super Admin**, saya bisa menonaktifkan institusi yang sudah tidak aktif.
- Sebagai **Super Admin**, saya bisa meng-upload logo institusi.

**Business Rules:**
- Nama institusi harus **unik** di seluruh sistem.
- Nomor telepon dan email institusi harus **unik**.
- Institusi bertipe `school` **wajib** memiliki parent bertipe `foundation`.
- Institusi bertipe `foundation` **tidak boleh** memiliki parent.
- Institusi tidak bisa dihapus jika masih memiliki staf atau siswa aktif.

**Server Action:**
```ts
// actions/institute.actions.ts
'use server'

export async function createInstitute(formData: CreateInstituteInput) {
  const session = await requireRole('superadmin')
  const validated = CreateInstituteSchema.parse(formData)

  // validasi: school harus punya parent foundation
  if (validated.type === 'school' && !validated.parentId) {
    throw new Error('Sekolah harus memiliki yayasan induk')
  }

  await db.insert(institutes).values(validated)
  revalidatePath('/superadmin/institutes')
}
```

---

### Modul 2: Manajemen Staf (Super Admin + Foundation + School)

**User Stories:**
- Sebagai **Super Admin**, saya bisa melihat semua staf dari seluruh institusi.
- Sebagai **Foundation/School Admin**, saya bisa melihat staf di institusi saya saja.
- Sebagai **Admin**, saya bisa menambah staf baru dengan data lengkap (NIK, nomor staf, departemen, dll).
- Sebagai **Admin**, saya bisa memperbarui data staf.
- Sebagai **Admin**, saya bisa mengaktifkan atau menonaktifkan staf.
- Sebagai **Admin**, saya bisa menghubungkan staf ke akun user untuk memberikan hak login.
- Sebagai **Admin**, saya bisa melepas hubungan staf dari akun user (mencabut akses login).

**Business Rules:**
- NIK, nomor staf, email, dan telepon staf harus **unik** di seluruh sistem.
- Satu staf hanya bisa terhubung ke **satu akun user** (1-to-1).
- Staf dengan status `inactive` **tidak bisa** login meskipun punya akun user.
- Staf tidak bisa dihapus jika masih terlibat dalam transfer yang berstatus `pending`.
- Foundation admin **hanya bisa** melihat dan mengelola staf di yayasannya.
- School admin **hanya bisa** melihat dan mengelola staf di sekolahnya.

**Data Isolation (Server Action):**
```ts
'use server'

export async function getStaffs(instituteId?: string) {
  const session = await getSession()

  // Super admin bisa lihat semua
  if (session.user.role === 'superadmin') {
    return db.select().from(staffs)
  }

  // Role lain hanya lihat institusi mereka
  const userInstituteId = await getUserInstituteId(session.user.id)
  return db.select().from(staffs)
    .where(eq(staffs.instituteId, userInstituteId))
}
```

---

### Modul 3: Manajemen Siswa (Super Admin + School)

**User Stories:**
- Sebagai **Super Admin**, saya bisa melihat semua siswa dari seluruh sekolah.
- Sebagai **School Admin**, saya bisa melihat siswa di sekolah saya saja.
- Sebagai **School Admin**, saya bisa mendaftarkan siswa baru (status awal: `pending`).
- Sebagai **School Admin**, saya bisa mengaktifkan siswa dari status `pending` ke `active`.
- Sebagai **School Admin**, saya bisa menonaktifkan siswa aktif (`active` → `inactive`).
- Sebagai **School Admin**, saya bisa membatalkan pendaftaran siswa (`pending` → `canceled`).
- Sebagai **School Admin**, saya bisa memperbarui data siswa.
- Sebagai **School Admin**, saya bisa mencari siswa berdasarkan nama, NISN, atau nomor siswa.

**Business Rules:**
- NISN dan nomor siswa lokal harus **unik** di seluruh sistem.
- Lifecycle status: `pending → active`, `pending → canceled`, `active → inactive`.
- Status **tidak bisa mundur** (inactive tidak bisa kembali active tanpa proses ulang).
- Siswa dengan status `canceled` atau `inactive` **tidak bisa** membayar SPP baru.
- School admin **tidak bisa** melihat siswa di sekolah lain.
- Foundation admin **tidak bisa** akses modul siswa sama sekali.

**State Machine Status Siswa:**
```
[pending] ──► [active] ──► [inactive]
    │
    └──────► [canceled]
```

---

### Modul 4: Manajemen Biaya / SPP (Super Admin)

**User Stories:**
- Sebagai **Super Admin**, saya bisa mendefinisikan besaran SPP per tahun akademik.
- Sebagai **Super Admin**, saya bisa melihat daftar semua definisi biaya yang ada.
- Sebagai **Super Admin**, saya bisa memperbarui besaran biaya untuk tahun tertentu.

**Business Rules:**
- Hanya boleh ada **satu record fee per tipe per tahun** (unik kombinasi `fee_type` + `year`).
- Besaran biaya tidak bisa diubah jika sudah ada pembayaran yang mengacu ke fee tersebut.
- Saat ini hanya ada satu tipe: **`spp`**. Tipe baru bisa ditambah di masa depan via enum.
- `amount` menggunakan tipe `numeric(12,2)` — tidak menggunakan float untuk menghindari rounding error keuangan.

---

### Modul 5: Manajemen Pembayaran SPP (Super Admin + School)

**User Stories:**
- Sebagai **Super Admin**, saya bisa melihat semua pembayaran SPP dari seluruh sekolah.
- Sebagai **School Admin**, saya bisa melihat daftar pembayaran SPP di sekolah saya.
- Sebagai **School Admin**, saya bisa merekam pembayaran SPP siswa (tunai atau transfer bank).
- Sebagai **School Admin**, saya bisa meng-upload bukti bayar (foto/PDF) untuk pembayaran via transfer.
- Sebagai **School Admin**, saya bisa mengkonfirmasi pembayaran dari `pending` ke `paid`.
- Sebagai **School Admin**, saya bisa melihat riwayat pembayaran per siswa.
- Sebagai **School Admin**, saya bisa mencetak/mengekspor rekap pembayaran SPP.

**Business Rules:**
- Hanya siswa berstatus `active` yang bisa melakukan pembayaran SPP.
- `amount_paid` boleh kurang dari `amount` di tabel `fee` — **mendukung pembayaran cicilan**.
- Jika `payment_method` adalah `transfer`, **upload bukti bayar wajib** dilakukan.
- Jika `payment_method` adalah `cash`, bukti bayar opsional.
- Status default pembayaran baru adalah **`pending`**.
- Pembayaran yang sudah `paid` **tidak bisa diubah** kembali ke `pending`.
- School admin **hanya bisa** melihat & mengelola pembayaran siswa di sekolahnya.

**Upload Bukti Bayar (Uploadthing):**
```ts
// File yang diterima: image (JPG/PNG) atau PDF, maksimal 8MB
receiptUploader: f({
  image: { maxFileSize: '4MB', maxFileCount: 1 },
  pdf:   { maxFileSize: '8MB', maxFileCount: 1 },
})
```

---

### Modul 6: Transfer Dana Antar Institusi (Super Admin + Foundation + School)

Modul paling kompleks — melibatkan **workflow approval multi-staf**.

**User Stories:**
- Sebagai **Super Admin**, saya bisa melihat semua transfer dana lintas institusi.
- Sebagai **Foundation/School Admin**, saya bisa melihat transfer yang melibatkan institusi saya.
- Sebagai **staf berwenang (issuer)**, saya bisa membuat pengajuan transfer dana ke institusi lain.
- Sebagai **staf pengirim (sender)**, saya bisa menandai bahwa dana sudah dikirim.
- Sebagai **staf penyetuju (approver)**, saya bisa menyetujui transfer sehingga statusnya `success`.
- Sebagai **staf penyetuju**, saya bisa membatalkan transfer yang masih `pending`.
- Sebagai **staf penerima (receiver)**, saya bisa mengkonfirmasi penerimaan dana.
- Sebagai **admin**, saya bisa meng-upload bukti transfer (foto/PDF).
- Sebagai **admin**, saya bisa melihat detail lengkap setiap transfer beserta semua staf yang terlibat.

**Business Rules:**
- Transfer **tidak boleh** dilakukan dari dan ke institusi yang sama.
- Lifecycle transfer:
  ```
  [pending] ──► [success]
      │
      └──────► [canceled]
  ```
- Transfer yang sudah `success` atau `canceled` **tidak bisa** diubah statusnya.
- `receiver_id`, `approver_id`, dan `approved_at` **harus diisi bersama-sama** — tidak boleh salah satu saja.
- Jika `transfer_method` adalah `transfer` (bank), **`receipt` atau `receipt_file` wajib** diisi saat approval.
- Jika `transfer_method` adalah `cash`, receipt opsional.
- Foundation admin **hanya bisa** melihat transfer yang melibatkan yayasannya.
- School admin **hanya bisa** melihat transfer yang melibatkan sekolahnya — dan **tidak bisa** approve atau cancel.

**Workflow Transfer:**
```
1. Issuer membuat pengajuan transfer          → status: pending
2. Sender mengeksekusi pengiriman dana        → (status masih pending)
3. Approver menyetujui + upload bukti         → status: success
   ATAU
   Approver membatalkan                       → status: canceled
4. Receiver mengkonfirmasi penerimaan         → (opsional, setelah success)
```

---

### Modul 7: Dashboard & Main Menu

**User Stories:**
- Sebagai **pengguna yang login**, saya melihat halaman utama berisi sub-aplikasi yang bisa saya akses, sehingga saya bisa navigasi ke bagian sistem yang sesuai role saya.
- Sebagai **Super Admin**, saya melihat dashboard dengan ringkasan statistik global (total institusi, staf, siswa, transfer pending).
- Sebagai **Foundation Admin**, saya melihat dashboard dengan ringkasan data yayasan saya (jumlah staf, transfer pending).
- Sebagai **School Admin**, saya melihat dashboard dengan ringkasan data sekolah saya (jumlah siswa, SPP belum terbayar, transfer masuk).

**Business Rules:**
- Sub-aplikasi ditampilkan berurutan: `superadmin` → `foundation` → `school`.
- User hanya melihat sub-aplikasi yang terhubung ke akun mereka.
- Statistik dashboard **di-scope per institusi** — tidak ada data bocor lintas institusi.

---

### Modul 8: Manajemen Profil (Semua Role)

**User Stories:**
- Sebagai **pengguna**, saya bisa memperbarui nama dan email saya.
- Sebagai **pengguna**, saya bisa meng-upload atau mengganti foto avatar saya.
- Sebagai **pengguna**, saya bisa mengubah password dari halaman profil.
- Sebagai **pengguna**, saya bisa melihat daftar sesi aktif dan mengakhiri sesi tertentu.

**Business Rules:**
- Email baru harus **diverifikasi ulang** setelah diubah.
- Password lama wajib diverifikasi sebelum ganti password baru.
- Avatar di-upload ke Uploadthing, URL-nya disimpan di kolom `users.avatar`.
- Avatar lama **dihapus dari Uploadthing** saat diganti dengan yang baru.

---

## 6. Kebutuhan Non-Fungsional

### Keamanan

| Aspek | Implementasi |
|---|---|
| Password hashing | Better Auth default (Argon2) |
| Rate limiting | Better Auth built-in + Next.js middleware |
| CSRF protection | Better Auth built-in |
| Session management | Better Auth (database sessions) |
| RBAC enforcement | 3-layer: middleware + layout + server action |
| Data isolation | Query filter `instituteId` di setiap server action |
| File validation | Uploadthing: validasi tipe & ukuran di server |
| SQL injection | Drizzle ORM parameterized queries |
| XSS protection | Next.js built-in + React escaping |

### Performa

- **Server Components** untuk halaman yang tidak butuh interaktivitas — tidak ada JavaScript yang dikirim ke client.
- **Paginasi** di semua list view (default 10 item, configurable).
- **Optimistic updates** dengan `useOptimistic` untuk UX yang responsif.
- **Image optimization** via `next/image` untuk avatar dan logo institusi.
- **Database indexing**: semua foreign key, kolom status, NISN, NIK, dan kolom pencarian di-index.
- **Connection pooling**: Neon menggunakan serverless connection pooling secara default.

### Internasionalisasi (i18n)

- Default bahasa: **Bahasa Indonesia**.
- Fallback: **English**.
- Implementasi: `next-intl` (lebih native untuk App Router dibanding i18next).
- Format tanggal, angka, dan mata uang: mengikuti locale `id-ID`.

```ts
// Format rupiah
const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
// Output: "Rp 1.500.000"
```

### File Storage (Uploadthing)

| Jenis File | Tipe Diterima | Ukuran Maks | Lokasi Kolom |
|---|---|---|---|
| Avatar user | Image (JPG/PNG/WebP) | 2MB | `users.avatar` |
| Logo institusi | Image (JPG/PNG/WebP) | 4MB | `institutes.image` |
| Bukti transfer | Image / PDF | 8MB | `transfers.receipt_file` |
| Bukti bayar SPP | Image / PDF | 8MB | `fee_payments.receipt_file` |

**Catatan:** File lama **wajib dihapus** dari Uploadthing saat diganti untuk menghindari penumpukan file orphan.

### Deployment & Infrastructure (Semua Free)

| Service | Platform | Free Tier |
|---|---|---|
| Hosting | Vercel | 100GB bandwidth/bulan |
| Database | Neon PostgreSQL | 500MB storage, 0.5 CU |
| File Storage | Uploadthing | 2GB storage, 5GB bandwidth/bulan |
| Auth | Better Auth | Open source, self-hosted |
| Email | Resend | 3.000 email/bulan |

### Email Transaksional

Menggunakan **Resend** (free 3.000 email/bulan) untuk:
- Verifikasi email setelah registrasi
- Reset password
- Notifikasi transfer pending (untuk approver)
- Konfirmasi pembayaran SPP

---

## 7. Urutan Pengerjaan (Development Roadmap)

Urutan berdasarkan dependensi teknis — fitur yang menjadi fondasi dikerjakan lebih dulu.

### Phase 1 — Fondasi (Wajib selesai sebelum phase 2)
- [ ] Setup proyek Next.js 15 + TypeScript + TailwindCSS + shadcn/ui
- [ ] Setup Drizzle ORM + koneksi Neon PostgreSQL
- [ ] Definisi semua schema database + migration
- [ ] Setup Better Auth (email/password + session)
- [ ] Setup Uploadthing
- [ ] Middleware auth + route protection
- [ ] Layout dashboard (sidebar navigasi + header)

### Phase 2 — Core Admin
- [ ] Modul Autentikasi (login, logout, register, forgot password, email verification)
- [ ] Modul Profil (edit profil, ganti avatar, ganti password)
- [ ] Modul Institusi — Super Admin (CRUD institusi + hierarki)
- [ ] Modul SubApp (konfigurasi akses per user)
- [ ] Dashboard & Main Menu

### Phase 3 — SDM
- [ ] Modul Staf — CRUD + link ke user account
- [ ] Modul Siswa — CRUD + lifecycle status

### Phase 4 — Keuangan
- [ ] Modul Fee (definisi SPP per tahun)
- [ ] Modul Fee Payment (pencatatan + konfirmasi pembayaran + upload bukti)
- [ ] Modul Transfer Dana (create + approval workflow + upload bukti)

### Phase 5 — Finalisasi
- [ ] Dashboard statistik per role
- [ ] Fitur pencarian & filter di semua list
- [ ] Ekspor data (PDF/Excel untuk rekap SPP)
- [ ] Email notifikasi (Resend)
- [ ] Testing & bug fixing

---

## 8. Catatan Teknis Penting untuk Implementasi

### 1. UUID vs Auto-increment ID
Gunakan **UUID** (bukan integer auto-increment) untuk semua primary key. Alasan:
- Aman untuk expose di URL (tidak sequential, tidak bisa ditebak)
- Tidak ada info yang bocor tentang jumlah record

### 2. Tipe Data Uang
Selalu gunakan **`numeric(12,2)`** di database dan **`string` di TypeScript** (bukan `number` atau `float`) untuk nilai uang. Drizzle mengembalikan numeric sebagai string — konversi ke `Decimal.js` saat kalkulasi.

### 3. Tanggal & Timezone
- Simpan semua timestamp dalam **UTC** di database.
- Konversi ke **WITA (UTC+8)** hanya saat ditampilkan ke user.
- Gunakan `date-fns` atau `dayjs` untuk manipulasi tanggal.

### 4. Server Actions vs API Routes
Untuk sistem ini, **gunakan Server Actions** untuk semua operasi mutasi (create, update, delete). Gunakan API Routes hanya untuk Uploadthing handler dan Better Auth handler.

### 5. Error Handling
Gunakan pattern Result type atau `try-catch` yang konsisten di semua Server Actions. Kembalikan pesan error yang user-friendly dalam Bahasa Indonesia.

```ts
// Pattern yang direkomendasikan
export async function createStudent(data: CreateStudentInput) {
  try {
    const session = await requireRole(['superadmin', 'school'])
    const validated = CreateStudentSchema.parse(data)
    await db.insert(students).values(validated)
    revalidatePath('/school/.../students')
    return { success: true }
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: 'Data tidak valid', details: error.flatten() }
    }
    return { success: false, error: 'Terjadi kesalahan, coba lagi' }
  }
}
```

---

*PRD ini disusun berdasarkan hasil reverse engineering sistem legacy dan telah disesuaikan dengan tech stack baru. Dokumen ini menjadi acuan utama untuk proses re-development dari awal.*
