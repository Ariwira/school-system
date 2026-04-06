'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InstitutesTable } from './institutes-table'
import { getInstitutes } from '@/actions/institute.actions'
import type { InstituteWithParent } from '@/lib/validations/institute'

export function InstitutesListClient() {
  const router = useRouter()
  const [data, setData] = useState<InstituteWithParent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'foundation' | 'school'>('all')
  const [loading, setLoading] = useState(true)

  const perPage = 10

  const fetchData = useCallback(
    async (currentPage: number, currentSearch: string, currentType: typeof typeFilter) => {
      setLoading(true)
      try {
        const result = await getInstitutes({
          page: currentPage,
          perPage,
          search: currentSearch || undefined,
          type: currentType === 'all' ? undefined : currentType,
        })

        if (result.success) {
          setData(result.data.data)
          setTotal(result.data.total)
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error('Gagal memuat data institusi.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      fetchData(1, search, typeFilter)
    }, 400)

    return () => clearTimeout(timeout)
  }, [search, typeFilter, fetchData])

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(newPage, search, typeFilter)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-md">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, telepon, atau alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(val) =>
              setTypeFilter(val as 'all' | 'foundation' | 'school')
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="foundation">Yayasan</SelectItem>
              <SelectItem value="school">Sekolah</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => router.push('/superadmin/institutes/new')}>
          <PlusIcon className="size-4 mr-2" />
          Tambah Institusi
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
          Memuat data...
        </div>
      ) : (
        <InstitutesTable
          data={data}
          total={total}
          page={page}
          perPage={perPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
