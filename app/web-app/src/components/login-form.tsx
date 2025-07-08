"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { Separator } from "~/components/ui/separator"
import { Globe, Building, Mail, Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [devLoginMessage, setDevLoginMessage] = useState("")

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(provider)
    try {
      await signIn(provider, { 
        callbackUrl: "/dashboard",
        redirect: true 
      })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleDevLogin = async (email: string) => {
    console.log('🚀 [LOGIN-FORM] Starting dev login for:', email)
    setIsLoading("dev")
    try {
      // First create the session
      console.log('📡 [LOGIN-FORM] Sending request to /api/dev-auth')
      const response = await fetch("/api/dev-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      
      console.log('📥 [LOGIN-FORM] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ [LOGIN-FORM] Login successful:', data)
        setDevLoginMessage("✅ Development login successful! Redirecting...")
        
        // Small delay then redirect with full page refresh to ensure session is picked up
        console.log('🔄 [LOGIN-FORM] Redirecting to dashboard in 500ms')
        setTimeout(() => {
          console.log('🏠 [LOGIN-FORM] Executing redirect to /dashboard')
          window.location.replace("/dashboard")
        }, 500)
      } else {
        const errorData = await response.json()
        console.error('❌ [LOGIN-FORM] Login failed:', errorData)
        setDevLoginMessage(`❌ Development login failed: ${errorData.error}`)
      }
    } catch (error) {
      console.error("💥 [LOGIN-FORM] Dev login error:", error)
      setDevLoginMessage("❌ Development login failed")
    } finally {
      setIsLoading(null)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    // Check for development login
    if (process.env.NODE_ENV === 'development' && email === 'derekfrempong@gmail.com') {
      await handleDevLogin(email)
      return
    }

    setIsLoading("email")
    try {
      await signIn("email", { 
        email,
        callbackUrl: "/dashboard",
        redirect: true 
      })
    } catch (error) {
      console.error("Error signing in with email:", error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto bg-white/50 backdrop-blur-md border-slate-300/50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl text-center text-slate-900">Welcome Back</CardTitle>
        <CardDescription className="text-center text-slate-800 text-base">
          Sign in to your ANDI account to continue your educational journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* OAuth Providers */}
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="w-full border-slate-400 text-slate-800 hover:bg-slate-100 hover:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 text-base"
              onClick={() => handleProviderSignIn("google")}
              disabled={isLoading !== null}
              aria-label="Sign in with Google"
            >
              {isLoading === "google" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Globe className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full border-slate-400 text-slate-800 hover:bg-slate-100 hover:border-slate-500 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 text-base"
              onClick={() => handleProviderSignIn("azure-ad")}
              disabled={isLoading !== null}
              aria-label="Sign in with Microsoft 365"
            >
              {isLoading === "azure-ad" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Building className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Continue with Microsoft 365
            </Button>
          </div>

          <div className="relative" role="separator" aria-label="Alternative sign-in methods">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-slate-400" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="px-3 bg-white text-slate-900 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-800 font-medium text-base">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading !== null}
                className="border-slate-400 text-slate-900 placeholder:text-slate-500 focus:border-slate-600 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                aria-describedby="email-description"
              />
              <div id="email-description" className="sr-only">
                Enter your email address to receive a sign-in link
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading !== null}
                className="border-slate-500 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                aria-describedby="remember-description"
              />
              <Label
                htmlFor="remember"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-800"
              >
                Keep me signed in
              </Label>
              <div id="remember-description" className="sr-only">
                Stay signed in on this device for easier access
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 text-base"
              disabled={isLoading !== null || !email}
              aria-label={isLoading === "email" ? "Sending magic link..." : "Send magic link to email"}
            >
              {isLoading === "email" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Sending magic link...</span>
                </>
              ) : isLoading === "dev" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Send magic link</span>
                </>
              )}
            </Button>
          </form>

          {/* Development Login Message */}
          {devLoginMessage && (
            <div className="mt-2 p-3 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-800">
              {devLoginMessage}
            </div>
          )}

          {/* Development Hint */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
              <strong>Development:</strong> Use <code className="bg-blue-200 px-1 rounded text-blue-900">derekfrempong@gmail.com</code> for instant login as David Thompson
            </div>
          )}

          <div className="mt-4 text-center text-sm text-slate-800">
            By signing in, you agree to our{" "}
            <a 
              href="/terms" 
              className="underline underline-offset-4 text-slate-900 hover:text-slate-900 focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded transition-colors"
              aria-label="Read our Terms of Service"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a 
              href="/privacy" 
              className="underline underline-offset-4 text-slate-900 hover:text-slate-900 focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded transition-colors"
              aria-label="Read our Privacy Policy"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}