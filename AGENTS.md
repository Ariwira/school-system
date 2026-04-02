# Agent Rules — School ERP System

## Next.js
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Sebelum Menulis Kode

1. **Fetch issue dari GitHub** — jangan baca dari file lokal:
   ```bash
   gh issue view <nomor> --repo Ariwira/school-system
   ```
2. **Cek dependency issue sudah closed** sebelum mulai mengerjakan
3. **Buat branch baru dari `main`** — WAJIB, jangan langsung commit ke `main`:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/issue-<nomor>-<slug>
   ```
4. **Baca file yang ada** sebelum membuat file baru — jangan duplikasi
5. **Cek schema** di `lib/db/schema/` sebelum menulis query Drizzle

## Setelah Selesai Menulis Kode

1. **Commit** semua perubahan ke branch yang sudah dibuat
2. **Push branch** ke remote:
   ```bash
   git push -u origin feat/issue-<nomor>-<slug>
   ```
3. **Jalankan test plan** — jalankan semua perintah yang relevan (TypeScript check, build check, db check, dll) dan simpan outputnya:
   ```bash
   pnpm tsc --noEmit
   pnpm build  # jika relevan
   # perintah lain sesuai konteks issue
   ```
4. **Jalankan review keamanan** — panggil agent `review-security` untuk issue ini sebelum membuat PR
5. **Buat PR** ke `main` — isi body PR sesuai template (checklist + hasil test). Jangan sertakan teks "Generated with Claude Code":
   ```bash
   gh pr create --title "feat: <deskripsi singkat> (#<nomor>)" --body "$(cat <<'EOF'
   ## Terkait Issue
   Closes #<nomor>

   ## Ringkasan Perubahan
   <ringkasan>

   ## Hasil Test Plan
   <tempel output hasil test>

   ## Checklist
   - [x] ...
   EOF
   )"
   ```
6. **Jangan merge sendiri** — informasikan ke user bahwa PR sudah dibuat dan siap di-review

## Aturan Teknis

### TypeScript
- Jangan gunakan `any` — gunakan `unknown` jika tipe tidak diketahui
- Selalu definisikan return type untuk Server Actions
- Gunakan `satisfies` bukan `as` jika memungkinkan

### Drizzle ORM
- Selalu import dari `lib/db` (bukan buat instance baru)
- Gunakan parameterized queries — jangan string concatenation
- Setelah ubah schema → ingatkan user untuk jalankan `pnpm db:generate && pnpm db:migrate`

### Better Auth
- Gunakan `requireRole()` dari `lib/auth-helpers.ts` di awal setiap Server Action
- Jangan akses session langsung dari header/cookie — gunakan helper yang sudah ada

### Naming Convention
- Server Actions: `verbNoun` — `createStaff`, `updateInstitute`, `deleteTransfer`
- Files: kebab-case — `fee-payment.actions.ts`, `institute-form.tsx`
- Components: PascalCase — `StaffTable`, `InstituteForm`
- DB schema variables: camelCase — `feePayments`, `institutes`

## Yang Tidak Boleh Dilakukan
- Jangan buat API Route untuk operasi mutasi — gunakan Server Actions
- Jangan skip validasi role di Server Action meskipun middleware sudah ada
- Jangan gunakan `router.push` tanpa `revalidatePath` setelah mutasi data
- Jangan import dari `better-auth/react` di server component
- Jangan import dari `better-auth` (server) di client component
