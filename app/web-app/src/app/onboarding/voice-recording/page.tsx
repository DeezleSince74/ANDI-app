"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "@/lib/onboarding-context"
import { NavigationButtons } from "@/components/onboarding/navigation-buttons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const VOICE_PHRASES = [
  "Good morning, class. Let's get started with today's lesson.",
  "Remember to raise your hand if you have any questions.",
  "Great job everyone! I'm proud of the work you've done today."
]

export default function VoiceRecordingPage() {
  const router = useRouter()
  const { data, updateData } = useOnboarding()
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedPhrases, setRecordedPhrases] = useState<boolean[]>([false, false, false])
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setAudioBlobs(prev => {
          const newBlobs = [...prev]
          newBlobs[currentPhrase] = audioBlob
          return newBlobs
        })
        setRecordedPhrases(prev => {
          const newRecorded = [...prev]
          newRecorded[currentPhrase] = true
          return newRecorded
        })
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Unable to access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const handleNext = async () => {
    if (currentPhrase < VOICE_PHRASES.length - 1) {
      setCurrentPhrase(currentPhrase + 1)
    } else {
      // Upload all audio recordings and complete onboarding
      await uploadAudioAndComplete()
    }
  }

  const uploadAudioAndComplete = async () => {
    setIsUploading(true)
    
    try {
      // Combine all audio blobs into one file
      const combinedBlob = new Blob(audioBlobs, { type: 'audio/webm' })
      
      // Upload the combined audio file
      const formData = new FormData()
      formData.append('audio', combinedBlob, 'voice-sample.webm')
      
      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const result = await response.json()
      
      // Update onboarding data with voice sample URL
      updateData({ voiceSampleUrl: result.file.url })
      
      console.log('Voice sample uploaded successfully:', result.file.filename)
      
      // Complete onboarding
      await completeOnboarding()
      
    } catch (error) {
      console.error('Error uploading voice sample:', error)
      alert('Failed to upload voice sample. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const completeOnboarding = async () => {
    try {
      // Call API to save all onboarding data to database
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }
      
      console.log('Onboarding completed successfully!')
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to complete onboarding. Please try again.')
    }
  }

  // const allPhrasesRecorded = recordedPhrases.every(recorded => recorded)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
        Voice Sample Recording
      </h1>

      {/* Progress dots for phrases */}
      <div className="flex justify-center items-center space-x-3 mb-8">
        {VOICE_PHRASES.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentPhrase
                ? "bg-slate-600 w-10"
                : recordedPhrases[index]
                ? "bg-slate-500"
                : "bg-slate-300"
            )}
          />
        ))}
      </div>

      <Card className="p-6 mb-8 bg-slate-50">
        <p className="text-center text-lg text-slate-900 mb-2">
          Please read the following phrase:
        </p>
        <p className="text-center text-xl font-medium text-slate-900">
          &ldquo;{VOICE_PHRASES[currentPhrase]}&rdquo;
        </p>
      </Card>

      <div className="flex justify-center mb-8">
        {!isRecording ? (
          <Button
            size="lg"
            onClick={startRecording}
            className="bg-slate-700 hover:bg-slate-800 text-white"
          >
            <Mic className="mr-2 h-5 w-5" />
            Start Recording
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={stopRecording}
            variant="destructive"
          >
            <Square className="mr-2 h-5 w-5" />
            Stop Recording
          </Button>
        )}
      </div>

      {recordedPhrases[currentPhrase] && !isRecording && (
        <div className="flex items-center justify-center text-slate-600 mb-6">
          <CheckCircle className="mr-2 h-5 w-5" />
          <span>Recording complete!</span>
        </div>
      )}

      <NavigationButtons
        onNext={handleNext}
        backPath="/onboarding/voice-intro"
        nextLabel={currentPhrase < VOICE_PHRASES.length - 1 ? "Next Phrase" : "Complete Onboarding"}
        isNextDisabled={!recordedPhrases[currentPhrase] || isRecording || isUploading}
        isLoading={isUploading}
      />
    </div>
  )
}