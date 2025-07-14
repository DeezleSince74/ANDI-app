import { NextRequest, NextResponse } from "next/server"
// import { imageUpload, runMiddleware } from "~/lib/multer-config"
import { saveImage } from "~/lib/storage"
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

    // Convert NextRequest to Node.js request-like object for multer
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      )
    }

    // Check file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log(`Processing image: ${file.name}, size: ${file.size}, type: ${file.type}`)

    // Process and save image
    const result = await saveImage(buffer, file.name, {
      resize: { width: 400, height: 400 }, // Profile photo size
      quality: 85
    })

    // Log successful upload
    console.log(`Image uploaded successfully: ${result.filename} (${result.size} bytes) for user: ${userId}`)

    return NextResponse.json({
      success: true,
      file: {
        filename: result.filename,
        url: result.url,
        size: result.size,
        type: 'image'
      }
    })

  } catch (error) {
    console.error("Image upload error:", error)
    
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack)
      
      if (error.message.includes('file size')) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }
      if (error.message.includes('file type')) {
        return NextResponse.json(
          { error: "Invalid file type. Only images are allowed." },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}