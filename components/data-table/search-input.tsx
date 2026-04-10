'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SearchIcon, XIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  placeholder?: string
  paramKey?: string
  className?: string
}

export function SearchInput({
  placeholder = 'Cari...',
  paramKey = 'search',
  className,
}: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialValue = searchParams.get(paramKey) ?? ''
  const [value, setValue] = useState(initialValue)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from URL to local state on navigation
  useEffect(() => {
    const urlValue = searchParams.get(paramKey) ?? ''
    setValue(urlValue)
  }, [searchParams, paramKey])

  function updateUrl(newValue: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (newValue) {
      params.set(paramKey, newValue)
    } else {
      params.delete(paramKey)
    }

    // Reset page ke 1 saat search berubah
    params.set('page', '1')

    router.push(`${pathname}?${params.toString()}`)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setValue(newValue)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      updateUrl(newValue)
    }, 300)
  }

  function handleClear() {
    setValue('')
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    updateUrl('')
  }

  return (
    <div className={`relative flex-1 ${className ?? ''}`}>
      <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-8 pr-8"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 size-6 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <XIcon className="size-3" />
        </Button>
      )}
    </div>
  )
}
