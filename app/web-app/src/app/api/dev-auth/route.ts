import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  console.log('🔐 [DEV-AUTH] Starting development authentication')
  
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    console.log('❌ [DEV-AUTH] Not in development mode')
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const { email } = await req.json()
    console.log('📧 [DEV-AUTH] Received email:', email)
    
    // Check if email is derekfrempong@gmail.com
    if (email !== 'derekfrempong@gmail.com') {
      console.log('❌ [DEV-AUTH] Invalid email provided')
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    console.log('✅ [DEV-AUTH] Valid development email, authentication will be handled by layout')
    
    // Just return success - the actual authentication bypass is handled in the layout
    const response = NextResponse.json({ 
      success: true,
      message: "Development authentication enabled",
      user: { 
        id: "550e8400-e29b-41d4-a716-446655440011",
        email: "david.thompson@mcps.edu", 
        name: "David Thompson" 
      } 
    })

    console.log('🎉 [DEV-AUTH] Development authentication setup complete')
    return response
  } catch (error) {
    console.error('💥 [DEV-AUTH] Error:', error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}