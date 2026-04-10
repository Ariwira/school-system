'use client'

import { useState } from 'react'
import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getFeePaymentsForExport } from '@/actions/fee-payment-export.actions'
import type { ExportFeePaymentRow } from '@/actions/fee-payment-export.actions'
import type { PaymentStatus, PaymentMethod } from '@/lib/validations/fee-payment'

interface FeePaymentsExportButtonsProps {
  subAppKey: string
  search?: string
  status?: string
  paymentMethod?: string
  feeYear?: number
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  virtual_account: 'Virtual Account',
  qris: 'QRIS',
  other: 'Lainnya',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
  refunded: 'Dikembalikan',
}

const feeTypeLabels: Record<string, string> = {
  spp: 'SPP',
  registration: 'Pendaftaran',
  building: 'Gedung',
  uniform: 'Seragam',
  book: 'Buku',
  activity: 'Kegiatan',
  other: 'Lainnya',
}

function formatRupiah(amount: string): string {
  const num = Number(amount)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

function formatDateWITA(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase()
}

async function exportToExcel(
  data: ExportFeePaymentRow[],
  schoolName: string,
  period: string,
): Promise<void> {
  // Dynamic import agar tidak membebani bundle awal
  const XLSX = await import('xlsx')

  const rows = data.map((row, index) => ({
    No: index + 1,
    'Nama Siswa': row.studentName,
    NISN: row.nisn,
    'No. Siswa': row.studentNumber,
    'Jenis Biaya': feeTypeLabels[row.feeType] ?? row.feeType,
    'Tahun Biaya': row.feeYear,
    'Tarif (Rp)': Number(row.feeAmount),
    'Jumlah Dibayar (Rp)': Number(row.amountPaid),
    'Metode Pembayaran': paymentMethodLabels[row.paymentMethod as PaymentMethod] ?? row.paymentMethod,
    Status: paymentStatusLabels[row.status as PaymentStatus] ?? row.status,
    'No. Kwitansi': row.receipt ?? '-',
    'Tanggal Bayar': formatDateWITA(row.paidDatetime),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap SPP')

  // Auto-width kolom
  const colWidths = [
    { wch: 5 },   // No
    { wch: 30 },  // Nama Siswa
    { wch: 15 },  // NISN
    { wch: 15 },  // No. Siswa
    { wch: 15 },  // Jenis Biaya
    { wch: 12 },  // Tahun Biaya
    { wch: 18 },  // Tarif
    { wch: 22 },  // Jumlah Dibayar
    { wch: 20 },  // Metode
    { wch: 12 },  // Status
    { wch: 18 },  // No. Kwitansi
    { wch: 20 },  // Tanggal Bayar
  ]
  worksheet['!cols'] = colWidths

  const filename = `rekap-spp-${sanitizeFilename(schoolName)}-${sanitizeFilename(period)}.xlsx`
  XLSX.writeFile(workbook, filename)
}

async function exportToPdf(
  data: ExportFeePaymentRow[],
  schoolName: string,
  period: string,
): Promise<void> {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import('@react-pdf/renderer')

  // Hitung total amount paid
  const totalAmountPaid = data.reduce((sum, row) => sum + Number(row.amountPaid), 0)
  const totalFormatted = formatRupiah(String(totalAmountPaid))

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 9,
      paddingTop: 30,
      paddingBottom: 40,
      paddingLeft: 30,
      paddingRight: 30,
    },
    header: {
      marginBottom: 16,
      textAlign: 'center',
    },
    headerTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 10,
      marginBottom: 2,
    },
    headerPeriod: {
      fontSize: 9,
      color: '#6b7280',
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f3f4f6',
      paddingVertical: 5,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderBottomWidth: 0,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderTopWidth: 0,
    },
    tableRowEven: {
      backgroundColor: '#f9fafb',
    },
    colNo: { width: '5%' },
    colSiswa: { width: '20%' },
    colNisn: { width: '12%' },
    colBiaya: { width: '12%' },
    colJumlah: { width: '14%', textAlign: 'right' },
    colMetode: { width: '12%' },
    colStatus: { width: '10%' },
    colTanggal: { width: '15%' },
    headerText: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 8,
    },
    cellText: {
      fontSize: 8,
    },
    footer: {
      marginTop: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerTotal: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 10,
    },
    footerCount: {
      fontSize: 8,
      color: '#6b7280',
    },
    pageNumber: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 8,
      color: '#9ca3af',
    },
  })

  const PdfDocument = () => (
    <Document title={`Rekap SPP - ${schoolName} - ${period}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>REKAP PEMBAYARAN SPP</Text>
          <Text style={styles.headerSubtitle}>{schoolName}</Text>
          <Text style={styles.headerPeriod}>Periode: {period}</Text>
        </View>
        <View style={styles.divider} />

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={styles.colNo}><Text style={styles.headerText}>No</Text></View>
          <View style={styles.colSiswa}><Text style={styles.headerText}>Nama Siswa</Text></View>
          <View style={styles.colNisn}><Text style={styles.headerText}>NISN</Text></View>
          <View style={styles.colBiaya}><Text style={styles.headerText}>Jenis/Tahun</Text></View>
          <View style={styles.colJumlah}><Text style={styles.headerText}>Jumlah Bayar</Text></View>
          <View style={styles.colMetode}><Text style={styles.headerText}>Metode</Text></View>
          <View style={styles.colStatus}><Text style={styles.headerText}>Status</Text></View>
          <View style={styles.colTanggal}><Text style={styles.headerText}>Tgl Bayar</Text></View>
        </View>

        {/* Table Rows */}
        {data.map((row, index) => (
          <View
            key={`${row.studentNumber}-${index}`}
            style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}
          >
            <View style={styles.colNo}><Text style={styles.cellText}>{index + 1}</Text></View>
            <View style={styles.colSiswa}>
              <Text style={styles.cellText}>{row.studentName}</Text>
              <Text style={[styles.cellText, { color: '#6b7280', fontSize: 7 }]}>{row.studentNumber}</Text>
            </View>
            <View style={styles.colNisn}><Text style={styles.cellText}>{row.nisn}</Text></View>
            <View style={styles.colBiaya}>
              <Text style={styles.cellText}>{feeTypeLabels[row.feeType] ?? row.feeType}</Text>
              <Text style={[styles.cellText, { color: '#6b7280', fontSize: 7 }]}>{row.feeYear}</Text>
            </View>
            <View style={styles.colJumlah}><Text style={styles.cellText}>{formatRupiah(row.amountPaid)}</Text></View>
            <View style={styles.colMetode}>
              <Text style={styles.cellText}>
                {paymentMethodLabels[row.paymentMethod as PaymentMethod] ?? row.paymentMethod}
              </Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.cellText}>
                {paymentStatusLabels[row.status as PaymentStatus] ?? row.status}
              </Text>
            </View>
            <View style={styles.colTanggal}>
              <Text style={styles.cellText}>{formatDateWITA(row.paidDatetime)}</Text>
            </View>
          </View>
        ))}

        {/* Footer Total */}
        <View style={styles.footer}>
          <Text style={styles.footerCount}>Total: {data.length} data</Text>
          <Text style={styles.footerTotal}>Total Dibayar: {totalFormatted}</Text>
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )

  const blob = await pdf(<PdfDocument />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rekap-spp-${sanitizeFilename(schoolName)}-${sanitizeFilename(period)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

export function FeePaymentsExportButtons({
  subAppKey,
  search,
  status,
  paymentMethod,
  feeYear,
}: FeePaymentsExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format: 'excel' | 'pdf') {
    setIsExporting(true)
    try {
      const result = await getFeePaymentsForExport(
        {
          search: search || undefined,
          status: status !== 'all' ? status : undefined,
          paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
          feeYear: feeYear,
        },
        subAppKey,
      )

      if (!result.success) {
        toast.error(result.error)
        return
      }

      if (result.data.length === 0) {
        toast.warning('Tidak ada data untuk diekspor dengan filter yang aktif.')
        return
      }

      if (format === 'excel') {
        await exportToExcel(result.data, result.schoolName, result.period)
        toast.success(`Berhasil mengekspor ${result.data.length} data ke Excel.`)
      } else {
        await exportToPdf(result.data, result.schoolName, result.period)
        toast.success(`Berhasil mengekspor ${result.data.length} data ke PDF.`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengekspor data. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
        disabled={isExporting}
      >
        <DownloadIcon className="size-4" />
        {isExporting ? 'Mengekspor...' : 'Ekspor'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheetIcon className="size-4 mr-2" />
          Ekspor ke Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileTextIcon className="size-4 mr-2" />
          Ekspor ke PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
