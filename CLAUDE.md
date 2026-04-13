@AGENTS.md

# School ERP System — Project Instructions

## Konteks Proyek
School ERP untuk manajemen institusi pendidikan berbasis yayasan. Stack: Next.js 15 (App Router), TypeScript, PostgreSQL via Neon, Drizzle ORM, Better Auth, Uploadthing, TailwindCSS v4, shadcn/ui.

Issue development ada di **GitHub: https://github.com/Ariwira/school-system/issues** — selalu fetch dari sana, bukan dari file lokal. `GITHUB-ISSUES.md` hanya dipakai untuk *membuat* issues, bukan referensi saat coding. Baca `PRD-REDEVELOPMENT.md` untuk referensi bisnis lengkap.

## Aturan Wajib

### Database
- Semua primary key pakai **UUID** (`uuid('id').primaryKey().defaultRandom()`)
- Semua nilai uang pakai **`numeric(12,2)`** di DB, **string** di TypeScript — gunakan `Decimal.js` untuk kalkulasi
- Timestamp disimpan **UTC**, tampilkan dalam **WITA (UTC+8)**
- Setelah ubah schema di `lib/db/schema/` → wajib jalankan `pnpm db:generate` lalu `pnpm db:migrate`

### Autentikasi & RBAC
- **Tidak menggunakan organization plugin** dari Better Auth
- RBAC menggunakan `role` di tabel `users` + tabel `user_subapps` (SubApp sebagai proxy RBAC)
- Roles di `users.role`: `superadmin` | `user`
  - `superadmin` → akses penuh ke seluruh platform
  - `user` → akses ditentukan dari `user_subapps`, role efektif dari `subapp.type` (`foundation` atau `school`)
- RBAC ditegakkan di **3 lapisan**: middleware → layout → Server Action
- **Jangan pernah trust data dari client** — selalu re-validasi di Server Action

### Data Isolation (WAJIB di setiap Server Action)
```ts
// Superadmin → bisa lihat semua
// User biasa → akses via subapp, role efektif dari subapp.type
const { subapp } = await requireSubappAccess(subAppKey)
const scopedInstituteId = subapp.instituteId

// Setelah fetch record:
if (existing.instituteId !== scopedInstituteId) {
  return { success: false, error: 'Akses ditolak.' }
}
```

### Server Actions
- Gunakan **Server Actions** untuk semua mutasi — bukan API Routes
- API Routes hanya untuk: Better Auth handler + Uploadthing handler
- Pola return value yang konsisten:
  ```ts
  return { success: true, data: ... }
  return { success: false, error: 'Pesan error dalam Bahasa Indonesia' }
  ```
- Semua error message dalam **Bahasa Indonesia**

### UI & Form
- Gunakan **shadcn/ui** untuk semua komponen UI
- Gunakan **React Hook Form + Zod** untuk semua form
- Semua list view wajib punya **paginasi** (default 10 item)
- Loading state wajib ada saat submit form

### File Upload
- Gunakan **Uploadthing** — jangan upload langsung ke public folder
- File lama **wajib dihapus** dari Uploadthing saat diganti

## Struktur Direktori
```
app/
  (auth)/          → halaman login, register, dll (tanpa sidebar)
  (dashboard)/     → halaman authenticated (dengan sidebar)
    superadmin/
    foundation/[subAppKey]/
    school/[subAppKey]/
lib/
  auth.ts          → Better Auth config (server)
  auth-client.ts   → Better Auth config (client)
  db/
    index.ts       → Drizzle instance
    schema/        → schema per entitas
  uploadthing.ts
  auth-helpers.ts  → requireAuth(), requireRole(), getUserInstituteId()
actions/           → Server Actions per modul
components/
  ui/              → shadcn/ui components
  layout/          → Sidebar, Header, Breadcrumb
  data-table/      → tabel reusable dengan paginasi
```

## Workflow Pengerjaan Issue

### Urutan Wajib per Issue

1. **Pilih issue sesuai phase** — selesaikan phase-1 dulu sebelum lanjut ke phase-2, dst.
2. **Fetch issue dari GitHub** sebelum mulai:
   ```bash
   gh issue view <nomor> --repo Ariwira/school-system
   ```
3. **Cek dependency** — pastikan semua issue yang jadi prasyarat sudah `closed`.
4. **Buat branch** dari `main`:
   ```bash
   git checkout -b feat/issue-<nomor>-<slug>
   ```
5. **Implementasi** — gunakan agent `implement-issue`:
   ```
   kerjakan issue <nomor>
   ```
6. **Jika ada perubahan schema DB** — jalankan segera setelah agent selesai:
   ```bash
   pnpm db:generate && pnpm db:migrate
   ```
7. **Review keamanan** — gunakan agent `review-security`:
   ```
   review keamanan issue <nomor>
   ```
8. **Commit & PR**:
   ```bash
   git commit -m "feat: <deskripsi singkat> (#<nomor>)"
   gh pr create
   ```
   Sertakan `Closes #<nomor>` di body PR agar issue otomatis tertutup saat merge.
9. **Merge ke `main`** setelah PR di-review.

### Aturan Branch & Commit
- Format branch: `feat/issue-3-setup-database`, `fix/issue-14-student-lifecycle`
- Format commit: `feat: setup drizzle orm + neon connection (#3)`
- **Satu issue = satu PR** — jangan gabung banyak issue dalam satu PR

## Jangan Lakukan
- Jangan pakai `any` di TypeScript
- Jangan expose `instituteId` dari session tanpa validasi ulang di DB
- Jangan hapus atau ubah enum value yang sudah ada di DB tanpa migration
- Jangan gunakan `float`/`number` untuk nilai uang
- Jangan commit `.env.local`
