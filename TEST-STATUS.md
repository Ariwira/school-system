# Status Testing — School ERP System

Terakhir diupdate: 2026-04-10
Jalankan: `pnpm test` atau `pnpm test:watch`

---

## Ringkasan

| Modul                | Total   | Lulus   | Gagal | Status     |
| -------------------- | ------- | ------- | ----- | ---------- |
| `profile`            | 21      | 21      | 0     | ✅ Selesai |
| `fee`                | 15      | 15      | 0     | ✅ Selesai |
| `fee-payment`        | 18      | 18      | 0     | ✅ Selesai |
| `fee-payment-export` | 7       | 7       | 0     | ✅ Selesai |
| `transfer`           | 24      | 24      | 0     | ✅ Selesai |
| `institute`          | 22      | 22      | 0     | ✅ Selesai |
| `student`            | 26      | 26      | 0     | ✅ Selesai |
| `staff`              | 21      | 21      | 0     | ✅ Selesai |
| `dashboard`          | 12      | 12      | 0     | ✅ Selesai |
| `auth-helpers`       | 11      | 11      | 0     | ✅ Selesai |
| `email`              | 5       | 5       | 0     | ✅ Selesai |
| **Total**            | **202** | **202** | **0** |            |

---

## ✅ Selesai — `dashboard` (12/12)

| Test                                           | Kategori      |
| ---------------------------------------------- | ------------- |
| getSuperadminStats — berhasil                  | CRUD          |
| getSuperadminStats — tangani sum NULL          | Business Rule |
| getSuperadminStats — bukan superadmin ditolak  | Security      |
| getSuperadminStats — error database            | Robustness    |
| getFoundationStats — berhasil                  | CRUD          |
| getFoundationStats — tanpa instituteId ditolak | Business Rule |
| getFoundationStats — akses ditolak             | Security      |
| getFoundationStats — error database            | Robustness    |
| getSchoolStats — berhasil                      | CRUD          |
| getSchoolStats — tanpa instituteId ditolak     | Business Rule |
| getSchoolStats — akses ditolak                 | Security      |
| getSchoolStats — error database                | Robustness    |

---

## ✅ Selesai — `fee-payment-export` (7/7)

| Test                                                | Kategori      |
| --------------------------------------------------- | ------------- |
| getFeePaymentsForExport — tanpa filter berhasil     | CRUD          |
| getFeePaymentsForExport — filter feeYear berhasil   | CRUD          |
| getFeePaymentsForExport — bukan school ditolak      | Security      |
| getFeePaymentsForExport — tanpa instituteId ditolak | Business Rule |
| getFeePaymentsForExport — filter tidak valid        | Validasi      |
| getFeePaymentsForExport — akses ditolak             | Security      |
| getFeePaymentsForExport — error database            | Robustness    |

---

## ✅ Selesai — `auth-helpers` (11/11)

| Test                                               | Kategori |
| -------------------------------------------------- | -------- |
| requireAuth — login berhasil                       | Security |
| requireAuth — belum login ditolak                  | Security |
| requireRole — role sesuai berhasil                 | Security |
| requireRole — role tidak sesuai ditolak            | Security |
| requireRole — belum login ditolak                  | Security |
| requireSubappAccess — superadmin bypass            | Security |
| requireSubappAccess — superadmin subapp tidak ada  | Validasi |
| requireSubappAccess — user biasa berhasil          | Security |
| requireSubappAccess — user biasa tidak punya akses | Security |
| getUserSubapps — superadmin semua subapp           | Security |
| getUserSubapps — user biasa subapp tertentu        | Security |

---

## ✅ Selesai — `email` (5/5)

| Test                                            | Kategori   |
| ----------------------------------------------- | ---------- |
| sendTransferPendingEmail — berhasil             | Email      |
| sendTransferPendingEmail — error dari Resend    | Robustness |
| sendTransferPendingEmail — exception pengiriman | Robustness |
| sendPaymentConfirmedEmail — berhasil            | Email      |
| sendPaymentConfirmedEmail — error dari Resend   | Robustness |

---

## ✅ Selesai — `fee-payment` (18/18)

| Test                                                 | Kategori      |
| ---------------------------------------------------- | ------------- |
| createFeePayment — siswa aktif berhasil              | CRUD          |
| createFeePayment — siswa inactive ditolak            | Business Rule |
| createFeePayment — siswa canceled ditolak            | Business Rule |
| createFeePayment — jumlah melebihi tarif ditolak     | Business Rule |
| createFeePayment — jumlah 0 ditolak                  | Validasi      |
| createFeePayment — siswa tidak ditemukan             | Validasi      |
| createFeePayment — siswa sekolah lain ditolak        | Security      |
| createFeePayment — foundation subapp ditolak         | Security      |
| getFeePayments — superadmin lihat semua              | CRUD          |
| getFeePayments — school hanya institusinya           | Security      |
| getFeePayments — foundation ditolak                  | Security      |
| confirmPayment — pending → paid berhasil             | CRUD          |
| confirmPayment — paid tidak bisa dikonfirmasi ulang  | Business Rule |
| confirmPayment — cancelled tidak bisa dikonfirmasi   | Business Rule |
| confirmPayment — ID tidak ditemukan                  | Validasi      |
| confirmPayment — sekolah lain ditolak                | Security      |
| getFeePaymentsByStudent — superadmin berhasil        | CRUD          |
| getFeePaymentsByStudent — siswa sekolah lain ditolak | Security      |

---

## ✅ Selesai — `transfer` (24/24)

| Test                                                           | Kategori      |
| -------------------------------------------------------------- | ------------- |
| createTransfer — superadmin berhasil                           | CRUD          |
| createTransfer — institusi sama diblokir                       | Business Rule |
| createTransfer — jumlah 0/negatif ditolak                      | Validasi      |
| createTransfer — institusi asal tidak ditemukan                | Validasi      |
| createTransfer — foundation: transferFromId harus milik subapp | Security      |
| getTransfers — superadmin lihat semua                          | CRUD          |
| getTransfers — foundation hanya yang melibatkan institusinya   | Security      |
| getTransfers — paginasi default 10                             | CRUD          |
| getTransferById — superadmin berhasil                          | CRUD          |
| getTransferById — subapp: transfer institusi lain ditolak      | Security      |
| getTransferById — tidak ditemukan                              | Validasi      |
| approveTransfer — superadmin berhasil                          | CRUD          |
| approveTransfer — school admin diblokir                        | Security      |
| approveTransfer — sudah approved tidak bisa di-approve lagi    | Business Rule |
| approveTransfer — cancelled tidak bisa di-approve              | Business Rule |
| approveTransfer — approver tidak ditemukan                     | Validasi      |
| cancelTransfer — superadmin berhasil                           | CRUD          |
| cancelTransfer — school admin diblokir                         | Security      |
| cancelTransfer — approved tidak bisa dibatalkan                | Business Rule |
| cancelTransfer — tidak ditemukan                               | Validasi      |
| confirmReceived — approved berhasil dikonfirmasi               | CRUD          |
| confirmReceived — hanya approved yang bisa dikonfirmasi        | Business Rule |
| confirmReceived — receiver bukan dari institusi tujuan         | Security      |
| confirmReceived — receiver tidak ditemukan                     | Validasi      |

---

## ✅ Selesai — `fee` (15/15)

| Test                                                | Status | Kategori      |
| --------------------------------------------------- | ------ | ------------- |
| createFee — tarif baru berhasil                     | ✅     | CRUD          |
| createFee — duplikat feeType+year+semester diblokir | ✅     | Business Rule |
| createFee — besaran negatif ditolak                 | ✅     | Validasi      |
| createFee — format besaran tidak valid              | ✅     | Validasi      |
| createFee — bukan superadmin ditolak                | ✅     | Security      |
| updateFee — berhasil jika belum ada pembayaran      | ✅     | CRUD          |
| updateFee — diblokir jika sudah ada pembayaran      | ✅     | Business Rule |
| updateFee — duplikat kombinasi baru diblokir        | ✅     | Business Rule |
| updateFee — tidak ditemukan                         | ✅     | Validasi      |
| updateFee — bukan superadmin ditolak                | ✅     | Security      |
| getFees — paginasi                                  | ✅     | CRUD          |
| getFees — bukan superadmin ditolak                  | ✅     | Security      |
| getFeeYears — daftar tahun                          | ✅     | CRUD          |
| getFeesForPayment — superadmin                      | ✅     | CRUD          |
| getFeesForPayment — school dengan subAppKey         | ✅     | CRUD          |

---

## ✅ Selesai — `profile` (21/21)

| Test                                                 | Status | Kategori      |
| ---------------------------------------------------- | ------ | ------------- |
| updateProfile — berhasil update nama & email         | ✅     | CRUD          |
| updateProfile — tidak cek duplikat jika email sama   | ✅     | CRUD          |
| updateProfile — email sudah dipakai user lain        | ✅     | Business Rule |
| updateProfile — nama < 2 karakter                    | ✅     | Validasi      |
| updateProfile — format email tidak valid             | ✅     | Validasi      |
| updateProfile — tanpa login ditolak                  | ✅     | Security      |
| changePassword — berhasil dengan password lama benar | ✅     | CRUD          |
| changePassword — password lama salah ditolak         | ✅     | Business Rule |
| changePassword — konfirmasi tidak cocok              | ✅     | Validasi      |
| changePassword — password baru < 8 karakter          | ✅     | Validasi      |
| updateAvatar — berhasil + hapus avatar lama          | ✅     | CRUD          |
| updateAvatar — berhasil tanpa avatar lama            | ✅     | CRUD          |
| updateAvatar — URL tidak valid                       | ✅     | Validasi      |
| revokeSession — berhasil                             | ✅     | CRUD          |
| revokeSession — token kosong                         | ✅     | Validasi      |
| getActiveSessions — berhasil                         | ✅     | CRUD          |
| getActiveSessions — array kosong                     | ✅     | CRUD          |

---

## ✅ Selesai — `institute` (22/22)

| Test                                                      | Status | Kategori      |
| --------------------------------------------------------- | ------ | ------------- |
| createInstitute — foundation baru berhasil                | ✅     | CRUD          |
| createInstitute — school dengan parent foundation         | ✅     | CRUD          |
| createInstitute — nama harus unik                         | ✅     | Business Rule |
| createInstitute — nomor telepon harus unik                | ✅     | Business Rule |
| createInstitute — parent sekolah harus bertipe foundation | ✅     | Business Rule |
| createInstitute — input tidak valid                       | ✅     | Validasi      |
| createInstitute — bukan superadmin ditolak                | ✅     | Security      |
| updateInstitute — berhasil                                | ✅     | CRUD          |
| updateInstitute — nama unik kecuali milik sendiri         | ✅     | Business Rule |
| updateInstitute — tidak ditemukan                         | ✅     | Validasi      |
| updateInstitute — ID kosong                               | ✅     | Validasi      |
| getInstitutes — paginasi default                          | ✅     | CRUD          |
| getInstitutes — filter by type                            | ✅     | CRUD          |
| getInstituteById — berhasil                               | ✅     | CRUD          |
| getInstituteById — tidak ditemukan                        | ✅     | Validasi      |
| getInstituteById — ID kosong                              | ✅     | Validasi      |
| deactivateInstitute — berhasil tanpa staf/siswa aktif     | ✅     | CRUD          |
| deactivateInstitute — ada staf aktif diblokir             | ✅     | Business Rule |
| deactivateInstitute — ada siswa aktif diblokir            | ✅     | Business Rule |
| deactivateInstitute — tidak ditemukan                     | ✅     | Validasi      |
| deactivateInstitute — ID kosong                           | ✅     | Validasi      |
| getFoundations — daftar yayasan untuk dropdown            | ✅     | CRUD          |

---

## ✅ Selesai — `student` (26/26)

| Test                                                | Status | Kategori      |
| --------------------------------------------------- | ------ | ------------- |
| createStudent — superadmin berhasil                 | ✅     | CRUD          |
| createStudent — NISN sudah digunakan                | ✅     | Business Rule |
| createStudent — nomor siswa sudah digunakan         | ✅     | Business Rule |
| createStudent — data isolation school subapp        | ✅     | Security      |
| createStudent — subapp bukan school ditolak         | ✅     | Security      |
| createStudent — input tidak valid                   | ✅     | Validasi      |
| getStudents — superadmin lihat semua                | ✅     | CRUD          |
| getStudents — school hanya institusinya             | ✅     | Security      |
| getStudents — subapp bukan school ditolak           | ✅     | Security      |
| getStudents — paginasi default                      | ✅     | CRUD          |
| getStudentById — superadmin berhasil                | ✅     | CRUD          |
| getStudentById — tidak ditemukan                    | ✅     | Validasi      |
| getStudentById — school: siswa sekolah lain ditolak | ✅     | Security      |
| getStudentById — ID kosong                          | ✅     | Validasi      |
| updateStudent — superadmin berhasil                 | ✅     | CRUD          |
| updateStudent — tidak ditemukan                     | ✅     | Validasi      |
| updateStudent — NISN dipakai siswa lain             | ✅     | Business Rule |
| updateStudent — school: sekolah lain ditolak        | ✅     | Security      |
| activateStudent — dari pending berhasil             | ✅     | CRUD          |
| activateStudent — sudah active gagal                | ✅     | Business Rule |
| activateStudent — sudah canceled gagal              | ✅     | Business Rule |
| deactivateStudent — dari active berhasil            | ✅     | CRUD          |
| deactivateStudent — dari pending gagal              | ✅     | Business Rule |
| deactivateStudent — tidak ditemukan                 | ✅     | Validasi      |
| cancelStudent — dari pending berhasil               | ✅     | CRUD          |
| cancelStudent — sudah active gagal                  | ✅     | Business Rule |

---

## ✅ Selesai — `staff` (21/21)

| Test                                                        | Status | Kategori      |
| ----------------------------------------------------------- | ------ | ------------- |
| createStaff — superadmin berhasil                           | ✅     | CRUD          |
| createStaff — nomor staf harus unik                         | ✅     | Business Rule |
| createStaff — email staf harus unik                         | ✅     | Business Rule |
| createStaff — phone staf harus unik                         | ✅     | Business Rule |
| createStaff — data isolation school subapp                  | ✅     | Security      |
| getStaffs — superadmin lihat semua                          | ✅     | CRUD          |
| getStaffs — school hanya institusinya                       | ✅     | Security      |
| getStaffs — foundation hanya institusinya                   | ✅     | Security      |
| getStaffById — superadmin berhasil                          | ✅     | CRUD          |
| getStaffById — school: staf sekolah lain ditolak            | ✅     | Security      |
| getStaffById — ID kosong                                    | ✅     | Validasi      |
| updateStaff — berhasil                                      | ✅     | CRUD          |
| updateStaff — tidak ditemukan                               | ✅     | Validasi      |
| toggleStaffStatus — active → inactive                       | ✅     | CRUD          |
| toggleStaffStatus — inactive → active                       | ✅     | CRUD          |
| toggleStaffStatus — tidak ditemukan                         | ✅     | Validasi      |
| toggleStaffStatus — ID kosong                               | ✅     | Validasi      |
| linkUserAccount — berhasil                                  | ✅     | CRUD          |
| linkUserAccount — sudah terhubung ke user                   | ✅     | Business Rule |
| linkUserAccount — user tidak bisa staf di institusi sama 2x | ✅     | Business Rule |
| linkUserAccount — user bisa staf di institusi berbeda       | ✅     | Business Rule |
| linkUserAccount — user tidak ditemukan                      | ✅     | Validasi      |
| linkUserAccount — staffId kosong                            | ✅     | Validasi      |
| unlinkUserAccount — berhasil                                | ✅     | CRUD          |
| unlinkUserAccount — staf belum terhubung ke user            | ✅     | Business Rule |
| unlinkUserAccount — staf tidak ditemukan                    | ✅     | Validasi      |
| checkStaffDeletable — bisa dihapus                          | ✅     | Business Rule |
| checkStaffDeletable — ada transfer pending diblokir         | ✅     | Business Rule |
| checkStaffDeletable — hanya superadmin                      | ✅     | Security      |

---
