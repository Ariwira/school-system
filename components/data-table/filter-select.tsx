'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  options: FilterOption[]
  paramKey: string
  placeholder?: string
  className?: string
}

export function FilterSelect({
  options,
  paramKey,
  placeholder = 'Semua',
  className,
}: FilterSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentValue = searchParams.get(paramKey) ?? 'all'

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== 'all') {
      params.set(paramKey, value)
    } else {
      params.delete(paramKey)
    }

    // Reset page ke 1 saat filter berubah
    params.set('page', '1')

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className={className ?? 'w-[160px]'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
