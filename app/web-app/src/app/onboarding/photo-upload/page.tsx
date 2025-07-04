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
        // TODO: Upload file to storage service and get URL
        // For now, just use the preview URL as a placeholder
        const uploadedUrl = previewUrl // This would be the actual uploaded URL
        updateData({ avatarUrl: uploadedUrl })
      } catch (error) {
        console.error('Error uploading photo:', error)
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