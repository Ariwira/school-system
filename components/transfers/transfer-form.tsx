'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { createTransfer, getInstitutesForTransfer, getStaffsForTransfer } from '@/actions/transfer.actions'
import {
  createTransferSchema,
  transferMethodValues,
  type CreateTransferInput,
} from '@/lib/validations/transfer'
import { transferMethodLabels } from './transfer-utils'

interface InstituteOption {
  id: string
  name: string
  type: string
}

interface StaffOption {
  id: string
  name: string
  staffNumber: string
}

interface TransferFormProps {
  subAppKey?: string
  scopedInstituteId?: string
  /** Redirect ke URL ini setelah sukses */
  redirectTo: string
}

function formatAmountInput(value: string): string {
  return value.replace(/[^\d]/g, '')
}

function parseAmountToDecimal(formatted: string): string {
  const numeric = formatted.replace(/[^\d]/g, '')
  return numeric || '0'
}

export function TransferForm({
  subAppKey,
  scopedInstituteId,
  redirectTo,
}: TransferFormProps) {
  const router = useRouter()
  const [allInstitutes, setAllInstitutes] = useState<InstituteOption[]>([])
  const [issuerStaffs, setIssuerStaffs] = useState<StaffOption[]>([])
  const [senderStaffs, setSenderStaffs] = useState<StaffOption[]>([])
  const [loadingInstitutes, setLoadingInstitutes] = useState(false)
  const [loadingStaffs, setLoadingStaffs] = useState(false)

  const form = useForm<CreateTransferInput>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      transferFromId: scopedInstituteId ?? '',
      transferToId: '',
      amount: '',
      issuerId: '',
      senderId: '',
      transferMethod: 'cash',
      issuedAt: new Date().toISOString().slice(0, 16),
      notes: '',
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const transferFromId = form.watch('transferFromId')

  const fetchInstitutes = useCallback(async () => {
    setLoadingInstitutes(true)
    try {
      const result = await getInstitutesForTransfer(subAppKey)
      if (result.success) {
        setAllInstitutes(result.data)
      }
    } catch {
      // silent
    } finally {
      setLoadingInstitutes(false)
    }
  }, [subAppKey])

  const fetchStaffs = useCallback(
    async (instituteId: string) => {
      if (!instituteId) {
        setIssuerStaffs([])
        setSenderStaffs([])
        return
      }
      setLoadingStaffs(true)
      try {
        const result = await getStaffsForTransfer(instituteId, subAppKey)
        if (result.success) {
          setIssuerStaffs(result.data)
          setSenderStaffs(result.data)
        }
      } catch {
        // silent
      } finally {
        setLoadingStaffs(false)
      }
    },
    [subAppKey],
  )

  useEffect(() => {
    fetchInstitutes()
  }, [fetchInstitutes])

  useEffect(() => {
    if (transferFromId) {
      fetchStaffs(transferFromId)
      form.setValue('issuerId', '')
      form.setValue('senderId', '')
    }
  }, [transferFromId, fetchStaffs, form])

  useEffect(() => {
    if (scopedInstituteId) {
      form.setValue('transferFromId', scopedInstituteId)
    }
  }, [scopedInstituteId, form])

  const fromInstitutes = scopedInstituteId
    ? allInstitutes.filter((i) => i.id === scopedInstituteId)
    : allInstitutes

  const toInstitutes = allInstitutes.filter((i) => i.id !== transferFromId)

  async function onSubmit(data: CreateTransferInput) {
    const result = await createTransfer(data, subAppKey)

    if (result.success) {
      toast.success('Pengajuan transfer berhasil dibuat.')
      router.push(redirectTo)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Institusi Asal */}
        <FormField
          control={form.control}
          name="transferFromId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institusi Asal</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting || !!scopedInstituteId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingInstitutes ? 'Memuat institusi...' : 'Pilih institusi asal'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fromInstitutes.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {loadingInstitutes ? 'Memuat...' : 'Tidak ada institusi.'}
                    </div>
                  ) : (
                    fromInstitutes.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Institusi Tujuan */}
        <FormField
          control={form.control}
          name="transferToId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institusi Tujuan</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting || !transferFromId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !transferFromId
                          ? 'Pilih institusi asal dulu'
                          : loadingInstitutes
                          ? 'Memuat...'
                          : 'Pilih institusi tujuan'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {toInstitutes.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Tidak ada institusi tujuan yang tersedia.
                    </div>
                  ) : (
                    toInstitutes.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Jumlah */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah Transfer (Rp)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="pl-10"
                    disabled={isSubmitting}
                    value={field.value ? Number(field.value).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const raw = formatAmountInput(e.target.value)
                      field.onChange(parseAmountToDecimal(raw))
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Staf Issuer */}
        <FormField
          control={form.control}
          name="issuerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staf Pengajuan (Issuer)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting || !transferFromId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !transferFromId
                          ? 'Pilih institusi asal dulu'
                          : loadingStaffs
                          ? 'Memuat staf...'
                          : 'Pilih staf pengajuan'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {issuerStaffs.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {loadingStaffs ? 'Memuat...' : 'Tidak ada staf aktif.'}
                    </div>
                  ) : (
                    issuerStaffs.map((staff) => (
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

        {/* Staf Pengirim */}
        <FormField
          control={form.control}
          name="senderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staf Pengirim (Sender)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting || !transferFromId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !transferFromId
                          ? 'Pilih institusi asal dulu'
                          : loadingStaffs
                          ? 'Memuat staf...'
                          : 'Pilih staf pengirim'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {senderStaffs.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {loadingStaffs ? 'Memuat...' : 'Tidak ada staf aktif.'}
                    </div>
                  ) : (
                    senderStaffs.map((staff) => (
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

        {/* Tanggal Pengajuan */}
        <FormField
          control={form.control}
          name="issuedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Pengajuan</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="datetime-local"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Catatan */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Catatan{' '}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Keterangan tambahan mengenai transfer ini..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Buat Transfer'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(redirectTo)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </Form>
  )
}
