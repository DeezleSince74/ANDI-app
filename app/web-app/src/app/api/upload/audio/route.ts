import { NextRequest, NextResponse } from "next/server"
import { saveAudio } from "~/lib/storage"
import { auth } from "~/server/auth"

export async function POST(req: NextRequest) {
  try {
    // Check authentication (allow mock user in development)
    const session = await auth()
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!session?.user?.id && !isDevelopment) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    // Use mock user ID in development if no session
    const userId = session?.user?.id || (isDevelopment ? 'mock-user-id' : null)
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get('audio') as File

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: "Only audio files are allowed" },
        { status: 400 }
      )
    }

    // Check file size (10MB limit for audio)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Save audio file
    const result = await saveAudio(buffer, file.type)

    // Log successful upload
    console.log(`Audio uploaded successfully: ${result.filename} (${result.size} bytes)`)

    return NextResponse.json({
      success: true,
      file: {
        filename: result.filename,
        url: result.url,
        size: result.size,
        type: 'audio',
        mimetype: file.type
      }
    })

  } catch (error) {
    console.error("Audio upload error:", error)
    
    if (error instanceof Error) {
      if (error.message.includes('file size')) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        )
      }
      if (error.message.includes('file type')) {
        return NextResponse.json(
          { error: "Invalid file type. Only audio files are allowed." },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to upload audio" },
      { status: 500 }
    )
  }
}