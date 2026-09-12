import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const BUCKET = 'product-images'

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = async (
    file: File | Blob,
    filename?: string
  ): Promise<string | null> => {
    setIsUploading(true)
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Use JPEG, PNG, WebP or AVIF.')
      }

      const MAX_SIZE = 5 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        throw new Error('File too large. Max 5 MB.')
      }

      const extFromType = file.type.split('/')[1] || 'jpg'
      const fileExt = filename?.split('.').pop() || extFromType
      const finalName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(finalName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(finalName)
      return data.publicUrl
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deleteImage = async (url: string): Promise<void> => {
    try {
      const fileName = url.split('/').pop()
      if (!fileName) return
      const { error } = await supabase.storage.from(BUCKET).remove([fileName])
      if (error) throw error
    } catch (error) {
      // Silent fail — don't block UX on cleanup issues
      console.error('deleteImage error:', error)
    }
  }

  /**
   * Delete multiple images in one storage call.
   */
  const deleteImages = async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return
    try {
      const fileNames = urls
        .map((url) => url.split('/').pop())
        .filter(Boolean) as string[]
      if (fileNames.length === 0) return

      const { error } = await supabase.storage.from(BUCKET).remove(fileNames)
      if (error) throw error
    } catch (error) {
      console.error('deleteImages error:', error)
    }
  }

  return { uploadImage, deleteImage, deleteImages, isUploading }
}