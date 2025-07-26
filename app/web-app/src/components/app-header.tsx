"use client"

import * as React from "react"
import { Upload, Mic } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { useRecording } from "~/lib/recording-context"
import UploadModal from "~/components/recording/UploadModal"
import RecordingModal from "~/components/recording/RecordingModal"
import FloatingRecorder from "~/components/recording/FloatingRecorder"
import RecordingNotification from "~/components/recording/RecordingNotification"
import StopConfirmationModal from "~/components/recording/StopConfirmationModal"
import ProcessingWidget from "~/components/recording/ProcessingWidget"
import { NotificationBell } from "~/components/notifications/notification-bell"

export function AppHeader() {
  const { data: session } = useSession()
  const {
    recordingState,
    isUploadModalOpen,
    isRecordingModalOpen,
    isStopConfirmationOpen,
    notificationState,
    processingWidget,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    confirmStopRecording,
    openUploadModal,
    closeUploadModal,
    openRecordingModal,
    closeRecordingModal,
    closeStopConfirmation,
    hideNotification,
    showProcessingWidget,
    hideProcessingWidget,
  } = useRecording()
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleStartRecording = async (duration: number, name: string) => {
    if (session?.user?.id) {
      try {
        await startRecording(duration, session.user.id, name)
      } catch (error) {
        console.error('Failed to start recording:', error)
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-2 px-3">
        <div className="flex flex-1 items-center gap-2 md:justify-end">
          <Button 
            variant="outline" 
            size="default"
            className="gap-2"
            onClick={openUploadModal}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          
          <Button 
            size="default"
            className="gap-2"
            onClick={openRecordingModal}
            disabled={recordingState.isRecording}
          >
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">
              {recordingState.isRecording ? 'Recording...' : 'Record'}
            </span>
          </Button>
          
          <NotificationBell userId={session?.user?.id} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={session?.user?.image || undefined} 
                    alt={session?.user?.name || "User"} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile">Profile</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Recording Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        teacherId={session?.user?.id || ''}
        onUploadSuccess={showProcessingWidget}
      />

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={closeRecordingModal}
        onStartRecording={handleStartRecording}
      />

      <StopConfirmationModal
        isOpen={isStopConfirmationOpen}
        onClose={closeStopConfirmation}
        onConfirm={confirmStopRecording}
        duration={recordingState.duration}
      />

      {/* Floating Recording Widget */}
      <FloatingRecorder
        isRecording={recordingState.isRecording}
        isPaused={recordingState.isPaused}
        duration={recordingState.duration}
        onPause={pauseRecording}
        onResume={resumeRecording}
        onStop={stopRecording}
      />

      {/* Recording Notifications */}
      <RecordingNotification
        isVisible={notificationState.isVisible}
        type={notificationState.type || 'ended'}
        onClose={hideNotification}
      />

      {/* Processing Widget */}
      {processingWidget.isVisible && processingWidget.session && (
        <ProcessingWidget
          sessionId={processingWidget.session.sessionId}
          transcriptId={processingWidget.session.transcriptId}
          recordingName={processingWidget.session.recordingName}
          onClose={hideProcessingWidget}
          onComplete={(sessionId) => {
            console.log('Processing completed for session:', sessionId);
            // Could show success notification or navigate to results
          }}
        />
      )}
    </header>
  )
}