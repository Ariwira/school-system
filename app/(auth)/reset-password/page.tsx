import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { ResetPasswordForm } from './reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin size-4" />
          <span>Memuat...</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
