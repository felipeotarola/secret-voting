"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ImageIcon, Upload } from "lucide-react"
import Image from "next/image"
import { uploadImage } from "@/lib/blob-utils"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  onError?: (error: string) => void
  className?: string
  initialImage?: string
}

export function ImageUpload({ onImageUploaded, onError, className = "", initialImage = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(initialImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialImage && !preview) {
      setPreview(initialImage)
    }
  }, [initialImage, preview])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onError?.("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image must be less than 5MB")
      return
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Upload to Vercel Blob
    setIsUploading(true)
    try {
      const { url, success, error } = await uploadImage(file)

      if (success && url) {
        onImageUploaded(url)
      } else {
        throw error || new Error("Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      onError?.(error instanceof Error ? error.message : "Failed to upload image")
      setPreview(initialImage || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageUploaded("")
  }

  return (
    <div className={`w-full ${className}`}>
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-violet-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-violet-50/50 transition-colors"
        >
          <ImageIcon className="h-10 w-10 text-violet-500 mb-3" />
          <p className="text-center text-muted-foreground mb-2">Click to upload an image</p>
          <p className="text-xs text-muted-foreground">PNG, JPG or GIF (max. 5MB)</p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border-2 border-violet-300">
          <div className="aspect-square relative w-full max-w-[200px] mx-auto">
            <Image src={preview || "/placeholder.svg"} alt="Image preview" fill className="object-cover" />
          </div>
          <div className="absolute top-0 right-0 p-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 text-violet-600" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="rounded-full opacity-90 hover:opacity-100"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isUploading && <div className="mt-2 text-sm text-center text-muted-foreground">Uploading image...</div>}
    </div>
  )
}
