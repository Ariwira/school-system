'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { UploadIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { uploadFiles } from '@/lib/uploadthing-client'
import { updateAvatar } from '@/actions/profile.actions'

interface AvatarUploaderProps {
  currentAvatar: string | null
  userName: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function AvatarUploader({ currentAvatar, userName }: AvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatar)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran di client (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB.')
      return
    }

    // Validasi tipe file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format file harus JPG, PNG, atau WebP.')
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await uploadFiles('avatarUploader', { files: [file] })
      const newUrl = uploaded[0]?.ufsUrl

      if (!newUrl) {
        toast.error('Upload gagal. Silakan coba lagi.')
        return
      }

      const oldUrl = avatarUrl
      const result = await updateAvatar(newUrl, oldUrl)

      if (result.success) {
        setAvatarUrl(newUrl)
        toast.success('Avatar berhasil diperbarui.')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Gagal mengupload avatar. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
      // Reset input agar bisa upload file yang sama lagi
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-6">
      <Avatar size="default" className="size-20">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
        <AvatarFallback className="text-xl">{getInitials(userName)}</AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          JPG, PNG, atau WebP. Maks 2MB.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="size-4 mr-2" />
          {isUploading ? 'Mengupload...' : 'Ganti Avatar'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
