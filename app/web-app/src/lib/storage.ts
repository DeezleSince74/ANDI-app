import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

// Local storage configuration
const STORAGE_ROOT = path.join(process.cwd(), 'uploads')
const PUBLIC_URL_BASE = '/api/files'

// Ensure upload directories exist
export function ensureStorageDirectories() {
  const dirs = [
    path.join(STORAGE_ROOT, 'images'),
    path.join(STORAGE_ROOT, 'audio'),
    path.join(STORAGE_ROOT, 'temp')
  ]
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// File type validation
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = path.extname(filename).toLowerCase()
  return allowedTypes.includes(ext)
}

export function getFileExtension(mimetype: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg', 
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'audio/webm': '.webm',
    'audio/wav': '.wav',
    'audio/mp3': '.mp3',
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg'
  }
  
  return mimeToExt[mimetype] || '.bin'
}

// Image processing and storage
export async function saveImage(
  buffer: Buffer, 
  originalName: string,
  options: {
    resize?: { width: number; height: number }
    quality?: number
  } = {}
): Promise<{ filename: string; url: string; size: number }> {
  ensureStorageDirectories()
  
  const fileId = randomUUID()
  const filename = `${fileId}.jpg` // Always save as JPG for consistency
  const filepath = path.join(STORAGE_ROOT, 'images', filename)
  
  // Process image with Sharp
  let imageProcessor = sharp(buffer)
    .jpeg({ quality: options.quality || 85 })
    .rotate() // Auto-rotate based on EXIF data
  
  if (options.resize) {
    imageProcessor = imageProcessor.resize(
      options.resize.width, 
      options.resize.height, 
      { fit: 'cover' }
    )
  }
  
  const processedBuffer = await imageProcessor.toBuffer()
  
  // Save to local filesystem
  fs.writeFileSync(filepath, processedBuffer)
  
  return {
    filename,
    url: `${PUBLIC_URL_BASE}/images/${filename}`,
    size: processedBuffer.length
  }
}

// Audio file storage
export async function saveAudio(
  buffer: Buffer,
  mimetype: string
): Promise<{ filename: string; url: string; size: number }> {
  ensureStorageDirectories()
  
  const fileId = randomUUID()
  const extension = getFileExtension(mimetype)
  const filename = `${fileId}${extension}`
  const filepath = path.join(STORAGE_ROOT, 'audio', filename)
  
  // Save audio file directly (no processing)
  fs.writeFileSync(filepath, buffer)
  
  return {
    filename,
    url: `${PUBLIC_URL_BASE}/audio/${filename}`,
    size: buffer.length
  }
}

// File serving utility
export function getFilePath(type: 'images' | 'audio', filename: string): string {
  return path.join(STORAGE_ROOT, type, filename)
}

export function fileExists(type: 'images' | 'audio', filename: string): boolean {
  const filepath = getFilePath(type, filename)
  return fs.existsSync(filepath)
}

// File deletion (for cleanup)
export function deleteFile(type: 'images' | 'audio', filename: string): boolean {
  try {
    const filepath = getFilePath(type, filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

// Storage stats
export function getStorageStats() {
  ensureStorageDirectories()
  
  const getDirectorySize = (dir: string): number => {
    let size = 0
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        const filepath = path.join(dir, file)
        const stats = fs.statSync(filepath)
        size += stats.size
      })
    }
    return size
  }
  
  return {
    images: {
      count: fs.existsSync(path.join(STORAGE_ROOT, 'images')) 
        ? fs.readdirSync(path.join(STORAGE_ROOT, 'images')).length 
        : 0,
      size: getDirectorySize(path.join(STORAGE_ROOT, 'images'))
    },
    audio: {
      count: fs.existsSync(path.join(STORAGE_ROOT, 'audio'))
        ? fs.readdirSync(path.join(STORAGE_ROOT, 'audio')).length
        : 0,
      size: getDirectorySize(path.join(STORAGE_ROOT, 'audio'))
    }
  }
}