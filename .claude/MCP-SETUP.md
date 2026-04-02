# MCP Setup — School ERP System

## MCP yang Direkomendasikan

### 1. GitHub MCP (Prioritas Tinggi)
Untuk membuat issue, label, milestone langsung dari Claude tanpa buka browser.

**Install:**
```bash
claude mcp add github -s project -- npx -y @modelcontextprotocol/server-github
```

**Butuh:** GitHub Personal Access Token dengan scope `repo`

**Kegunaan di proyek ini:**
- Buat semua issue dari `GITHUB-ISSUES.md` langsung via Claude
- Update status issue saat mengerjakan
- Buat PR setelah selesai implementasi

### 2. PostgreSQL MCP (Opsional)
Untuk query langsung ke database Neon dari Claude — berguna saat debug data.

**Install:**
```bash
claude mcp add postgres -s project -- npx -y @modelcontextprotocol/server-postgres postgresql://...
```

**Butuh:** Connection string Neon (dari `.env.local`)

**Kegunaan di proyek ini:**
- Cek data langsung saat debug
- Verifikasi migration berhasil
- Lihat isi tabel tanpa buka Drizzle Studio

---

## Cara Setup GitHub MCP

1. Buat Personal Access Token di GitHub:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Centang scope: `repo`, `read:org`

2. Jalankan perintah install di atas

3. Set environment variable:
   ```bash
   # Di terminal sebelum jalankan claude
   export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
   ```

Setelah setup, Claude bisa langsung buat issue dengan perintah seperti:
> "Buat semua issue dari GITHUB-ISSUES.md ke repo Ariwira/school-system"
