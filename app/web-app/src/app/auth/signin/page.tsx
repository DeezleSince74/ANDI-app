import Link from "next/link"
import Image from "next/image"
import { LoginForm } from "~/components/login-form"

export default function SignInPage() {
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
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium text-slate-100">
          <Image
            src="/andi-logo-192.png"
            alt="ANDI logo"
            width={24}
            height={24}
            className="rounded-md"
          />
          ANDI
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}