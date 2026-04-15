import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { requireRole } from '@/lib/auth-helpers'
import { getFeePaymentById } from '@/actions/fee-payment.actions'

export const metadata = {
  title: 'Detail Pembayaran SPP — School ERP',
}

interface EditSuperadminFeePaymentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSuperadminFeePaymentPage({
  params,
}: EditSuperadminFeePaymentPageProps) {
  try {
    await requireRole(['superadmin'])
  } catch {
    redirect('/login')
  }

  const { id } = await params

  const result = await getFeePaymentById(id)
  if (!result.success) {
    notFound()
  }

  // Pembayaran tidak dapat diedit — redirect ke daftar pembayaran
  redirect('/superadmin/fee-payments')
}
