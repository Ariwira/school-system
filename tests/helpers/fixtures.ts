/**
 * Shared test fixtures dengan UUID yang valid.
 * Semua ID di sini harus merupakan valid UUID v4 agar lolos Zod .uuid() validation.
 */

// User & session IDs
export const SUPERADMIN_USER_ID = '00000000-0000-4000-a000-000000000001'
export const REGULAR_USER_ID = '00000000-0000-4000-a000-000000000002'

// Institute IDs
export const INSTITUTE_SCHOOL_ID = '00000000-0000-4000-b000-000000000001'
export const INSTITUTE_FOUNDATION_ID = '00000000-0000-4000-b000-000000000002'
export const INSTITUTE_OTHER_ID = '00000000-0000-4000-b000-000000000003'

// Subapp IDs
export const SUBAPP_SCHOOL_ID = '00000000-0000-4000-c000-000000000001'
export const SUBAPP_FOUNDATION_ID = '00000000-0000-4000-c000-000000000002'

// Entity IDs (variant bits must be 8, 9, a, or b at position 19)
export const STUDENT_ID = '00000000-0000-4000-8000-000000000001'
export const STAFF_ID = '00000000-0000-4000-8000-000000000002'
export const FEE_ID = '00000000-0000-4000-8000-000000000003'
export const PAYMENT_ID = '00000000-0000-4000-8000-000000000004'
export const TRANSFER_ID = '00000000-0000-4000-8000-000000000005'
export const GENERIC_INSTITUTE_ID = '00000000-0000-4000-8000-000000000006'
export const FOUNDATION_PARENT_ID = '00000000-0000-4000-8000-000000000007'

// Staff IDs
export const ISSUER_STAFF_ID = '00000000-0000-4000-9000-000000000001'
export const SENDER_STAFF_ID = '00000000-0000-4000-9000-000000000002'
export const APPROVER_STAFF_ID = '00000000-0000-4000-9000-000000000003'
export const RECEIVER_STAFF_ID = '00000000-0000-4000-9000-000000000004'

// User IDs for link/unlink
export const LINK_USER_ID = '00000000-0000-4000-a000-000000000010'

// Sessions
export const SUPERADMIN_SESSION = {
  user: {
    id: SUPERADMIN_USER_ID,
    name: 'Super Admin',
    email: 'superadmin@example.com',
    role: 'superadmin',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: '00000000-0000-4000-f000-000000000001',
    userId: SUPERADMIN_USER_ID,
    token: 'superadmin-token-123',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

export const USER_SESSION = {
  user: {
    id: REGULAR_USER_ID,
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: '00000000-0000-4000-f000-000000000002',
    userId: REGULAR_USER_ID,
    token: 'user-token-456',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

export const SCHOOL_SUBAPP = {
  id: SUBAPP_SCHOOL_ID,
  key: 'sma-negeri-1',
  type: 'school' as const,
  name: 'SMA Negeri 1',
  image: null,
  instituteId: INSTITUTE_SCHOOL_ID,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const FOUNDATION_SUBAPP = {
  id: SUBAPP_FOUNDATION_ID,
  key: 'yayasan-al-ikhlas',
  type: 'foundation' as const,
  name: 'Yayasan Al-Ikhlas',
  image: null,
  instituteId: INSTITUTE_FOUNDATION_ID,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}
