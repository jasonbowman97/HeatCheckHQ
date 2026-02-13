import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function CheckoutReturnPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Logo className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">HeatCheck.io</span>
          </Link>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground">Welcome to Pro</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Your subscription is active. You now have full access to every dashboard, insight, and tool across MLB, NBA, and NFL.
        </p>

        <Button
          className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
          asChild
        >
          <Link href="/mlb">Explore dashboards</Link>
        </Button>
      </div>
    </div>
  )
}
