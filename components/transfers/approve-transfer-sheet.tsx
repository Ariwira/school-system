'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2Icon, UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { approveTransfer, getStaffsForTransfer } from '@/actions/transfer.actions'
import {
  approveTransferSchema,
  transferMethodValues,
  type ApproveTransferInput,
  type TransferRow,
} from '@/lib/validations/transfer'
import { transferMethodLabels, formatRupiah } from './transfer-utils'
import { uploadFiles } from '@/lib/uploadthing-client'

interface StaffOption {
  id: string
  name: string
  staffNumber: string
}

interface ApproveTransferSheetProps {
  transfer: TransferRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  subAppKey?: string
}

export function ApproveTransferSheet({
  transfer,
  open,
  onOpenChange,
  onSuccess,
  subAppKey,
}: ApproveTransferSheetProps) {
  const [approvers, setApprovers] = useState<StaffOption[]>([])
  const [loadingApprovers, setLoadingApprovers] = useState(false)
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ApproveTransferInput>({
    resolver: zodResolver(approveTransferSchema),
    defaultValues: {
      approverId: '',
      receipt: '',
      receiptFile: '',
      transferMethod: transfer.transferMethod,
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const transferMethod = form.watch('transferMethod')
  const isBankTransfer = transferMethod === 'bank_transfer'

  useEffect(() => {
    if (!open) return

    async function fetchApprovers() {
      setLoadingApprovers(true)
      try {
        const result = await getStaffsForTransfer(transfer.transferFromId, subAppKey)
        if (result.success) {
          setApprovers(result.data)
        }
      } catch {
        // silent
      } finally {
        setLoadingApprovers(false)
      }
    }
    fetchApprovers()
  }, [open, transfer.transferFromId, subAppKey])

  useEffect(() => {
    form.setValue('receiptFile', uploadedReceiptUrl)
    if (uploadedReceiptUrl) {
      form.clearErrors('receiptFile')
    }
  }, [uploadedReceiptUrl, form])

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file harus JPG, PNG, WebP, atau PDF.')
      return
    }

    const maxSize = file.type === 'application/pdf' ? 8 * 1024 * 1024 : 4 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(
        file.type === 'application/pdf'
          ? 'Ukuran file PDF maksimal 8MB.'
          : 'Ukuran file gambar maksimal 4MB.',
      )
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await uploadFiles('receiptUploader', { files: [file] })
      const url = uploaded[0]?.ufsUrl
      if (url) {
        setUploadedReceiptUrl(url)
        toast.success('Bukti transfer berhasil diupload.')
      } else {
        toast.error('Upload gagal. Silakan coba lagi.')
      }
    } catch {
      toast.error('Upload gagal. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function onSubmit(data: ApproveTransferInput) {
    const result = await approveTransfer(transfer.id, data, subAppKey)

    if (result.success) {
      toast.success('Transfer berhasil disetujui.')
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      form.reset()
      setUploadedReceiptUrl('')
    }
    onOpenChange(open)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Setujui Transfer</SheetTitle>
          <SheetDescription>
            Transfer dari <strong>{transfer.transferFromName}</strong> ke{' '}
            <strong>{transfer.transferToName}</strong> sebesar{' '}
            <strong>{formatRupiah(transfer.amount)}</strong>.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Approver */}
              <FormField
                control={form.control}
                name="approverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approver</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingApprovers ? 'Memuat staf...' : 'Pilih staf approver'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {approvers.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            {loadingApprovers ? 'Memuat...' : 'Tidak ada staf aktif.'}
                          </div>
                        ) : (
                          approvers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              <span className="font-medium">{staff.name}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                {staff.staffNumber}
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Metode Transfer */}
              <FormField
                control={form.control}
                name="transferMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metode Transfer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih metode transfer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transferMethodValues.map((method) => (
                          <SelectItem key={method} value={method}>
                            {transferMethodLabels[method]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nomor Referensi (opsional) */}
              <FormField
                control={form.control}
                name="receipt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nomor Referensi{' '}
                      <span className="text-muted-foreground font-normal">(opsional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Contoh: TRF-001 / No. transaksi bank"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload Bukti */}
              <FormField
                control={form.control}
                name="receiptFile"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Bukti Transfer
                      {isBankTransfer && <span className="text-destructive ml-1">*</span>}
                      {!isBankTransfer && (
                        <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {uploadedReceiptUrl ? (
                          <div className="flex items-center gap-2 p-2 rounded border bg-muted/50">
                            <UploadIcon className="size-4 text-green-600" />
                            <span className="text-sm text-green-700 flex-1 truncate">
                              Bukti berhasil diupload
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUploadedReceiptUrl('')
                                form.setValue('receiptFile', '')
                              }}
                              disabled={isSubmitting}
                            >
                              Hapus
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              render={<a href={uploadedReceiptUrl} target="_blank" rel="noopener noreferrer" />}
                            >
                              Lihat
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              onChange={handleReceiptUpload}
                              className="hidden"
                              disabled={isSubmitting || isUploading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isSubmitting || isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2Icon className="size-3.5 mr-1 animate-spin" />
                                  Mengupload...
                                </>
                              ) : (
                                <>
                                  <UploadIcon className="size-3.5 mr-1" />
                                  Pilih File
                                </>
                              )}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG, WebP (maks. 4MB) atau PDF (maks. 8MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="size-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Setujui Transfer'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
