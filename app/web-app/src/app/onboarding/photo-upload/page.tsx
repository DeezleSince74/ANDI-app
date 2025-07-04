"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useOnboarding } from "@/lib/onboarding-context"
import { NavigationButtons } from "@/components/onboarding/navigation-buttons"
import { PhotoUpload } from "@/components/onboarding/photo-upload"
import { Button } from "@/components/ui/button"

export default function PhotoUploadPage() {
  const { data: session } = useSession()
  const { data, updateData } = useOnboarding()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Mock teacher data for development
  const mockTeacher = {
    name: "Sarah Johnson",
    email: "sarah.johnson@school.edu",
    image: null
  }
  
  const teacher = session?.user || mockTeacher
  const [previewUrl, setPreviewUrl] = useState<string | null>(data.avatarUrl || teacher?.image || null)
  const [isUploading, setIsUploading] = useState(false)

  const handlePhotoChange = (file: File | null, preview: string | null) => {
    setSelectedFile(file)
    setPreviewUrl(preview)
  }

  const handleNext = async () => {
    if (selectedFile) {
      setIsUploading(true)
      try {
        // Upload file to local storage
        const formData = new FormData()
        formData.append('image', selectedFile)
        
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }
        
        const result = await response.json()
        updateData({ avatarUrl: result.file.url })
        
        console.log('Photo uploaded successfully:', result.file.filename)
      } catch (error) {
        console.error('Error uploading photo:', error)
        // TODO: Show user-friendly error message
        alert('Failed to upload photo. Please try again.')
        return // Don't proceed if upload failed
      } finally {
        setIsUploading(false)
      }
    } else if (previewUrl) {
      // User kept existing photo
      updateData({ avatarUrl: previewUrl })
    }
  }

  const handleSkip = () => {
    // User chose to skip photo upload
    updateData({ avatarUrl: undefined })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
        Add your photo
      </h1>
      <p className="text-slate-600 mb-8 text-center">
        Help your students and colleagues recognize you. You can always change this later.
      </p>

      <PhotoUpload
        currentPhoto={previewUrl || undefined}
        onPhotoChange={handlePhotoChange}
        userName={teacher?.name || "Teacher"}
        className="mb-8"
      />

      <div className="flex justify-center mb-6">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-slate-500 hover:text-slate-700"
          disabled={isUploading}
        >
          Skip for now
        </Button>
      </div>

      <NavigationButtons
        onNext={handleNext}
        nextPath="/onboarding/voice-intro"
        backPath="/onboarding/goals"
        nextLabel={selectedFile ? "Upload Photo" : "Continue"}
        isNextDisabled={isUploading}
        isLoading={isUploading}
      />
    </div>
  )
}