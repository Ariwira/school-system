## Terkait Issue

Closes #<!-- nomor issue -->

## Ringkasan Perubahan

<!-- Jelaskan singkat apa yang diubah dan mengapa -->

## Checklist

### Wajib
- [ ] Issue sudah di-fetch dari GitHub sebelum mulai coding
- [ ] Dependency issue sudah closed sebelum PR ini dibuat
- [ ] Kode sudah mengikuti aturan di `CLAUDE.md` dan `AGENTS.md`

### Database (jika ada perubahan schema)
- [ ] `pnpm db:generate` sudah dijalankan
- [ ] `pnpm db:migrate` sudah dijalankan
- [ ] Tidak ada enum value yang dihapus/diubah tanpa migration

### Keamanan & RBAC
- [ ] `requireRole()` dipanggil di awal setiap Server Action
- [ ] Data isolation sudah diterapkan (filter by `instituteId` untuk non-superadmin)
- [ ] Tidak ada data client yang di-trust tanpa validasi ulang di Server Action

### Kode
- [ ] Tidak ada `any` di TypeScript
- [ ] Nilai uang pakai `string` + `Decimal.js`, bukan `number`/`float`
- [ ] Error message dalam Bahasa Indonesia
- [ ] Form pakai React Hook Form + Zod
- [ ] List view punya paginasi (default 10 item)
- [ ] Loading state ada saat submit form

### File Upload (jika ada)
- [ ] Upload via Uploadthing, bukan ke `public/`
- [ ] File lama dihapus dari Uploadthing saat diganti

## Testing

<!-- Jelaskan bagaimana perubahan ini sudah ditest -->

## Screenshot (jika ada perubahan UI)

<!-- Tempel screenshot sebelum/sesudah jika relevan -->
