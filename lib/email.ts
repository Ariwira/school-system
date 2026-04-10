import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@school-system.id'

export type SendEmailResult = { success: true } | { success: false; error: string }

/**
 * Mengirim notifikasi email ketika transfer baru dibuat (status pending).
 * Penerima adalah approver (foundation atau superadmin).
 *
 * @param to - Alamat email penerima (approver)
 * @param params - Parameter untuk konten email
 */
export async function sendTransferPendingEmail(
  to: string,
  params: {
    approverName: string
    transferId: string
    fromInstitute: string
    toInstitute: string
    amount: string
    issuedAt: Date
    transferMethod: string
    notes: string | null
    transferUrl: string
  },
): Promise<SendEmailResult> {
  try {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(params.amount))

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Makassar',
    }).format(params.issuedAt)

    const methodLabel: Record<string, string> = {
      cash: 'Tunai',
      bank_transfer: 'Transfer Bank',
    }

    const html = buildTransferPendingHtml({
      approverName: params.approverName,
      transferId: params.transferId,
      fromInstitute: params.fromInstitute,
      toInstitute: params.toInstitute,
      formattedAmount,
      formattedDate,
      transferMethod: methodLabel[params.transferMethod] ?? params.transferMethod,
      notes: params.notes,
      transferUrl: params.transferUrl,
    })

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[Perlu Persetujuan] Transfer Dana Baru — ${formattedAmount}`,
      html,
    })

    if (error) {
      console.error('[email] Gagal mengirim notifikasi transfer:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[email] Error saat mengirim notifikasi transfer:', err)
    return { success: false, error: 'Gagal mengirim email notifikasi transfer.' }
  }
}

/**
 * Mengirim notifikasi email ketika pembayaran SPP dikonfirmasi (status paid).
 * Penerima adalah admin sekolah terkait.
 *
 * @param to - Alamat email penerima (admin sekolah)
 * @param params - Parameter untuk konten email
 */
export async function sendPaymentConfirmedEmail(
  to: string,
  params: {
    adminName: string
    studentName: string
    studentNumber: string
    feeType: string
    feeYear: number
    amountPaid: string
    paymentMethod: string
    confirmedAt: Date
    appUrl: string
  },
): Promise<SendEmailResult> {
  try {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(params.amountPaid))

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Makassar',
    }).format(params.confirmedAt)

    const feeTypeLabel: Record<string, string> = {
      spp: 'SPP',
      uang_pangkal: 'Uang Pangkal',
      ujian: 'Ujian',
      seragam: 'Seragam',
      lainnya: 'Lainnya',
    }

    const methodLabel: Record<string, string> = {
      cash: 'Tunai',
      bank_transfer: 'Transfer Bank',
      qris: 'QRIS',
    }

    const html = buildPaymentConfirmedHtml({
      adminName: params.adminName,
      studentName: params.studentName,
      studentNumber: params.studentNumber,
      feeType: feeTypeLabel[params.feeType] ?? params.feeType,
      feeYear: params.feeYear,
      formattedAmount,
      paymentMethod: methodLabel[params.paymentMethod] ?? params.paymentMethod,
      formattedDate,
    })

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[Konfirmasi Pembayaran] ${params.studentName} — ${feeTypeLabel[params.feeType] ?? params.feeType} ${params.feeYear}`,
      html,
    })

    if (error) {
      console.error('[email] Gagal mengirim konfirmasi pembayaran:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[email] Error saat mengirim konfirmasi pembayaran:', err)
    return { success: false, error: 'Gagal mengirim email konfirmasi pembayaran.' }
  }
}

// ---- Template HTML ----

function buildTransferPendingHtml(params: {
  approverName: string
  transferId: string
  fromInstitute: string
  toInstitute: string
  formattedAmount: string
  formattedDate: string
  transferMethod: string
  notes: string | null
  transferUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Notifikasi Transfer Dana Baru</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e40af;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">School ERP System</p>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Sistem Manajemen Yayasan Pendidikan</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#111827;font-size:16px;">Halo, <strong>${escapeHtml(params.approverName)}</strong></p>
              <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
                Ada pengajuan transfer dana baru yang memerlukan persetujuan Anda. Berikut adalah detail transfernya:
              </p>
              <!-- Detail Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    ${buildDetailRow('ID Transfer', params.transferId.slice(0, 8).toUpperCase())}
                    ${buildDetailRow('Dari', params.fromInstitute)}
                    ${buildDetailRow('Ke', params.toInstitute)}
                    ${buildDetailRow('Jumlah', `<strong style="color:#1e40af;font-size:16px;">${params.formattedAmount}</strong>`)}
                    ${buildDetailRow('Metode', params.transferMethod)}
                    ${buildDetailRow('Tanggal Pengajuan', params.formattedDate)}
                    ${params.notes ? buildDetailRow('Catatan', escapeHtml(params.notes)) : ''}
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1e40af;border-radius:6px;">
                    <a href="${params.transferUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                      Lihat Halaman Transfer
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildPaymentConfirmedHtml(params: {
  adminName: string
  studentName: string
  studentNumber: string
  feeType: string
  feeYear: number
  formattedAmount: string
  paymentMethod: string
  formattedDate: string
}): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Konfirmasi Pembayaran SPP</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#059669;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">School ERP System</p>
              <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px;">Sistem Manajemen Yayasan Pendidikan</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#111827;font-size:16px;">Halo, <strong>${escapeHtml(params.adminName)}</strong></p>
              <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
                Pembayaran biaya sekolah berikut telah berhasil dikonfirmasi:
              </p>
              <!-- Status Badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background-color:#d1fae5;border:1px solid #a7f3d0;border-radius:20px;padding:6px 16px;">
                    <p style="margin:0;color:#065f46;font-size:13px;font-weight:bold;">PEMBAYARAN TERKONFIRMASI</p>
                  </td>
                </tr>
              </table>
              <!-- Detail Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    ${buildDetailRow('Nama Siswa', escapeHtml(params.studentName))}
                    ${buildDetailRow('No. Induk', escapeHtml(params.studentNumber))}
                    ${buildDetailRow('Jenis Biaya', params.feeType)}
                    ${buildDetailRow('Tahun', String(params.feeYear))}
                    ${buildDetailRow('Jumlah Dibayar', `<strong style="color:#059669;font-size:16px;">${params.formattedAmount}</strong>`)}
                    ${buildDetailRow('Metode Pembayaran', params.paymentMethod)}
                    ${buildDetailRow('Dikonfirmasi Pada', params.formattedDate)}
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
                Simpan email ini sebagai bukti konfirmasi pembayaran.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildDetailRow(label: string, value: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
    <tr>
      <td width="140" style="color:#6b7280;font-size:13px;vertical-align:top;">${label}</td>
      <td style="color:#111827;font-size:13px;vertical-align:top;">: ${value}</td>
    </tr>
  </table>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
