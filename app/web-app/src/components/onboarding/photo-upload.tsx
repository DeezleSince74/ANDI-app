"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Camera, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoUploadProps {
  currentPhoto?: string
  onPhotoChange: (file: File | null, previewUrl: string | null) => void
  userName?: string
  className?: string
}

export function PhotoUpload({ 
  currentPhoto, 
  onPhotoChange, 
  userName = "Teacher",
  className 
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
        onPhotoChange(file, result)
      }
      reader.readAsDataURL(file)
    }
  }, [onPhotoChange])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removePhoto = () => {
    setPreview(null)
    onPhotoChange(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Photo Display */}
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-slate-200">
            <AvatarImage src={preview || undefined} alt={userName} />
            <AvatarFallback className="text-2xl">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {preview && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={removePhoto}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer",
          isDragging 
            ? "border-slate-400 bg-slate-50" 
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <h3 className="font-medium text-slate-900 mb-2">
            Upload your photo
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Drag and drop your photo here, or click to select
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openFileDialog()
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Supports JPG, PNG up to 5MB
          </p>
        </div>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  )
}