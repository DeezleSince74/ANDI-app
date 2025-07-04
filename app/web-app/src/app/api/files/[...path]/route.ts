import { NextRequest, NextResponse } from "next/server"
import { getFilePath, fileExists } from "~/lib/storage"
import fs from 'fs'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path
    
    if (!filePath || filePath.length !== 2) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      )
    }

    const [type, filename] = filePath
    
    // Validate file type
    if (type !== 'images' && type !== 'audio') {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      )
    }

    // Check if file exists
    if (!fileExists(type as 'images' | 'audio', filename)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Get file path
    const fullPath = getFilePath(type as 'images' | 'audio', filename)
    
    // Read file
    const fileBuffer = fs.readFileSync(fullPath)
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (type === 'images') {
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.webp':
          contentType = 'image/webp'
          break
      }
    } else if (type === 'audio') {
      switch (ext) {
        case '.webm':
          contentType = 'audio/webm'
          break
        case '.wav':
          contentType = 'audio/wav'
          break
        case '.mp3':
          contentType = 'audio/mpeg'
          break
        case '.ogg':
          contentType = 'audio/ogg'
          break
      }
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': `"${filename}"`,
      },
    })

  } catch (error) {
    console.error("File serving error:", error)
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    )
  }
}