import { redirect, notFound } from 'next/navigation'
import { requireSubappAccess } from '@/lib/auth-helpers'
import { getFeePaymentById } from '@/actions/fee-payment.actions'

interface EditSchoolFeePaymentPageProps {
  params: Promise<{ subAppKey: string; id: string }>
}

export async function generateMetadata({ params }: EditSchoolFeePaymentPageProps) {
  const { subAppKey } = await params
  return {
    title: `Detail Pembayaran SPP — ${subAppKey} — School ERP`,
  }
}

export default async function EditSchoolFeePaymentPage({
  params,
}: EditSchoolFeePaymentPageProps) {
  const { subAppKey, id } = await params

  try {
    const { subapp } = await requireSubappAccess(subAppKey)

    if (subapp.type !== 'school') {
      redirect('/')
    }
  } catch {
    redirect('/login')
  }

  const result = await getFeePaymentById(id, subAppKey)
  if (!result.success) {
    notFound()
  }

  // Pembayaran tidak dapat diedit — redirect ke daftar pembayaran
  redirect(`/school/${subAppKey}/fee-payments`)
}
