import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

interface ErrorPageProps {
  searchParams: Promise<{ error?: string }>
}

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An unexpected error occurred. Please try again.",
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams
  const error = params.error as keyof typeof errorMessages
  const message = errorMessages[error] || errorMessages.Default

  return (
    <div 
      className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/images/login-background.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Card className="w-full max-w-md mx-auto bg-white/50 backdrop-blur-md border-slate-300/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-slate-900" role="alert">Authentication Error</CardTitle>
          <CardDescription className="text-slate-700">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
            <Link href="/auth/signin" aria-label="Return to sign in page">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}