import multer from 'multer'
import { validateFileType } from './storage'

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024  // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024  // 10MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const ALLOWED_AUDIO_TYPES = ['.webm', '.wav', '.mp3', '.ogg']

// Memory storage for processing
const storage = multer.memoryStorage()

// Image upload configuration
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type by MIME type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
}).single('image')

// Audio upload configuration  
export const audioUpload = multer({
  storage,
  limits: {
    fileSize: MAX_AUDIO_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type by MIME type
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('Only audio files are allowed'), false)
    }
  }
}).single('audio')

// Utility to run multer in Next.js API route
export function runMiddleware(req: any, res: any, fn: Function): Promise<any> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}