'use client'

import { useEffect, useCallback, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/data-table/search-input'
import { FilterSelect } from '@/components/data-table/filter-select'
import { InstitutesTable } from './institutes-table'
import { getInstitutes } from '@/actions/institute.actions'
import type { InstituteWithParent } from '@/lib/validations/institute'

const typeOptions = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'foundation', label: 'Yayasan' },
  { value: 'school', label: 'Sekolah' },
]

export function InstitutesListClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const typeFilter = searchParams.get('type') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const [data, setData] = useState<InstituteWithParent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const perPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getInstitutes({
        page,
        perPage,
        search: search || undefined,
        type: typeFilter !== 'all' ? (typeFilter as 'foundation' | 'school') : undefined,
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
  }, [page, search, typeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 max-w-lg">
          <SearchInput
            placeholder="Cari nama, telepon, atau alamat..."
            paramKey="search"
            className="max-w-sm"
          />
          <FilterSelect
            options={typeOptions}
            paramKey="type"
            placeholder="Semua Tipe"
            className="w-36"
          />
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
        />
      )}
    </div>
  )
}
