'use client'

import { PencilIcon, MoreHorizontal } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  registration: 'Pendaftaran',
  spp: 'SPP',
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
              <TableHead>Semester</TableHead>
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
                <TableCell>{fee.semester === 1 ? 'Ganjil' : 'Genap'}</TableCell>
                <TableCell>{feeTypeLabels[fee.feeType] ?? fee.feeType}</TableCell>
                <TableCell>{formatRupiah(fee.amount)}</TableCell>
                <TableCell className="text-center">{fee.paymentCount}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                      disabled={fee.paymentCount > 0}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Buka menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                          Aksi Tarif
                        </DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => onEdit(fee)}
                          className="cursor-pointer"
                          disabled={fee.paymentCount > 0}
                        >
                          <PencilIcon className="size-4 mr-2" />
                          Edit Tarif
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
