import type { TransferStatus, TransferMethod } from '@/lib/validations/transfer'

export const statusConfig: Record<
  TransferStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Menunggu', variant: 'secondary' },
  approved: { label: 'Disetujui', variant: 'default' },
  rejected: { label: 'Ditolak', variant: 'destructive' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
}

export const transferMethodLabels: Record<TransferMethod, string> = {
  cash: 'Tunai',
  bank_transfer: 'Transfer Bank',
  other: 'Lainnya',
}

export function formatRupiah(amount: string): string {
  const num = Number(amount)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export function formatDateWITA(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
