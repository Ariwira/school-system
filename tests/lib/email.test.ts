import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}))

vi.mock('resend', () => {
  return {
    Resend: function() {
      return {
        emails: {
          send: mockSend,
        },
      }
    },
  }
})

// --- Import after mock ---
import { sendTransferPendingEmail, sendPaymentConfirmedEmail } from '@/lib/email'

describe('lib/email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockReset()
  })

  describe('sendTransferPendingEmail', () => {
    const params = {
      approverName: 'Admin Yayasan',
      transferId: '12345678-1234-1234-1234-123456789012',
      fromInstitute: 'Sekolah A',
      toInstitute: 'Yayasan B',
      amount: '1000000',
      issuedAt: new Date('2024-01-01T10:00:00Z'),
      transferMethod: 'bank_transfer',
      notes: 'Transfer rutin',
      transferUrl: 'http://localhost:3000/transfers/123',
    }

    it('berhasil mengirim email transfer pending', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null })

      const result = await sendTransferPendingEmail('approver@example.com', params)

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'approver@example.com',
          subject: expect.stringContaining('Perlu Persetujuan'),
          html: expect.stringContaining('Sekolah A'),
        })
      )
    })

    it('menangani error dari Resend', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'Resend Error' } })

      const result = await sendTransferPendingEmail('approver@example.com', params)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Resend Error')
      }
    })

    it('menangani exception saat pengiriman', async () => {
      mockSend.mockRejectedValue(new Error('Network Error'))

      const result = await sendTransferPendingEmail('approver@example.com', params)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Gagal mengirim email')
      }
    })
  })

  describe('sendPaymentConfirmedEmail', () => {
    const params = {
      adminName: 'Admin Sekolah',
      studentName: 'Budi Utomo',
      studentNumber: '2021001',
      feeType: 'spp',
      feeYear: 2024,
      feeSemester: 1,
      amountPaid: '500000',
      paymentMethod: 'cash',
      confirmedAt: new Date('2024-01-01T15:00:00Z'),
      appUrl: 'http://localhost:3000',
    }

    it('berhasil mengirim email konfirmasi pembayaran', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null })

      const result = await sendPaymentConfirmedEmail('admin@example.com', params)

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('Konfirmasi Pembayaran'),
          html: expect.stringContaining('Budi Utomo'),
        })
      )
    })

    it('menangani error dari Resend', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'Auth Error' } })

      const result = await sendPaymentConfirmedEmail('admin@example.com', params)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Auth Error')
      }
    })
  })
})
