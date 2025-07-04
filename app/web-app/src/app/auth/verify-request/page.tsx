import { CheckCircle, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

export default function VerifyRequestPage() {
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl text-slate-900" role="status" aria-live="polite">Check your email</CardTitle>
          <CardDescription className="text-slate-700">
            We&apos;ve sent you a magic link to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-700">
            <Mail className="h-4 w-4" />
            <span>The link will expire in 24 hours</span>
          </div>
          
          <div className="text-sm text-slate-700">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <Button variant="link" className="p-0 h-auto text-sm text-slate-800 hover:text-slate-900 focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded" asChild>
              <Link href="/auth/signin" aria-label="Return to sign in page to try again">
                try signing in again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}