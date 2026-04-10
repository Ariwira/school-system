'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UrlPagination } from './url-pagination'

export interface ColumnDef<TData> {
  key: string
  header: string
  cell: (row: TData) => React.ReactNode
  className?: string
}

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  total: number
  page: number
  perPage: number
  itemLabel?: string
  emptyText?: string
  getRowKey: (row: TData) => string
}

export function DataTable<TData>({
  data,
  columns,
  total,
  page,
  perPage,
  itemLabel = 'data',
  emptyText = 'Belum ada data.',
  getRowKey,
}: DataTableProps<TData>) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-10"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={getRowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UrlPagination
        total={total}
        page={page}
        perPage={perPage}
        itemLabel={itemLabel}
      />
    </div>
  )
}
