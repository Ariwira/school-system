'use client'

import { PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UrlPagination } from '@/components/data-table/url-pagination'
import type { FeeRow } from '@/lib/validations/fee'

interface FeesTableProps {
  data: FeeRow[]
  total: number
  page: number
  perPage: number
  onEdit: (fee: FeeRow) => void
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

export function FeesTable({
  data,
  total,
  page,
  perPage,
  onEdit,
}: FeesTableProps) {

  if (data.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
        Belum ada tarif biaya yang didefinisikan.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tahun Akademik</TableHead>
              <TableHead>Tipe Biaya</TableHead>
              <TableHead>Besaran</TableHead>
              <TableHead className="text-center">Jumlah Pembayaran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell className="font-medium">{fee.year}</TableCell>
                <TableCell>{feeTypeLabels[fee.feeType] ?? fee.feeType}</TableCell>
                <TableCell>{formatRupiah(fee.amount)}</TableCell>
                <TableCell className="text-center">{fee.paymentCount}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(fee)}
                    title={
                      fee.paymentCount > 0
                        ? 'Tidak dapat diedit — sudah ada pembayaran'
                        : 'Edit tarif'
                    }
                    disabled={fee.paymentCount > 0}
                  >
                    <PencilIcon className="size-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginasi */}
      <UrlPagination
        total={total}
        page={page}
        perPage={perPage}
        itemLabel="tarif"
      />
    </div>
  )
}
