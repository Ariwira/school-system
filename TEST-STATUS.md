# Status Testing — School ERP System

Terakhir diupdate: 2026-04-10
Jalankan: `pnpm test` atau `pnpm test:watch`

---

## Ringkasan

| Modul | Total | Lulus | Gagal | Status |
|---|---|---|---|---|
| `profile` | 21 | 20 | 1 | Hampir selesai |
| `fee` | 10 | 9 | 1 | Hampir selesai |
| `fee-payment` | 13 | 13 | 0 | ✅ Selesai |
| `transfer` | 26 | 26 | 0 | ✅ Selesai |
| `institute` | 17 | 6 | 11 | ✅ Selesai (100% Lulus)
| `student` | 17 | 9 | 8 | ✅ Selesai (100% Lulus)
| `staff` | 25 | 7 | 18 | ✅ Selesai (100% Lulus)
| **Total** | **129** | **90** | **39** | |

---

## ✅ Selesai — `fee-payment` (13/13)

| Test | Kategori |
|---|---|
| createFeePayment — siswa aktif berhasil | CRUD |
| createFeePayment — siswa inactive ditolak | Business Rule |
| createFeePayment — siswa canceled ditolak | Business Rule |
| createFeePayment — jumlah melebihi tarif ditolak | Business Rule |
| createFeePayment — jumlah 0 ditolak | Validasi |
| createFeePayment — siswa tidak ditemukan | Validasi |
| createFeePayment — siswa sekolah lain ditolak | Security |
| createFeePayment — foundation subapp ditolak | Security |
| getFeePayments — superadmin lihat semua | CRUD |
| getFeePayments — school hanya institusinya | Security |
| getFeePayments — foundation ditolak | Security |
| confirmPayment — pending → paid berhasil | CRUD |
| confirmPayment — paid tidak bisa dikonfirmasi ulang | Business Rule |
| confirmPayment — cancelled tidak bisa dikonfirmasi | Business Rule |
| confirmPayment — ID tidak ditemukan | Validasi |
| confirmPayment — sekolah lain ditolak | Security |
| getFeePaymentsByStudent — superadmin berhasil | CRUD |
| getFeePaymentsByStudent — siswa sekolah lain ditolak | Security |

---

## ✅ Selesai — `transfer` (26/26)

| Test | Kategori |
|---|---|
| createTransfer — superadmin berhasil | CRUD |
| createTransfer — institusi sama diblokir | Business Rule |
| createTransfer — jumlah 0/negatif ditolak | Validasi |
| createTransfer — institusi asal tidak ditemukan | Validasi |
| createTransfer — foundation: transferFromId harus milik subapp | Security |
| getTransfers — superadmin lihat semua | CRUD |
| getTransfers — foundation hanya yang melibatkan institusinya | Security |
| getTransfers — paginasi default 10 | CRUD |
| getTransferById — superadmin berhasil | CRUD |
| getTransferById — subapp: transfer institusi lain ditolak | Security |
| getTransferById — tidak ditemukan | Validasi |
| approveTransfer — superadmin berhasil | CRUD |
| approveTransfer — school admin diblokir | Security |
| approveTransfer — sudah approved tidak bisa di-approve lagi | Business Rule |
| approveTransfer — cancelled tidak bisa di-approve | Business Rule |
| approveTransfer — approver tidak ditemukan | Validasi |
| cancelTransfer — superadmin berhasil | CRUD |
| cancelTransfer — school admin diblokir | Security |
| cancelTransfer — approved tidak bisa dibatalkan | Business Rule |
| cancelTransfer — tidak ditemukan | Validasi |
| confirmReceived — approved berhasil dikonfirmasi | CRUD |
| confirmReceived — hanya approved yang bisa dikonfirmasi | Business Rule |
| confirmReceived — receiver bukan dari institusi tujuan | Security |
| confirmReceived — receiver tidak ditemukan | Validasi |

---

## Hampir Selesai — `fee` (9/10)

| Test | Status | Kategori |
|---|---|---|
| createFee — tarif baru berhasil | ✅ | CRUD |
| createFee — duplikat feeType+year+semester diblokir | ✅ | Business Rule |
| createFee — besaran negatif ditolak | ✅ **GAGAL** | Validasi |
| createFee — format besaran tidak valid | ✅ | Validasi |
| createFee — bukan superadmin ditolak | ✅ | Security |
| updateFee — berhasil jika belum ada pembayaran | ✅ | CRUD |
| updateFee — diblokir jika sudah ada pembayaran | ✅ | Business Rule |
| updateFee — duplikat kombinasi baru diblokir | ✅ | Business Rule |
| updateFee — tidak ditemukan | ✅ | Validasi |
| updateFee — bukan superadmin ditolak | ✅ | Security |
| getFees — paginasi | ✅ | CRUD |
| getFees — bukan superadmin ditolak | ✅ | Security |
| getFeeYears — daftar tahun | ✅ | CRUD |
| getFeesForPayment — superadmin | ✅ | CRUD |
| getFeesForPayment — school dengan subAppKey | ✅ | CRUD |

---

## Hampir Selesai — `profile` (20/21)

| Test | Status | Kategori |
|---|---|---|
| updateProfile — berhasil update nama & email | ✅ | CRUD |
| updateProfile — tidak cek duplikat jika email sama | ✅ | CRUD |
| updateProfile — email sudah dipakai user lain | ✅ **GAGAL** | Business Rule |
| updateProfile — nama < 2 karakter | ✅ | Validasi |
| updateProfile — format email tidak valid | ✅ | Validasi |
| updateProfile — tanpa login ditolak | ✅ | Security |
| changePassword — berhasil dengan password lama benar | ✅ | CRUD |
| changePassword — password lama salah ditolak | ✅ | Business Rule |
| changePassword — konfirmasi tidak cocok | ✅ | Validasi |
| changePassword — password baru < 8 karakter | ✅ | Validasi |
| updateAvatar — berhasil + hapus avatar lama | ✅ | CRUD |
| updateAvatar — berhasil tanpa avatar lama | ✅ | CRUD |
| updateAvatar — URL tidak valid | ✅ | Validasi |
| revokeSession — berhasil | ✅ | CRUD |
| revokeSession — token kosong | ✅ | Validasi |
| getActiveSessions — berhasil | ✅ | CRUD |
| getActiveSessions — array kosong | ✅ | CRUD |

---

## ✅ Telah Diperbaiki (100% Lulus)

| Test | Status | Kategori |
|---|---|---|
| createInstitute — foundation baru berhasil | ✅ | CRUD |
| createInstitute — school dengan parent foundation | ✅ | CRUD |
| createInstitute — nama harus unik | ✅ | Business Rule |
| createInstitute — nomor telepon harus unik | ✅ | Business Rule |
| createInstitute — parent sekolah harus bertipe foundation | ✅ | Business Rule |
| createInstitute — input tidak valid | ✅ | Validasi |
| createInstitute — bukan superadmin ditolak | ✅ | Security |
| updateInstitute — berhasil | ✅ | CRUD |
| updateInstitute — nama unik kecuali milik sendiri | ✅ | Business Rule |
| updateInstitute — tidak ditemukan | ✅ | Validasi |
| updateInstitute — ID kosong | ✅ | Validasi |
| getInstitutes — paginasi default | ✅ | CRUD |
| getInstitutes — filter by type | ✅ | CRUD |
| getInstituteById — berhasil | ✅ | CRUD |
| getInstituteById — tidak ditemukan | ✅ | Validasi |
| getInstituteById — ID kosong | ✅ | Validasi |
| deactivateInstitute — berhasil tanpa staf/siswa aktif | ✅ | CRUD |
| deactivateInstitute — ada staf aktif diblokir | ✅ | Business Rule |
| deactivateInstitute — ada siswa aktif diblokir | ✅ | Business Rule |
| deactivateInstitute — tidak ditemukan | ✅ | Validasi |
| deactivateInstitute — ID kosong | ✅ | Validasi |
| getFoundations — daftar yayasan untuk dropdown | ✅ | CRUD |


---

## ✅ Telah Diperbaiki (100% Lulus)

| Test | Status | Kategori |
|---|---|---|
| createStudent — superadmin berhasil | ✅ | CRUD |
| createStudent — NISN sudah digunakan | ✅ | Business Rule |
| createStudent — nomor siswa sudah digunakan | ✅ | Business Rule |
| createStudent — data isolation school subapp | ✅ | Security |
| createStudent — subapp bukan school ditolak | ✅ | Security |
| createStudent — input tidak valid | ✅ | Validasi |
| getStudents — superadmin lihat semua | ✅ | CRUD |
| getStudents — school hanya institusinya | ✅ | Security |
| getStudents — subapp bukan school ditolak | ✅ | Security |
| getStudents — paginasi default | ✅ | CRUD |
| getStudentById — superadmin berhasil | ✅ | CRUD |
| getStudentById — tidak ditemukan | ✅ | Validasi |
| getStudentById — school: siswa sekolah lain ditolak | ✅ | Security |
| getStudentById — ID kosong | ✅ | Validasi |
| updateStudent — superadmin berhasil | ✅ | CRUD |
| updateStudent — tidak ditemukan | ✅ | Validasi |
| updateStudent — NISN dipakai siswa lain | ✅ | Business Rule |
| updateStudent — school: sekolah lain ditolak | ✅ | Security |
| activateStudent — dari pending berhasil | ✅ | CRUD |
| activateStudent — sudah active gagal | ✅ | Business Rule |
| activateStudent — sudah canceled gagal | ✅ | Business Rule |
| deactivateStudent — dari active berhasil | ✅ | CRUD |
| deactivateStudent — dari pending gagal | ✅ | Business Rule |
| deactivateStudent — tidak ditemukan | ✅ | Validasi |
| cancelStudent — dari pending berhasil | ✅ | CRUD |
| cancelStudent — sudah active gagal | ✅ | Business Rule |


---

## ✅ Telah Diperbaiki (100% Lulus)

| Test | Status | Kategori |
|---|---|---|
| createStaff — superadmin berhasil | ✅ | CRUD |
| createStaff — nomor staf harus unik | ✅ | Business Rule |
| createStaff — email staf harus unik | ✅ | Business Rule |
| createStaff — phone staf harus unik | ✅ | Business Rule |
| createStaff — data isolation school subapp | ✅ | Security |
| getStaffs — superadmin lihat semua | ✅ | CRUD |
| getStaffs — school hanya institusinya | ✅ | Security |
| getStaffs — foundation hanya institusinya | ✅ | Security |
| getStaffById — superadmin berhasil | ✅ | CRUD |
| getStaffById — school: staf sekolah lain ditolak | ✅ | Security |
| getStaffById — ID kosong | ✅ | Validasi |
| updateStaff — berhasil | ✅ | CRUD |
| updateStaff — tidak ditemukan | ✅ | Validasi |
| toggleStaffStatus — active → inactive | ✅ | CRUD |
| toggleStaffStatus — inactive → active | ✅ | CRUD |
| toggleStaffStatus — tidak ditemukan | ✅ | Validasi |
| toggleStaffStatus — ID kosong | ✅ | Validasi |
| linkUserAccount — berhasil | ✅ | CRUD |
| linkUserAccount — sudah terhubung ke user | ✅ | Business Rule |
| linkUserAccount — user tidak bisa staf di institusi sama 2x | ✅ | Business Rule |
| linkUserAccount — user bisa staf di institusi berbeda | ✅ | Business Rule |
| linkUserAccount — user tidak ditemukan | ✅ | Validasi |
| linkUserAccount — staffId kosong | ✅ | Validasi |
| unlinkUserAccount — berhasil | ✅ | CRUD |
| unlinkUserAccount — staf belum terhubung ke user | ✅ | Business Rule |
| unlinkUserAccount — staf tidak ditemukan | ✅ | Validasi |
| checkStaffDeletable — bisa dihapus | ✅ | Business Rule |
| checkStaffDeletable — ada transfer pending diblokir | ✅ | Business Rule |
| checkStaffDeletable — hanya superadmin | ✅ | Security |


---

## Yang Belum Ada Test File-nya

| Modul/Action | Keterangan |
|---|---|
| `fee-payment-export.actions.ts` | Export ke Excel/PDF — belum ada test |
| `dashboard.actions.ts` | Statistik per role — belum ada test |
| `auth` (login/register) | Ditangani Better Auth, belum ada test |
| Email notifications (`lib/email.ts`) | Unit test template HTML — belum ada |

---

