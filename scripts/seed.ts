/**
 * Seed script — data demo lengkap untuk development
 *
 * Jalankan dengan:
 *   pnpm seed
 *
 * Data yang dibuat:
 *   - 1 Superadmin
 *   - 1 Yayasan (foundation) + 2 Sekolah (school)
 *   - 3 SubApp (1 yayasan + 2 sekolah)
 *   - 3 User admin (1 per institusi) + link ke subapp
 *   - 5 Staf per sekolah (10 total)
 *   - 10 Siswa per sekolah (20 total)
 *   - 4 Fee (biaya SPP + registrasi)
 *   - 15 Pembayaran SPP
 *   - 1 Transfer dana
 */

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import {
  users,
  institutes,
  subapps,
  userSubapps,
  staffs,
  students,
  fees,
  feePayments,
  transfers,
} from '../lib/db/schema'
import { auth } from '../lib/auth'

// ─── Credentials ────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { name: 'Super Admin',        email: 'superadmin@school-erp.dev',  password: 'superadmin123', role: 'superadmin' as const },
  { name: 'Admin Yayasan',      email: 'yayasan@school-erp.dev',     password: 'password123',   role: 'user' as const },
  { name: 'Admin SD Al-Ikhlas', email: 'sd.admin@school-erp.dev',    password: 'password123',   role: 'user' as const },
  { name: 'Admin SMP Al-Ikhlas',email: 'smp.admin@school-erp.dev',   password: 'password123',   role: 'user' as const },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createUser(name: string, email: string, password: string, role: 'superadmin' | 'user') {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing[0]) {
    console.log(`   skip  user sudah ada: ${email}`)
    return existing[0].id
  }

  const result = await auth.api.signUpEmail({ body: { name, email, password } })
  if (!result?.user?.id) throw new Error(`Gagal buat user: ${email}`)

  await db.update(users).set({ role, emailVerified: true }).where(eq(users.id, result.user.id))
  console.log(`   ✓  user: ${email}`)
  return result.user.id
}

async function upsertInstitute(data: {
  name: string
  type: 'foundation' | 'school'
  address: string
  phone: string
  email: string
  establishedYear: number
  parentId?: string
}) {
  const existing = await db.select({ id: institutes.id }).from(institutes).where(eq(institutes.name, data.name)).limit(1)
  if (existing[0]) {
    console.log(`   skip  institute sudah ada: ${data.name}`)
    return existing[0].id
  }

  const [row] = await db.insert(institutes).values({
    name: data.name,
    type: data.type,
    address: data.address,
    phone: data.phone,
    email: data.email,
    establishedYear: data.establishedYear,
    parentId: data.parentId ?? null,
    isActive: true,
  }).returning({ id: institutes.id })

  console.log(`   ✓  institute: ${data.name}`)
  return row.id
}

async function upsertSubapp(data: { key: string; type: string; name: string; instituteId: string }) {
  const existing = await db.select({ id: subapps.id }).from(subapps).where(eq(subapps.key, data.key)).limit(1)
  if (existing[0]) {
    console.log(`   skip  subapp sudah ada: ${data.key}`)
    return existing[0].id
  }

  const [row] = await db.insert(subapps).values(data).returning({ id: subapps.id })
  console.log(`   ✓  subapp: ${data.key}`)
  return row.id
}

async function linkUserSubapp(userId: string, subappId: string) {
  const existing = await db
    .select({ id: userSubapps.id })
    .from(userSubapps)
    .where(eq(userSubapps.userId, userId))
    .limit(1)
  if (existing[0]) return
  await db.insert(userSubapps).values({ userId, subappId })
}

async function upsertStaff(data: {
  instituteId: string
  name: string
  staffNumber: string
  phone: string
  email: string
  nik: string
  gender: 'male' | 'female'
  dob: string
  pob: string
  department: 'academic' | 'administration' | 'finance' | 'it' | 'hr' | 'other'
  joinDate: string
}) {
  const existing = await db.select({ id: staffs.id }).from(staffs).where(eq(staffs.staffNumber, data.staffNumber)).limit(1)
  if (existing[0]) return existing[0].id

  const [row] = await db.insert(staffs).values({ ...data, status: 'active' }).returning({ id: staffs.id })
  return row.id
}

async function upsertStudent(data: {
  instituteId: string
  name: string
  nisn: string
  studentNumber: string
  phone: string
  email: string
  nik: string
  gender: 'male' | 'female'
  dob: string
  pob: string
  generationYear: number
  admissionDate: string
  status: 'pending' | 'active' | 'inactive'
}) {
  const existing = await db.select({ id: students.id }).from(students).where(eq(students.nisn, data.nisn)).limit(1)
  if (existing[0]) return existing[0].id

  const [row] = await db.insert(students).values(data).returning({ id: students.id })
  return row.id
}

async function upsertFee(data: {
  feeType: 'registration' | 'spp' | 'building' | 'uniform' | 'book' | 'activity' | 'other'
  year: number
  semester: number
  amount: string
}) {
  const existing = await db
    .select({ id: fees.id })
    .from(fees)
    .where(eq(fees.feeType, data.feeType))
    .limit(1)
  if (existing[0]) return existing[0].id

  const [row] = await db.insert(fees).values(data).returning({ id: fees.id })
  return row.id
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  Memulai seed data demo...\n')

  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log('👤  Membuat users...')
  const superadminId  = await createUser(ACCOUNTS[0].name, ACCOUNTS[0].email, ACCOUNTS[0].password, 'superadmin')
  const yayasanUserId = await createUser(ACCOUNTS[1].name, ACCOUNTS[1].email, ACCOUNTS[1].password, 'user')
  const sdUserId      = await createUser(ACCOUNTS[2].name, ACCOUNTS[2].email, ACCOUNTS[2].password, 'user')
  const smpUserId     = await createUser(ACCOUNTS[3].name, ACCOUNTS[3].email, ACCOUNTS[3].password, 'user')

  // ── 2. Institutes ───────────────────────────────────────────────────────────
  console.log('\n🏛️   Membuat institutes...')
  const yayasanId = await upsertInstitute({
    name: 'Yayasan Pendidikan Al-Ikhlas',
    type: 'foundation',
    address: 'Jl. Pendidikan No. 1, Makassar, Sulawesi Selatan',
    phone: '0411-123456',
    email: 'info@yayasan-alikhlas.sch.id',
    establishedYear: 1985,
  })

  const sdId = await upsertInstitute({
    name: 'SD Al-Ikhlas',
    type: 'school',
    address: 'Jl. Pendidikan No. 2, Makassar, Sulawesi Selatan',
    phone: '0411-234567',
    email: 'sd@yayasan-alikhlas.sch.id',
    establishedYear: 1987,
    parentId: yayasanId,
  })

  const smpId = await upsertInstitute({
    name: 'SMP Al-Ikhlas',
    type: 'school',
    address: 'Jl. Pendidikan No. 3, Makassar, Sulawesi Selatan',
    phone: '0411-345678',
    email: 'smp@yayasan-alikhlas.sch.id',
    establishedYear: 1990,
    parentId: yayasanId,
  })

  // ── 3. SubApps ──────────────────────────────────────────────────────────────
  console.log('\n🔑  Membuat subapps...')
  const yayasanSubappId = await upsertSubapp({ key: 'yayasan-al-ikhlas', type: 'foundation', name: 'Yayasan Al-Ikhlas', instituteId: yayasanId })
  const sdSubappId      = await upsertSubapp({ key: 'sd-al-ikhlas',      type: 'school',     name: 'SD Al-Ikhlas',     instituteId: sdId })
  const smpSubappId     = await upsertSubapp({ key: 'smp-al-ikhlas',     type: 'school',     name: 'SMP Al-Ikhlas',    instituteId: smpId })

  // ── 4. Link users → subapps ─────────────────────────────────────────────────
  console.log('\n🔗  Menghubungkan users ke subapps...')
  await linkUserSubapp(yayasanUserId, yayasanSubappId)
  await linkUserSubapp(sdUserId, sdSubappId)
  await linkUserSubapp(smpUserId, smpSubappId)
  console.log('   ✓  user-subapp links')

  // ── 5. Staffs ───────────────────────────────────────────────────────────────
  console.log('\n👩‍🏫  Membuat staf SD Al-Ikhlas...')
  const sdStaffIds: string[] = []
  const sdStaffs = [
    { name: 'Budi Santoso',    staffNumber: 'SD-STF-001', phone: '081211110001', email: 'budi.s@sd-alikhlas.sch.id',    nik: '7371010101800001', gender: 'male'   as const, dob: '1980-01-15', pob: 'Makassar',   department: 'academic'        as const, joinDate: '2005-07-15' },
    { name: 'Siti Rahayu',     staffNumber: 'SD-STF-002', phone: '081211110002', email: 'siti.r@sd-alikhlas.sch.id',    nik: '7371025502850002', gender: 'female' as const, dob: '1985-02-15', pob: 'Gowa',       department: 'academic'        as const, joinDate: '2008-08-01' },
    { name: 'Ahmad Fauzi',     staffNumber: 'SD-STF-003', phone: '081211110003', email: 'ahmad.f@sd-alikhlas.sch.id',   nik: '7371030303900003', gender: 'male'   as const, dob: '1990-03-03', pob: 'Maros',      department: 'administration'  as const, joinDate: '2012-01-02' },
    { name: 'Dewi Lestari',    staffNumber: 'SD-STF-004', phone: '081211110004', email: 'dewi.l@sd-alikhlas.sch.id',    nik: '7371044404880004', gender: 'female' as const, dob: '1988-04-04', pob: 'Makassar',   department: 'finance'         as const, joinDate: '2010-07-01' },
    { name: 'Rudi Hermawan',   staffNumber: 'SD-STF-005', phone: '081211110005', email: 'rudi.h@sd-alikhlas.sch.id',    nik: '7371050505920005', gender: 'male'   as const, dob: '1992-05-05', pob: 'Takalar',    department: 'it'              as const, joinDate: '2015-03-01' },
  ]
  for (const s of sdStaffs) {
    const id = await upsertStaff({ ...s, instituteId: sdId })
    if (id) sdStaffIds.push(id)
  }

  console.log('\n👩‍🏫  Membuat staf SMP Al-Ikhlas...')
  const smpStaffIds: string[] = []
  const smpStaffs = [
    { name: 'Hasan Basri',     staffNumber: 'SMP-STF-001', phone: '081211120001', email: 'hasan.b@smp-alikhlas.sch.id',  nik: '7371010101750001', gender: 'male'   as const, dob: '1975-01-10', pob: 'Makassar',   department: 'academic'        as const, joinDate: '2000-07-15' },
    { name: 'Fatimah Zahra',   staffNumber: 'SMP-STF-002', phone: '081211120002', email: 'fatimah.z@smp-alikhlas.sch.id',nik: '7371026602820002', gender: 'female' as const, dob: '1982-06-26', pob: 'Bantaeng',   department: 'academic'        as const, joinDate: '2005-08-01' },
    { name: 'Irwan Setiawan',  staffNumber: 'SMP-STF-003', phone: '081211120003', email: 'irwan.s@smp-alikhlas.sch.id',  nik: '7371030707870003', gender: 'male'   as const, dob: '1987-07-07', pob: 'Makassar',   department: 'administration'  as const, joinDate: '2010-01-04' },
    { name: 'Nurul Hidayah',   staffNumber: 'SMP-STF-004', phone: '081211120004', email: 'nurul.h@smp-alikhlas.sch.id',  nik: '7371048808910004', gender: 'female' as const, dob: '1991-08-08', pob: 'Jeneponto',  department: 'finance'         as const, joinDate: '2013-07-01' },
    { name: 'Andi Prasetyo',   staffNumber: 'SMP-STF-005', phone: '081211120005', email: 'andi.p@smp-alikhlas.sch.id',   nik: '7371050909930005', gender: 'male'   as const, dob: '1993-09-09', pob: 'Makassar',   department: 'hr'              as const, joinDate: '2016-02-01' },
  ]
  for (const s of smpStaffs) {
    const id = await upsertStaff({ ...s, instituteId: smpId })
    if (id) smpStaffIds.push(id)
  }

  // ── 6. Students ─────────────────────────────────────────────────────────────
  console.log('\n🎓  Membuat siswa SD Al-Ikhlas...')
  const sdStudentIds: string[] = []
  const sdStudents = [
    { name: 'Alya Putri Ramadhani',  nisn: '1234567801', studentNumber: 'SD-2020-001', phone: '082211110001', email: 'alya.p@gmail.com',     nik: '7371010101140001', gender: 'female' as const, dob: '2014-01-10', pob: 'Makassar',  generationYear: 2020, admissionDate: '2020-07-13', status: 'active'  as const },
    { name: 'Bagas Eko Nugroho',      nisn: '1234567802', studentNumber: 'SD-2020-002', phone: '082211110002', email: 'bagas.e@gmail.com',     nik: '7371020202140002', gender: 'male'   as const, dob: '2014-02-20', pob: 'Gowa',      generationYear: 2020, admissionDate: '2020-07-13', status: 'active'  as const },
    { name: 'Citra Dewi Anggraeni',   nisn: '1234567803', studentNumber: 'SD-2020-003', phone: '082211110003', email: 'citra.d@gmail.com',     nik: '7371030303140003', gender: 'female' as const, dob: '2014-03-15', pob: 'Makassar',  generationYear: 2020, admissionDate: '2020-07-13', status: 'active'  as const },
    { name: 'Dimas Arya Pratama',     nisn: '1234567804', studentNumber: 'SD-2021-001', phone: '082211110004', email: 'dimas.a@gmail.com',     nik: '7371040404150004', gender: 'male'   as const, dob: '2015-04-05', pob: 'Maros',     generationYear: 2021, admissionDate: '2021-07-12', status: 'active'  as const },
    { name: 'Erika Sari Wulandari',   nisn: '1234567805', studentNumber: 'SD-2021-002', phone: '082211110005', email: 'erika.s@gmail.com',     nik: '7371050505150005', gender: 'female' as const, dob: '2015-05-25', pob: 'Makassar',  generationYear: 2021, admissionDate: '2021-07-12', status: 'active'  as const },
    { name: 'Fariz Maulana Ibrahim',  nisn: '1234567806', studentNumber: 'SD-2021-003', phone: '082211110006', email: 'fariz.m@gmail.com',     nik: '7371060606150006', gender: 'male'   as const, dob: '2015-06-12', pob: 'Makassar',  generationYear: 2021, admissionDate: '2021-07-12', status: 'inactive'as const },
    { name: 'Gita Maharani Putri',    nisn: '1234567807', studentNumber: 'SD-2022-001', phone: '082211110007', email: 'gita.m@gmail.com',      nik: '7371070707160007', gender: 'female' as const, dob: '2016-07-07', pob: 'Takalar',   generationYear: 2022, admissionDate: '2022-07-11', status: 'active'  as const },
    { name: 'Hendra Kurniawan',       nisn: '1234567808', studentNumber: 'SD-2022-002', phone: '082211110008', email: 'hendra.k@gmail.com',    nik: '7371080808160008', gender: 'male'   as const, dob: '2016-08-18', pob: 'Gowa',      generationYear: 2022, admissionDate: '2022-07-11', status: 'active'  as const },
    { name: 'Indah Permata Sari',     nisn: '1234567809', studentNumber: 'SD-2023-001', phone: '082211110009', email: 'indah.p@gmail.com',     nik: '7371090909170009', gender: 'female' as const, dob: '2017-09-09', pob: 'Makassar',  generationYear: 2023, admissionDate: '2023-07-10', status: 'pending' as const },
    { name: 'Joko Susilo Wibowo',     nisn: '1234567810', studentNumber: 'SD-2023-002', phone: '082211110010', email: 'joko.s@gmail.com',      nik: '7371101010170010', gender: 'male'   as const, dob: '2017-10-10', pob: 'Makassar',  generationYear: 2023, admissionDate: '2023-07-10', status: 'pending' as const },
  ]
  for (const s of sdStudents) {
    const id = await upsertStudent({ ...s, instituteId: sdId })
    if (id) sdStudentIds.push(id)
  }

  console.log('\n🎓  Membuat siswa SMP Al-Ikhlas...')
  const smpStudentIds: string[] = []
  const smpStudents = [
    { name: 'Kevin Andriansyah',      nisn: '2234567801', studentNumber: 'SMP-2021-001', phone: '082211120001', email: 'kevin.a@gmail.com',    nik: '7371010101100001', gender: 'male'   as const, dob: '2010-01-15', pob: 'Makassar',  generationYear: 2021, admissionDate: '2021-07-12', status: 'active'  as const },
    { name: 'Linda Oktavia',          nisn: '2234567802', studentNumber: 'SMP-2021-002', phone: '082211120002', email: 'linda.o@gmail.com',    nik: '7371020202100002', gender: 'female' as const, dob: '2010-02-20', pob: 'Gowa',      generationYear: 2021, admissionDate: '2021-07-12', status: 'active'  as const },
    { name: 'Muhammad Rizky',         nisn: '2234567803', studentNumber: 'SMP-2021-003', phone: '082211120003', email: 'rizky.m@gmail.com',    nik: '7371030303110003', gender: 'male'   as const, dob: '2011-03-11', pob: 'Makassar',  generationYear: 2021, admissionDate: '2021-07-12', status: 'active'  as const },
    { name: 'Nadya Aulia Putri',      nisn: '2234567804', studentNumber: 'SMP-2022-001', phone: '082211120004', email: 'nadya.a@gmail.com',    nik: '7371040404110004', gender: 'female' as const, dob: '2011-04-22', pob: 'Bantaeng',  generationYear: 2022, admissionDate: '2022-07-11', status: 'active'  as const },
    { name: 'Oscar Firmansyah',       nisn: '2234567805', studentNumber: 'SMP-2022-002', phone: '082211120005', email: 'oscar.f@gmail.com',    nik: '7371050505110005', gender: 'male'   as const, dob: '2011-05-30', pob: 'Makassar',  generationYear: 2022, admissionDate: '2022-07-11', status: 'active'  as const },
    { name: 'Putri Rahayu Ningsih',   nisn: '2234567806', studentNumber: 'SMP-2022-003', phone: '082211120006', email: 'putri.r@gmail.com',    nik: '7371060606120006', gender: 'female' as const, dob: '2012-06-14', pob: 'Maros',     generationYear: 2022, admissionDate: '2022-07-11', status: 'inactive'as const },
    { name: 'Qori Amirudin',          nisn: '2234567807', studentNumber: 'SMP-2023-001', phone: '082211120007', email: 'qori.a@gmail.com',     nik: '7371070707120007', gender: 'male'   as const, dob: '2012-07-07', pob: 'Makassar',  generationYear: 2023, admissionDate: '2023-07-10', status: 'active'  as const },
    { name: 'Rina Marliana',          nisn: '2234567808', studentNumber: 'SMP-2023-002', phone: '082211120008', email: 'rina.m@gmail.com',     nik: '7371080808120008', gender: 'female' as const, dob: '2012-08-08', pob: 'Jeneponto', generationYear: 2023, admissionDate: '2023-07-10', status: 'active'  as const },
    { name: 'Surya Dharma Putra',     nisn: '2234567809', studentNumber: 'SMP-2024-001', phone: '082211120009', email: 'surya.d@gmail.com',    nik: '7371090909130009', gender: 'male'   as const, dob: '2013-09-09', pob: 'Makassar',  generationYear: 2024, admissionDate: '2024-07-08', status: 'pending' as const },
    { name: 'Tania Kusuma Wardani',   nisn: '2234567810', studentNumber: 'SMP-2024-002', phone: '082211120010', email: 'tania.k@gmail.com',    nik: '7371101010130010', gender: 'female' as const, dob: '2013-10-10', pob: 'Gowa',      generationYear: 2024, admissionDate: '2024-07-08', status: 'pending' as const },
  ]
  for (const s of smpStudents) {
    const id = await upsertStudent({ ...s, instituteId: smpId })
    if (id) smpStudentIds.push(id)
  }

  // ── 7. Fees ─────────────────────────────────────────────────────────────────
  console.log('\n💰  Membuat data biaya...')
  const sppFee2024s1Id = await upsertFee({ feeType: 'spp',          year: 2024, semester: 1, amount: '350000' })
  const sppFee2024s2Id = await upsertFee({ feeType: 'spp',          year: 2024, semester: 2, amount: '350000' })
  const regFee2024Id   = await upsertFee({ feeType: 'registration', year: 2024, semester: 1, amount: '500000' })
  const bldFee2024Id   = await upsertFee({ feeType: 'building',     year: 2024, semester: 1, amount: '200000' })
  console.log('   ✓  4 fee entries')

  // ── 8. Fee Payments ─────────────────────────────────────────────────────────
  console.log('\n🧾  Membuat pembayaran SPP...')
  const now = new Date()
  const activeSDStudents = sdStudentIds.slice(0, 6)   // 6 siswa aktif SD
  const activeSMPStudents = smpStudentIds.slice(0, 6) // 6 siswa aktif SMP

  const paymentData: {
    feeId: string
    studentId: string
    amountPaid: string
    receipt: string
    paymentMethod: 'cash' | 'transfer' | 'virtual_account' | 'qris' | 'other'
    status: 'paid' | 'pending'
    paidDatetime: Date
  }[] = []

  // Siswa SD: SPP semester 1 & 2 2024 (3 siswa sudah bayar, 3 belum)
  activeSDStudents.slice(0, 3).forEach((studentId, i) => {
    paymentData.push({
      feeId: sppFee2024s1Id!,
      studentId,
      amountPaid: '350000',
      receipt: `RCP-SD-S1-${String(i + 1).padStart(3, '0')}`,
      paymentMethod: ['cash', 'transfer', 'qris'][i % 3] as 'cash' | 'transfer' | 'qris',
      status: 'paid',
      paidDatetime: new Date(now.getFullYear(), now.getMonth() - 2, 10 + i),
    })
    paymentData.push({
      feeId: sppFee2024s2Id!,
      studentId,
      amountPaid: '350000',
      receipt: `RCP-SD-S2-${String(i + 1).padStart(3, '0')}`,
      paymentMethod: 'transfer',
      status: 'paid',
      paidDatetime: new Date(now.getFullYear(), now.getMonth() - 1, 5 + i),
    })
  })

  // Siswa SMP: SPP semester 1 2024 (3 siswa sudah bayar)
  activeSMPStudents.slice(0, 3).forEach((studentId, i) => {
    paymentData.push({
      feeId: sppFee2024s1Id!,
      studentId,
      amountPaid: '350000',
      receipt: `RCP-SMP-S1-${String(i + 1).padStart(3, '0')}`,
      paymentMethod: ['cash', 'virtual_account', 'transfer'][i % 3] as 'cash' | 'virtual_account' | 'transfer',
      status: 'paid',
      paidDatetime: new Date(now.getFullYear(), now.getMonth() - 2, 12 + i),
    })
  })

  // 3 pembayaran pending
  ;[activeSDStudents[3], activeSMPStudents[3], activeSMPStudents[4]].forEach((studentId, i) => {
    paymentData.push({
      feeId: sppFee2024s1Id!,
      studentId: studentId!,
      amountPaid: '350000',
      receipt: `RCP-PENDING-${String(i + 1).padStart(3, '0')}`,
      paymentMethod: 'cash',
      status: 'pending',
      paidDatetime: new Date(now.getFullYear(), now.getMonth(), 1 + i),
    })
  })

  // Biaya registrasi & gedung untuk siswa baru
  ;[sdStudentIds[0], smpStudentIds[0]].forEach((studentId, i) => {
    paymentData.push({
      feeId: regFee2024Id!,
      studentId: studentId!,
      amountPaid: '500000',
      receipt: `RCP-REG-${String(i + 1).padStart(3, '0')}`,
      paymentMethod: 'transfer',
      status: 'paid',
      paidDatetime: new Date(2024, 6, 8 + i),
    })
    paymentData.push({
      feeId: bldFee2024Id!,
      studentId: studentId!,
      amountPaid: '200000',
      receipt: `RCP-BLD-${String(i + 1).padStart(3, '0')}`,
      paymentMethod: 'transfer',
      status: 'paid',
      paidDatetime: new Date(2024, 6, 8 + i),
    })
  })

  // Insert fee payments (skip jika sudah ada berdasarkan receipt)
  let inserted = 0
  for (const p of paymentData) {
    const existing = await db
      .select({ id: feePayments.id })
      .from(feePayments)
      .where(eq(feePayments.receipt, p.receipt))
      .limit(1)
    if (existing[0]) continue
    await db.insert(feePayments).values(p)
    inserted++
  }
  console.log(`   ✓  ${inserted} pembayaran (${paymentData.length - inserted} sudah ada)`)

  // ── 9. Transfer ─────────────────────────────────────────────────────────────
  console.log('\n💸  Membuat transfer dana...')

  if (sdStaffIds.length >= 2 && smpStaffIds.length >= 1) {
    const existingTransfer = await db
      .select({ id: transfers.id })
      .from(transfers)
      .where(eq(transfers.transferFromId, yayasanId))
      .limit(1)

    if (!existingTransfer[0]) {
      await db.insert(transfers).values({
        transferFromId: yayasanId,
        transferToId: sdId,
        amount: '5000000',
        issuerId: sdStaffIds[0]!,
        senderId: sdStaffIds[1]!,
        receiverId: smpStaffIds[0]!,
        issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15),
        status: 'approved',
        transferMethod: 'bank_transfer',
        receipt: 'TRF-2024-001',
        approvedAt: new Date(now.getFullYear(), now.getMonth() - 1, 16),
        approverId: sdStaffIds[2] ?? sdStaffIds[0],
        notes: 'Transfer dana operasional bulan ini dari yayasan ke SD Al-Ikhlas',
      })
      console.log('   ✓  1 transfer dana (approved)')
    } else {
      console.log('   skip  transfer sudah ada')
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('✅  Seed selesai!\n')
  console.log('📋  Akun untuk login:\n')
  console.log('  Role        │ Email                        │ Password')
  console.log('  ────────────┼──────────────────────────────┼─────────────')
  for (const a of ACCOUNTS) {
    const roleLabel = a.role === 'superadmin' ? 'Superadmin  ' : a.name.padEnd(12)
    console.log(`  ${roleLabel}│ ${a.email.padEnd(28)} │ ${a.password}`)
  }
  console.log('\n  URL SubApp:')
  console.log('  /foundation/yayasan-al-ikhlas  → Admin Yayasan')
  console.log('  /school/sd-al-ikhlas           → Admin SD')
  console.log('  /school/smp-al-ikhlas          → Admin SMP')
  console.log('  /superadmin/...                → Superadmin')
  console.log('')

  process.exit(0)
}

seed().catch((err) => {
  console.error('\n❌  Seed gagal:', err)
  process.exit(1)
})
