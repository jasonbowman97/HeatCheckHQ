import Link from "next/link"
import { BarChart3, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">HeatCheck HQ</span>
          </Link>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          We sent a confirmation link to your email address. Click the link to activate your account and start using HeatCheck HQ.
        </p>

        <Button
          variant="outline"
          className="mt-6 border-border text-foreground hover:bg-secondary"
          asChild
        >
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  )
}
