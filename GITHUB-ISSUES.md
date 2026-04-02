# GitHub Issues — School ERP System Re-Development

Dokumen ini berisi daftar issue yang akan dibuat di GitHub. Setiap issue sudah cukup detail untuk dikerjakan oleh junior developer atau AI model tanpa perlu membaca PRD secara keseluruhan.

> **Catatan penting sebelum mengerjakan:**
> - Baca `AGENTS.md` — Next.js versi ini mungkin berbeda dari yang kamu kenal
> - Gunakan **UUID** untuk semua primary key (bukan integer auto-increment)
> - Gunakan **`numeric(12,2)`** untuk semua nilai uang, bukan float
> - Semua timestamp disimpan dalam **UTC**, ditampilkan dalam **WITA (UTC+8)**
> - Gunakan **Server Actions** untuk semua operasi mutasi — bukan API Routes
> - Kembalikan error message dalam **Bahasa Indonesia**
> - **Organization plugin Better Auth TIDAK digunakan** — RBAC cukup pakai `role` di `users` + `instituteId` di `staffs`

---

## PHASE 1 — FONDASI

> Semua issue di phase ini wajib selesai sebelum phase 2 dimulai.

---

### Issue 1: Setup Project — Install Dependencies & Konfigurasi Dasar

**Labels:** `phase-1`, `setup`
**Depends on:** —

**Deskripsi:**
Project sudah ada (Next.js bare minimum dari Create Next App). Tugasnya adalah menginstall semua dependency yang dibutuhkan dan melakukan konfigurasi dasar agar project siap untuk development.

**Package manager:** `pnpm`

**Dependencies yang harus diinstall:**

```bash
# Core
pnpm add drizzle-orm @neondatabase/serverless dotenv
pnpm add better-auth
pnpm add uploadthing @uploadthing/next
pnpm add resend
pnpm add zod react-hook-form @hookform/resolvers
pnpm add decimal.js
pnpm add date-fns
pnpm add next-intl

# shadcn/ui (jalankan init dulu)
pnpm dlx shadcn@latest init

# shadcn components yang dibutuhkan
pnpm dlx shadcn@latest add button input label form card table badge dialog sheet dropdown-menu avatar separator skeleton toast sonner

# Dev dependencies
pnpm add -D drizzle-kit tsx
```

**Checklist:**
- [ ] Install semua dependencies di atas
- [ ] Setup `shadcn/ui` dengan theme default, CSS variables enabled
- [ ] Buat file `.env.local` dengan variabel berikut (isi dengan nilai placeholder dulu):
  ```env
  # Database
  DATABASE_URL=

  # Better Auth
  BETTER_AUTH_SECRET=
  BETTER_AUTH_URL=http://localhost:3000

  # Uploadthing
  UPLOADTHING_TOKEN=

  # Resend
  RESEND_API_KEY=
  ```
- [ ] Buat file `.env.example` — copy dari `.env.local` tapi semua value dikosongkan
- [ ] Pastikan `.env.local` masuk ke `.gitignore`
- [ ] Verifikasi `pnpm dev` masih berjalan tanpa error setelah semua install

---

### Issue 2: Setup Database — Drizzle ORM + Koneksi Neon PostgreSQL

**Labels:** `phase-1`, `database`, `setup`
**Depends on:** Issue 1

**Deskripsi:**
Setup koneksi ke database Neon PostgreSQL menggunakan Drizzle ORM. Buat instance database yang akan dipakai di seluruh aplikasi.

**Checklist:**
- [ ] Buat file `lib/db/index.ts` — instance Drizzle dengan koneksi ke Neon:
  ```ts
  import { neon } from '@neondatabase/serverless'
  import { drizzle } from 'drizzle-orm/neon-http'

  const sql = neon(process.env.DATABASE_URL!)
  export const db = drizzle(sql)
  ```
- [ ] Buat file `drizzle.config.ts` di root project:
  ```ts
  import { defineConfig } from 'drizzle-kit'

  export default defineConfig({
    schema: './lib/db/schema',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  })
  ```
- [ ] Tambahkan scripts di `package.json`:
  ```json
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:push": "drizzle-kit push"
  ```
- [ ] Test koneksi berhasil (jalankan `pnpm db:studio` dan pastikan terhubung)

---

### Issue 3: Setup Database Schema — Definisi Semua Tabel & Enum

**Labels:** `phase-1`, `database`, `schema`
**Depends on:** Issue 2

**Deskripsi:**
Buat semua schema Drizzle ORM sesuai data model di PRD. Semua schema dipisah per file dalam folder `lib/db/schema/`.

**Struktur file:**
```
lib/db/schema/
├── index.ts          ← export semua schema dari sini
├── enums.ts          ← semua pgEnum
├── users.ts
├── institutes.ts
├── staffs.ts
├── students.ts
├── fees.ts
├── fee-payments.ts
├── transfers.ts
└── subapps.ts
```

**Checklist:**

- [ ] Buat `lib/db/schema/enums.ts` dengan enum berikut:
  ```ts
  export const userRoleEnum = pgEnum('user_role', ['superadmin', 'foundation', 'school'])
  export const instituteTypeEnum = pgEnum('institute_type', ['foundation', 'school'])
  export const genderEnum = pgEnum('gender', ['male', 'female'])
  export const departmentEnum = pgEnum('department', ['administration', 'teacher', 'others'])
  export const staffStatusEnum = pgEnum('staff_status', ['active', 'inactive'])
  export const studentStatusEnum = pgEnum('student_status', ['pending', 'active', 'inactive', 'canceled'])
  export const feeTypeEnum = pgEnum('fee_type', ['spp'])
  export const paymentMethodEnum = pgEnum('payment_method', ['transfer', 'cash'])
  export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid'])
  export const transferMethodEnum = pgEnum('transfer_method', ['transfer', 'cash'])
  export const transferStatusEnum = pgEnum('transfer_status', ['pending', 'success', 'canceled'])
  ```

- [ ] Buat `lib/db/schema/users.ts`:
  ```ts
  // Kolom: id (uuid PK), name, email (unique), emailVerified (bool), password (nullable),
  // avatar (nullable), role (userRoleEnum default 'school'), createdAt, updatedAt
  // Better Auth juga akan auto-generate tabel: sessions, accounts, verifications
  ```

- [ ] Buat `lib/db/schema/institutes.ts`:
  ```ts
  // Kolom: id (uuid PK), parentId (nullable FK ke institutes.id), name (unique),
  // address, phone (unique), email (nullable, unique), image (nullable),
  // establishedYear (smallint nullable), type (instituteTypeEnum), createdAt, updatedAt
  ```

- [ ] Buat `lib/db/schema/staffs.ts`:
  ```ts
  // Kolom: id (uuid PK), userId (nullable FK ke users.id, unique), instituteId (FK ke institutes.id),
  // name, nik (nullable, unique), staffNumber (unique), phone (unique), email (unique),
  // gender (genderEnum), dob (date), pob (nullable), department (departmentEnum),
  // joinDate (nullable date), status (staffStatusEnum default 'active'), createdAt, updatedAt
  ```

- [ ] Buat `lib/db/schema/students.ts`:
  ```ts
  // Kolom: id (uuid PK), instituteId (FK ke institutes.id), name, nik (nullable, unique),
  // nisn (unique), studentNumber (unique), dob (nullable date), pob (nullable),
  // gender (genderEnum), phone (nullable, unique), email (nullable, unique),
  // generationYear (smallint), admissionDate (date), status (studentStatusEnum default 'pending'),
  // createdAt, updatedAt
  ```

- [ ] Buat `lib/db/schema/fees.ts`:
  ```ts
  // Kolom: id (uuid PK), feeType (feeTypeEnum), year (smallint),
  // amount (numeric 12,2), createdAt, updatedAt
  // UNIQUE constraint: kombinasi feeType + year
  ```

- [ ] Buat `lib/db/schema/fee-payments.ts`:
  ```ts
  // Kolom: id (uuid PK), feeId (FK ke fees.id), studentId (FK ke students.id),
  // amountPaid (numeric 12,2), receipt (nullable text), receiptFile (nullable text),
  // paymentMethod (paymentMethodEnum), status (paymentStatusEnum default 'pending'),
  // paidDatetime (timestamp), createdAt, updatedAt
  ```

- [ ] Buat `lib/db/schema/transfers.ts`:
  ```ts
  // Kolom: id (uuid PK), transferFromId (FK ke institutes.id), transferToId (FK ke institutes.id),
  // amount (numeric 12,2), issuerId (FK ke staffs.id), senderId (FK ke staffs.id),
  // receiverId (nullable FK ke staffs.id), approverId (nullable FK ke staffs.id),
  // issuedAt (timestamp default now), approvedAt (nullable timestamp),
  // status (transferStatusEnum default 'pending'), transferMethod (transferMethodEnum),
  // receipt (nullable text), receiptFile (nullable text), notes (nullable text),
  // createdAt, updatedAt
  ```

- [ ] Buat `lib/db/schema/subapps.ts`:
  ```ts
  // Kolom: id (uuid PK), key (text unique), type (text), name (nullable text),
  // image (nullable text), instituteId (nullable FK ke institutes.id), createdAt, updatedAt
  // Catatan: type bisa 'superadmin' | 'foundation' | 'school'
  // instituteId null hanya untuk subapp superadmin
  ```

- [ ] Buat `lib/db/schema/index.ts` — re-export semua schema dan enum
- [ ] Jalankan `pnpm db:generate` — pastikan migration file ter-generate tanpa error
- [ ] Jalankan `pnpm db:migrate` — pastikan semua tabel terbuat di Neon

---

### Issue 4: Setup Better Auth — Autentikasi Email/Password + Resend Email

**Labels:** `phase-1`, `auth`, `setup`
**Depends on:** Issue 3

**Deskripsi:**
Setup Better Auth dengan konfigurasi email/password, email verification menggunakan Resend, dan RBAC berbasis `role` field di tabel `users`. **Tidak menggunakan organization plugin.**

**Checklist:**

- [ ] Buat `lib/auth.ts` (server-side config):
  ```ts
  import { betterAuth } from 'better-auth'
  import { drizzleAdapter } from 'better-auth/adapters/drizzle'
  import { db } from '@/lib/db'
  import { Resend } from 'resend'

  const resend = new Resend(process.env.RESEND_API_KEY)

  export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
    },
    emailVerification: {
      enabled: true,
      sendVerificationEmail: async ({ user, url }) => {
        await resend.emails.send({
          from: 'noreply@yourdomain.com',
          to: user.email,
          subject: 'Verifikasi Email Anda',
          html: `<p>Klik link berikut untuk verifikasi email: <a href="${url}">${url}</a></p>`,
        })
      },
    },
    // Rate limiting: 5 percobaan gagal per menit
    rateLimit: {
      window: 60,
      max: 5,
    },
    session: {
      expiresIn: 60 * 60 * 2,           // 2 jam default
      updateAge: 60 * 60,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
  })
  ```

- [ ] Buat `lib/auth-client.ts` (client-side config):
  ```ts
  import { createAuthClient } from 'better-auth/react'

  export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  })
  ```

- [ ] Buat API route handler `app/api/auth/[...all]/route.ts`:
  ```ts
  import { auth } from '@/lib/auth'
  import { toNextJsHandler } from 'better-auth/next-js'

  export const { GET, POST } = toNextJsHandler(auth)
  ```

- [ ] Jalankan `pnpm db:push` setelah Better Auth setup — Better Auth akan auto-generate tabel `sessions`, `accounts`, `verifications`
- [ ] Buat helper `lib/auth-helpers.ts` dengan fungsi:
  ```ts
  // requireAuth() → ambil session, throw jika tidak login
  // requireRole(roles: string[]) → ambil session, throw jika role tidak sesuai
  // getUserInstituteId(userId: string) → ambil instituteId dari tabel staffs
  ```
- [ ] Test: register user baru → cek email verifikasi masuk via Resend dashboard

---

### Issue 5: Setup Uploadthing — File Storage

**Labels:** `phase-1`, `storage`, `setup`
**Depends on:** Issue 4

**Deskripsi:**
Setup Uploadthing untuk file upload: avatar user, logo institusi, bukti transfer, dan bukti pembayaran SPP.

**Checklist:**

- [ ] Buat `lib/uploadthing.ts`:
  ```ts
  import { createUploadthing, type FileRouter } from 'uploadthing/next'

  const f = createUploadthing()

  export const ourFileRouter = {
    avatarUploader: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
      .middleware(async () => {
        // validasi session, return userId
      })
      .onUploadComplete(async ({ metadata, file }) => {
        // update users.avatar dengan file.url
      }),

    instituteImageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
      .middleware(async () => { /* requireRole('superadmin') */ })
      .onUploadComplete(async ({ file }) => {}),

    receiptUploader: f({
      image: { maxFileSize: '4MB', maxFileCount: 1 },
      pdf: { maxFileSize: '8MB', maxFileCount: 1 },
    })
      .middleware(async () => { /* requireAuth() */ })
      .onUploadComplete(async ({ file }) => {}),
  } satisfies FileRouter

  export type OurFileRouter = typeof ourFileRouter
  ```

- [ ] Buat API route `app/api/uploadthing/route.ts`:
  ```ts
  import { createRouteHandler } from 'uploadthing/next'
  import { ourFileRouter } from '@/lib/uploadthing'

  export const { GET, POST } = createRouteHandler({ router: ourFileRouter })
  ```

- [ ] Generate TypeScript types untuk Uploadthing client
- [ ] Test upload file kecil berhasil via Uploadthing dashboard

---

### Issue 6: Setup Middleware — Auth Protection & Route Guard

**Labels:** `phase-1`, `auth`, `setup`
**Depends on:** Issue 4

**Deskripsi:**
Buat Next.js middleware untuk melindungi semua route yang membutuhkan autentikasi dan melakukan pengecekan role dasar.

**Route yang dilindungi:**
- `/superadmin/*` → hanya `superadmin`
- `/foundation/*` → hanya `foundation` atau `superadmin`
- `/school/*` → hanya `school` atau `superadmin`
- `/` (dashboard utama) → semua role yang sudah login

**Route publik (tidak perlu auth):**
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

**Checklist:**

- [ ] Buat `middleware.ts` di root project:
  - Redirect ke `/login` jika belum terautentikasi dan mencoba akses route protected
  - Redirect ke `/` jika sudah login tapi mencoba akses `/login` atau `/register`
  - Cek role dasar — jika role tidak sesuai redirect ke `/` (bukan 404)
  - Gunakan Better Auth session helper untuk membaca session di middleware
- [ ] Konfigurasi `matcher` di middleware — exclude `_next/static`, `_next/image`, `favicon.ico`, `api/auth`, `api/uploadthing`
- [ ] Test: akses `/superadmin` tanpa login → redirect ke `/login`
- [ ] Test: akses `/login` saat sudah login → redirect ke `/`

---

### Issue 7: Setup Layout Dashboard — Sidebar + Header

**Labels:** `phase-1`, `ui`, `layout`
**Depends on:** Issue 6

**Deskripsi:**
Buat layout dashboard yang akan dipakai oleh semua halaman authenticated. Layout terdiri dari sidebar navigasi di kiri dan header di atas.

**Struktur file:**
```
app/(dashboard)/
├── layout.tsx              ← layout utama dengan sidebar + header
└── page.tsx                ← placeholder (akan diimplementasi di Issue 12)

components/layout/
├── sidebar.tsx
├── header.tsx
└── breadcrumb.tsx
```

**Navigasi sidebar per role:**

| Role | Menu Item |
|---|---|
| superadmin | Institusi, Staf, Siswa, Biaya, Pembayaran SPP, Transfer Dana |
| foundation | Staf, Transfer Dana |
| school | Siswa, Staf, Pembayaran SPP, Transfer Dana |

**Checklist:**

- [ ] Buat `app/(dashboard)/layout.tsx` — wrapper dengan sidebar + header, baca session untuk tampilkan nama user dan role
- [ ] Buat `components/layout/sidebar.tsx`:
  - Logo/nama aplikasi di atas
  - Menu navigasi yang ditampilkan sesuai role user
  - Highlight menu aktif berdasarkan current path
  - Responsive: collapsible di mobile (gunakan shadcn `Sheet`)
- [ ] Buat `components/layout/header.tsx`:
  - Breadcrumb di kiri
  - Avatar + nama user + dropdown (link ke profil, tombol logout) di kanan
- [ ] Buat `components/layout/breadcrumb.tsx` — generate breadcrumb otomatis dari pathname
- [ ] Buat `app/(auth)/layout.tsx` — layout kosong tanpa sidebar untuk halaman auth (login, register, dll)
- [ ] Test: layout tampil dengan benar di berbagai ukuran layar

---

## PHASE 2 — CORE ADMIN

---

### Issue 8: Halaman Autentikasi — Login, Register, Forgot Password, Verifikasi Email

**Labels:** `phase-2`, `auth`, `ui`
**Depends on:** Issue 7

**Deskripsi:**
Buat semua halaman autentikasi menggunakan Better Auth client. Semua halaman berada dalam route group `(auth)` sehingga tidak ada sidebar/header dashboard.

**Halaman yang dibuat:**
- `/login` — form email + password
- `/register` — form nama + email + password + konfirmasi password
- `/forgot-password` — form email untuk kirim link reset
- `/reset-password` — form password baru (ada token di URL)
- `/verify-email` — halaman konfirmasi setelah klik link verifikasi

**Business Rules:**
- Password minimal 8 karakter, harus mengandung huruf dan angka
- Rate limit: 5 percobaan gagal per menit (dihandle Better Auth)
- Email harus diverifikasi sebelum bisa akses dashboard
- Setelah register → redirect ke halaman informasi "cek email kamu"
- Setelah login sukses → redirect ke `/`

**Checklist:**

- [ ] Buat `app/(auth)/login/page.tsx` — form login dengan React Hook Form + Zod validation, gunakan `authClient.signIn.email()`
- [ ] Buat `app/(auth)/register/page.tsx` — form register, gunakan `authClient.signUp.email()`
- [ ] Buat `app/(auth)/forgot-password/page.tsx` — form email, gunakan Better Auth forgot password
- [ ] Buat `app/(auth)/reset-password/page.tsx` — form password baru, baca token dari URL query param
- [ ] Buat `app/(auth)/verify-email/page.tsx` — tampilkan status verifikasi, handle token dari URL
- [ ] Semua form tampilkan pesan error dalam Bahasa Indonesia
- [ ] Semua form punya loading state saat submit
- [ ] Test full flow: register → verifikasi email → login → berhasil masuk dashboard

---

### Issue 9: Halaman Profil — Edit Profil, Ganti Avatar, Ganti Password, Kelola Sesi

**Labels:** `phase-2`, `profile`, `ui`
**Depends on:** Issue 8

**Deskripsi:**
Buat halaman profil yang bisa diakses oleh semua role. User bisa edit data diri, ganti avatar, ganti password, dan melihat sesi aktif.

**Route:** `/profile`

**Business Rules:**
- Email baru harus diverifikasi ulang setelah diubah
- Password lama wajib diverifikasi sebelum ganti password baru
- Avatar di-upload ke Uploadthing, URL disimpan di `users.avatar`
- Avatar lama wajib dihapus dari Uploadthing saat diganti

**Checklist:**

- [ ] Buat `app/(dashboard)/profile/page.tsx` dengan tab atau section:
  - **Info Profil**: form edit nama dan email
  - **Avatar**: tampilkan avatar saat ini, tombol ganti (trigger Uploadthing uploader)
  - **Keamanan**: form ganti password (password lama + baru + konfirmasi)
  - **Sesi Aktif**: list sesi yang sedang aktif + tombol "Akhiri Sesi" per sesi
- [ ] Buat Server Action `actions/profile.actions.ts`:
  - `updateProfile(data)` → update nama/email di tabel `users`
  - `updateAvatar(url, oldUrl)` → update `users.avatar`, hapus file lama dari Uploadthing
  - `changePassword(oldPassword, newPassword)` → verifikasi password lama via Better Auth
- [ ] Gunakan Uploadthing `avatarUploader` untuk upload avatar
- [ ] Test: ganti avatar → avatar lama terhapus dari Uploadthing dashboard

---

### Issue 10: Modul Institusi — CRUD Institusi + Hierarki (Super Admin)

**Labels:** `phase-2`, `institute`, `crud`
**Depends on:** Issue 9

**Deskripsi:**
Buat modul manajemen institusi yang hanya bisa diakses oleh Super Admin. Mendukung CRUD institusi dengan tipe yayasan dan sekolah, termasuk hierarki parent-child.

**Route:** `/superadmin/institutes`

**Business Rules:**
- Nama institusi, nomor telepon, dan email harus unik di seluruh sistem
- Institusi tipe `school` wajib punya parent bertipe `foundation`
- Institusi tipe `foundation` tidak boleh punya parent
- Institusi tidak bisa dihapus jika masih punya staf atau siswa aktif
- Saat institusi baru dibuat → **otomatis buat 1 record di tabel `subapps`** dengan key = slug dari nama institusi

**Checklist:**

- [ ] Buat `app/(dashboard)/superadmin/institutes/page.tsx` — tabel list institusi dengan kolom: nama, tipe, parent (jika school), telepon, tanggal dibuat + tombol aksi
- [ ] Buat `app/(dashboard)/superadmin/institutes/[id]/page.tsx` — halaman detail/edit institusi
- [ ] Buat komponen form institusi dengan field:
  - Nama, Alamat, Telepon, Email (opsional)
  - Tipe (foundation/school) — saat pilih school, muncul dropdown pilih yayasan induk
  - Tahun berdiri (opsional)
  - Upload logo (gunakan Uploadthing `instituteImageUploader`)
- [ ] Buat Server Actions `actions/institute.actions.ts`:
  - `getInstitutes(filters?)` → list semua institusi
  - `getInstituteById(id)` → detail satu institusi
  - `createInstitute(data)` → create + auto-create subapp record
  - `updateInstitute(id, data)` → update data institusi
  - `deactivateInstitute(id)` → validasi tidak ada staf/siswa aktif, lalu nonaktifkan
- [ ] Semua Server Action diawali dengan `requireRole(['superadmin'])`
- [ ] Test: buat yayasan → buat sekolah dengan parent yayasan tersebut → cek subapp ter-generate

---

### Issue 11: Dashboard & Main Menu — Halaman Utama per Role

**Labels:** `phase-2`, `dashboard`, `ui`
**Depends on:** Issue 10

**Deskripsi:**
Buat halaman utama (`/`) yang menampilkan sub-aplikasi yang bisa diakses user berdasarkan role-nya. Halaman ini adalah "portal" sebelum masuk ke dashboard spesifik institusi.

**Business Rules:**
- Superadmin → tampilkan tile "Superadmin Panel" + semua institusi (dari tabel `subapps`)
- Foundation/School admin → tampilkan tile institusi mereka saja (berdasarkan `staffs.instituteId`)
- Urutan tile: superadmin → foundation → school
- Jika user hanya punya 1 subapp → langsung redirect ke subapp tersebut tanpa tampilkan main menu

**Checklist:**

- [ ] Buat `app/(dashboard)/page.tsx` — query subapps berdasarkan role user, tampilkan sebagai grid card
- [ ] Setiap card menampilkan: logo institusi (jika ada), nama institusi, tipe (badge), tombol "Masuk"
- [ ] Klik "Masuk" → redirect ke `/superadmin`, `/foundation/[key]`, atau `/school/[key]`
- [ ] Buat placeholder page untuk `/superadmin/page.tsx`, `/foundation/[subAppKey]/page.tsx`, `/school/[subAppKey]/page.tsx` (akan diisi statistik di Phase 5)
- [ ] Layout per subapp punya auth check di `layout.tsx` masing-masing (verifikasi role + kepemilikan subAppKey)
- [ ] Test: login sebagai superadmin → lihat semua tile; login sebagai school admin → lihat tile sekolahnya saja

---

## PHASE 3 — SDM

---

### Issue 12: Modul Staf — CRUD + Link ke User Account

**Labels:** `phase-3`, `staff`, `crud`
**Depends on:** Issue 11

**Deskripsi:**
Buat modul manajemen staf. Diakses oleh Super Admin (semua institusi), Foundation Admin (staf yayasannya), dan School Admin (staf sekolahnya). Data yang tampil di-scope berdasarkan role.

**Routes:**
- `/superadmin/staffs`
- `/foundation/[subAppKey]/staffs`
- `/school/[subAppKey]/staffs`

**Business Rules:**
- NIK, nomor staf, email, dan telepon staf harus unik di seluruh sistem
- Satu staf hanya bisa terhubung ke satu akun user (relasi 1-to-1)
- Staf `inactive` tidak bisa login meskipun punya akun user
- Staf tidak bisa dihapus jika masih terlibat dalam transfer berstatus `pending`
- Foundation admin hanya kelola staf yayasannya; School admin hanya kelola staf sekolahnya

**Checklist:**

- [ ] Buat komponen tabel staf yang reusable (dipakai di 3 route berbeda)
- [ ] Tabel menampilkan: nama, nomor staf, departemen, status, akun terhubung (ya/tidak) + tombol aksi
- [ ] Buat form staf dengan field: nama, NIK (opsional), nomor staf, telepon, email, gender, tanggal lahir, tempat lahir (opsional), departemen, tanggal bergabung (opsional), status
- [ ] Buat Server Actions `actions/staff.actions.ts`:
  - `getStaffs(instituteId?)` → list staf, di-scope berdasarkan role
  - `getStaffById(id)` → detail staf
  - `createStaff(data)` → create staf baru di institusi yang sesuai
  - `updateStaff(id, data)` → update data staf
  - `toggleStaffStatus(id)` → active ↔ inactive
  - `linkUserAccount(staffId, userId)` → hubungkan staf ke akun user
  - `unlinkUserAccount(staffId)` → lepas hubungan staf dari akun user
- [ ] Fitur link akun: dropdown/search user yang belum terhubung ke staf manapun
- [ ] Test: buat staf → link ke user → login sebagai user tersebut → verifikasi akses sesuai role

---

### Issue 13: Modul Siswa — CRUD + Lifecycle Status

**Labels:** `phase-3`, `student`, `crud`
**Depends on:** Issue 12

**Deskripsi:**
Buat modul manajemen siswa. Diakses oleh Super Admin (semua siswa) dan School Admin (siswa sekolahnya). Foundation Admin tidak punya akses ke modul ini sama sekali.

**Routes:**
- `/superadmin/students`
- `/school/[subAppKey]/students`

**State machine status siswa:**
```
[pending] → [active] → [inactive]
[pending] → [canceled]
```
Status tidak bisa mundur (inactive tidak bisa kembali active).

**Business Rules:**
- NISN dan nomor siswa lokal harus unik di seluruh sistem
- Siswa `canceled` atau `inactive` tidak bisa membayar SPP baru
- School admin tidak bisa lihat siswa di sekolah lain
- Foundation admin diblokir total dari route ini

**Checklist:**

- [ ] Buat komponen tabel siswa yang reusable
- [ ] Tabel menampilkan: nama, NISN, nomor siswa, angkatan, status (badge warna) + tombol aksi
- [ ] Filter tabel: status, angkatan, pencarian nama/NISN/nomor siswa
- [ ] Buat form siswa dengan field: nama, NIK (opsional), NISN, nomor siswa, tanggal lahir (opsional), tempat lahir (opsional), gender, telepon (opsional), email (opsional), tahun angkatan, tanggal masuk
- [ ] Buat Server Actions `actions/student.actions.ts`:
  - `getStudents(instituteId?, filters?)` → list siswa, di-scope berdasarkan role
  - `getStudentById(id)` → detail siswa + riwayat pembayaran
  - `createStudent(data)` → create dengan status default `pending`
  - `updateStudent(id, data)` → update data siswa (tidak bisa ubah status dari sini)
  - `activateStudent(id)` → `pending → active` (validasi status saat ini)
  - `deactivateStudent(id)` → `active → inactive`
  - `cancelStudent(id)` → `pending → canceled`
- [ ] Tombol aksi disesuaikan dengan status saat ini (tidak tampilkan aksi yang tidak valid)
- [ ] Test: daftarkan siswa → aktivasi → coba deaktivasi → coba kembali aktif (harus gagal)

---

## PHASE 4 — KEUANGAN

---

### Issue 14: Modul Biaya SPP — Definisi Tarif per Tahun (Super Admin)

**Labels:** `phase-4`, `fee`, `crud`
**Depends on:** Issue 13

**Deskripsi:**
Buat modul untuk mendefinisikan besaran SPP per tahun akademik. Hanya Super Admin yang bisa akses modul ini.

**Route:** `/superadmin/fees`

**Business Rules:**
- Hanya boleh ada satu record per kombinasi `fee_type` + `year`
- Besaran biaya tidak bisa diubah jika sudah ada pembayaran yang mengacu ke fee tersebut
- Saat ini hanya ada tipe `spp`
- Gunakan `Decimal.js` untuk kalkulasi, simpan sebagai string di DB

**Checklist:**

- [ ] Buat `app/(dashboard)/superadmin/fees/page.tsx` — tabel list biaya SPP per tahun
- [ ] Tabel menampilkan: tahun, tipe, besaran (format Rupiah), jumlah pembayaran yang mengacu, aksi edit
- [ ] Buat form dengan field: tipe fee (dropdown, saat ini hanya 'spp'), tahun akademik, besaran (input angka dengan format Rupiah)
- [ ] Buat Server Actions `actions/fee.actions.ts`:
  - `getFees()` → list semua definisi biaya
  - `createFee(data)` → create, validasi tidak ada duplikat tipe+tahun
  - `updateFee(id, data)` → update, validasi tidak ada pembayaran yang sudah mengacu
- [ ] Helper format Rupiah: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })`
- [ ] Test: buat SPP 2025 → coba buat SPP 2025 lagi (harus error duplikat)

---

### Issue 15: Modul Pembayaran SPP — Pencatatan + Konfirmasi + Upload Bukti

**Labels:** `phase-4`, `fee-payment`, `crud`
**Depends on:** Issue 14

**Deskripsi:**
Buat modul pencatatan pembayaran SPP siswa. Diakses oleh Super Admin (semua pembayaran) dan School Admin (pembayaran siswa sekolahnya).

**Routes:**
- `/superadmin/fee-payments`
- `/school/[subAppKey]/fee-payments`

**Business Rules:**
- Hanya siswa berstatus `active` yang bisa melakukan pembayaran
- Mendukung pembayaran cicilan (`amount_paid` boleh < `amount` di tabel `fee`)
- Jika `payment_method` = `transfer` → upload bukti bayar wajib
- Status default pembayaran baru: `pending`
- Pembayaran yang sudah `paid` tidak bisa diubah kembali ke `pending`
- School admin hanya kelola pembayaran siswa di sekolahnya

**Checklist:**

- [ ] Buat tabel pembayaran SPP: nama siswa, fee tahun, jumlah bayar, metode, nomor kwitansi, status, tanggal bayar + aksi
- [ ] Filter: status, metode bayar, tahun fee, pencarian nama siswa
- [ ] Buat form pembayaran dengan field: pilih siswa (search dropdown, hanya siswa active), pilih fee (dropdown tahun SPP), jumlah dibayar, metode bayar (transfer/cash), nomor kwitansi (opsional), tanggal dan waktu bayar, upload bukti (wajib jika transfer)
- [ ] Buat Server Actions `actions/fee-payment.actions.ts`:
  - `getFeePayments(filters?)` → list, di-scope berdasarkan role
  - `getFeePaymentsByStudent(studentId)` → riwayat pembayaran per siswa
  - `createFeePayment(data)` → validasi siswa active + validasi upload jika transfer
  - `confirmPayment(id)` → `pending → paid`, validasi status saat ini
- [ ] Halaman detail siswa (`/students/[id]`) menampilkan riwayat pembayaran SPP-nya
- [ ] Test: bayar SPP via transfer tanpa upload bukti (harus error) → upload bukti → berhasil → konfirmasi paid

---

### Issue 16: Modul Transfer Dana — Create + Approval Workflow + Upload Bukti

**Labels:** `phase-4`, `transfer`, `crud`
**Depends on:** Issue 15

**Deskripsi:**
Buat modul transfer dana antar institusi — modul paling kompleks karena melibatkan workflow approval multi-staf.

**Routes:**
- `/superadmin/transfers`
- `/foundation/[subAppKey]/transfers`
- `/school/[subAppKey]/transfers`

**Workflow transfer:**
```
1. Issuer buat pengajuan transfer           → status: pending
2. Sender eksekusi pengiriman dana          → (status masih pending)
3. Approver setujui + upload bukti          → status: success
   ATAU Approver batalkan                   → status: canceled
4. Receiver konfirmasi penerimaan           → (opsional, setelah success)
```

**Business Rules:**
- Transfer tidak boleh dari dan ke institusi yang sama
- Transfer `success` atau `canceled` tidak bisa diubah statusnya
- `receiver_id`, `approver_id`, dan `approved_at` harus diisi bersamaan
- Jika `transfer_method` = `transfer` → `receipt` atau `receipt_file` wajib diisi saat approval
- Foundation admin hanya lihat transfer yang melibatkan yayasannya
- School admin hanya lihat transfer yang melibatkan sekolahnya — tidak bisa approve/cancel

**Checklist:**

- [ ] Buat tabel transfer: dari, ke, jumlah, issuer, status (badge), metode, tanggal + aksi
- [ ] Filter: status, arah (keluar/masuk), metode
- [ ] Buat form buat transfer dengan field: institusi tujuan (dropdown institusi lain), jumlah, staf pengirim (sender), metode transfer, catatan (opsional)
- [ ] Buat halaman detail transfer yang menampilkan seluruh workflow: issuer, sender, approver, receiver, bukti, timeline status
- [ ] Buat Server Actions `actions/transfer.actions.ts`:
  - `getTransfers(filters?)` → list, di-scope berdasarkan role dan kepemilikan institusi
  - `getTransferById(id)` → detail lengkap transfer
  - `createTransfer(data)` → validasi from ≠ to
  - `approveTransfer(id, data)` → set approver, approvedAt, status success, validasi bukti jika transfer bank
  - `cancelTransfer(id)` → status canceled, hanya bisa dari pending
  - `confirmReceived(id, receiverId)` → set receiver (opsional, setelah success)
- [ ] Tombol aksi berdasarkan status + role:
  - `pending` + foundation/superadmin → tampilkan tombol "Setujui" dan "Batalkan"
  - `success` + receiver belum diisi → tampilkan "Konfirmasi Terima"
  - School admin → tidak ada tombol approve/cancel
- [ ] Test: buat transfer → setujui dengan upload bukti → status success → konfirmasi terima

---

## PHASE 5 — FINALISASI

---

### Issue 17: Dashboard Statistik per Role

**Labels:** `phase-5`, `dashboard`, `ui`
**Depends on:** Issue 16

**Deskripsi:**
Isi halaman dashboard per role dengan statistik ringkasan yang relevan. Semua statistik di-scope per institusi — tidak ada data bocor lintas institusi.

**Statistik per role:**

| Role | Statistik |
|---|---|
| Superadmin | Total institusi, total staf, total siswa aktif, total transfer pending, total SPP bulan ini |
| Foundation Admin | Total staf yayasan, transfer pending keluar/masuk, total dana ditransfer bulan ini |
| School Admin | Total siswa aktif, siswa pending, SPP belum dibayar bulan ini, transfer masuk pending |

**Checklist:**

- [ ] Isi `/superadmin/page.tsx` dengan card statistik superadmin
- [ ] Isi `/foundation/[subAppKey]/page.tsx` dengan card statistik foundation (di-scope ke yayasan tersebut)
- [ ] Isi `/school/[subAppKey]/page.tsx` dengan card statistik school (di-scope ke sekolah tersebut)
- [ ] Buat Server Actions untuk query agregasi per dashboard
- [ ] Tampilkan nilai uang dalam format Rupiah
- [ ] Test: statistik superadmin menampilkan data global; statistik school admin hanya data sekolahnya

---

### Issue 18: Fitur Pencarian & Filter di Semua List View

**Labels:** `phase-5`, `ux`, `enhancement`
**Depends on:** Issue 17

**Deskripsi:**
Tambahkan fitur pencarian dan filter yang konsisten di semua halaman list. Gunakan URL search params agar state filter bisa di-bookmark dan di-share.

**Modul yang perlu pencarian/filter:**
- Institusi: cari nama, filter tipe
- Staf: cari nama/nomor staf, filter status, filter departemen
- Siswa: cari nama/NISN/nomor siswa, filter status, filter angkatan
- Biaya: filter tipe, filter tahun
- Pembayaran SPP: cari nama siswa, filter status, filter metode, filter tahun fee
- Transfer: filter status, filter arah (keluar/masuk), filter metode

**Checklist:**

- [ ] Buat komponen `components/data-table/data-table.tsx` — tabel reusable dengan props: data, columns, pagination
- [ ] Buat komponen `components/data-table/search-input.tsx` — input search dengan debounce 300ms, update URL search params
- [ ] Buat komponen `components/data-table/filter-select.tsx` — dropdown filter, update URL search params
- [ ] Implementasi paginasi server-side: default 10 item per halaman, configurable via URL param `?page=&limit=`
- [ ] Update semua Server Actions list untuk menerima parameter filter dan pagination
- [ ] Test: filter + search + paginasi bekerja bersamaan; refresh halaman mempertahankan filter

---

### Issue 19: Ekspor Data — Rekap SPP ke PDF/Excel

**Labels:** `phase-5`, `export`, `feature`
**Depends on:** Issue 18

**Deskripsi:**
Tambahkan fitur ekspor rekap pembayaran SPP ke format PDF dan Excel. Digunakan oleh School Admin untuk pelaporan.

**Checklist:**

- [ ] Install dependency: `pnpm add xlsx` (untuk Excel) dan `pnpm add @react-pdf/renderer` (untuk PDF)
- [ ] Buat tombol "Ekspor" di halaman list pembayaran SPP School Admin
- [ ] Ekspor Excel: semua kolom relevan (nama siswa, NISN, fee tahun, jumlah, metode, status, tanggal)
- [ ] Ekspor PDF: format laporan dengan header nama sekolah, periode, tabel data, total
- [ ] Filter ekspor mengikuti filter yang aktif saat ini (bukan ekspor semua data)
- [ ] Nama file ekspor: `rekap-spp-[nama-sekolah]-[periode].xlsx` / `.pdf`
- [ ] Test: ekspor 10 data → verifikasi file ter-download dengan data yang benar

---

### Issue 20: Email Notifikasi — Transfer Pending & Konfirmasi Pembayaran

**Labels:** `phase-5`, `email`, `feature`
**Depends on:** Issue 19

**Deskripsi:**
Tambahkan email notifikasi otomatis menggunakan Resend untuk event-event penting dalam sistem. Email dikirim dalam Bahasa Indonesia.

**Email yang dikirim:**

| Event | Penerima | Konten |
|---|---|---|
| Transfer baru dibuat | Approver (foundation/superadmin) | Detail transfer + link ke halaman transfer |
| Pembayaran SPP dikonfirmasi (`paid`) | School Admin terkait | Nama siswa, jumlah, periode |

**Checklist:**

- [ ] Buat `lib/email.ts` — helper fungsi kirim email via Resend
- [ ] Buat email template HTML sederhana (inline CSS) untuk setiap jenis email
- [ ] Trigger email notifikasi transfer di Server Action `createTransfer()`
- [ ] Trigger email konfirmasi di Server Action `confirmPayment()`
- [ ] Handle error pengiriman email dengan graceful (jika gagal kirim email, operasi utama tetap sukses — log error saja)
- [ ] Test: buat transfer → cek approver menerima email notifikasi

---

### Issue 21: Testing & Bug Fixing — QA Keseluruhan Sistem

**Labels:** `phase-5`, `testing`, `qa`
**Depends on:** Issue 20

**Deskripsi:**
Lakukan pengujian menyeluruh semua fitur dan perbaikan bug yang ditemukan. Fokus pada security (data isolation) dan business rules yang kritis.

**Checklist:**

**Security Testing:**
- [ ] School admin tidak bisa lihat data siswa sekolah lain (coba manipulasi URL)
- [ ] Foundation admin tidak bisa akses route `/school/*` dengan cara apapun
- [ ] Server Actions memvalidasi role + kepemilikan institusi (tidak hanya rely pada middleware)
- [ ] Uploadthing endpoint tidak bisa diakses tanpa session valid

**Business Rules Testing:**
- [ ] Siswa inactive/canceled tidak bisa ditambahkan pembayaran SPP
- [ ] Transfer ke institusi yang sama harus error
- [ ] Biaya SPP tidak bisa diubah jika sudah ada pembayaran
- [ ] Password lama wajib diverifikasi sebelum ganti password baru
- [ ] Email wajib diverifikasi sebelum bisa login

**UX Testing:**
- [ ] Semua form tampilkan pesan error yang jelas dalam Bahasa Indonesia
- [ ] Loading state tampil saat submit form
- [ ] Redirect yang benar setelah setiap operasi sukses
- [ ] Halaman responsive di mobile (minimal 375px width)

---

## Ringkasan Issue

| # | Judul | Phase | Depends on |
|---|---|---|---|
| 1 | Setup Project — Install Dependencies & Konfigurasi Dasar | 1 | — |
| 2 | Setup Database — Drizzle ORM + Koneksi Neon PostgreSQL | 1 | #1 |
| 3 | Setup Database Schema — Definisi Semua Tabel & Enum | 1 | #2 |
| 4 | Setup Better Auth — Autentikasi Email/Password + Resend Email | 1 | #3 |
| 5 | Setup Uploadthing — File Storage | 1 | #4 |
| 6 | Setup Middleware — Auth Protection & Route Guard | 1 | #4 |
| 7 | Setup Layout Dashboard — Sidebar + Header | 1 | #6 |
| 8 | Halaman Autentikasi — Login, Register, Forgot Password, Verifikasi Email | 2 | #7 |
| 9 | Halaman Profil — Edit Profil, Ganti Avatar, Ganti Password, Kelola Sesi | 2 | #8 |
| 10 | Modul Institusi — CRUD Institusi + Hierarki (Super Admin) | 2 | #9 |
| 11 | Dashboard & Main Menu — Halaman Utama per Role | 2 | #10 |
| 12 | Modul Staf — CRUD + Link ke User Account | 3 | #11 |
| 13 | Modul Siswa — CRUD + Lifecycle Status | 3 | #12 |
| 14 | Modul Biaya SPP — Definisi Tarif per Tahun (Super Admin) | 4 | #13 |
| 15 | Modul Pembayaran SPP — Pencatatan + Konfirmasi + Upload Bukti | 4 | #14 |
| 16 | Modul Transfer Dana — Create + Approval Workflow + Upload Bukti | 4 | #15 |
| 17 | Dashboard Statistik per Role | 5 | #16 |
| 18 | Fitur Pencarian & Filter di Semua List View | 5 | #17 |
| 19 | Ekspor Data — Rekap SPP ke PDF/Excel | 5 | #18 |
| 20 | Email Notifikasi — Transfer Pending & Konfirmasi Pembayaran | 5 | #19 |
| 21 | Testing & Bug Fixing — QA Keseluruhan Sistem | 5 | #20 |
