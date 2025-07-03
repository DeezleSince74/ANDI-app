"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
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
import { Chrome, Building, Mail, Loader2 } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

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
    <Card className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your ANDI account to continue your educational journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* OAuth Providers */}
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleProviderSignIn("google")}
              disabled={isLoading !== null}
            >
              {isLoading === "google" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleProviderSignIn("azure-ad")}
              disabled={isLoading !== null}
            >
              {isLoading === "azure-ad" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Building className="mr-2 h-4 w-4" />
              )}
              Continue with Microsoft 365
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading !== null}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading !== null}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Keep me signed in
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading !== null || !email}
            >
              {isLoading === "email" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send magic link
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}