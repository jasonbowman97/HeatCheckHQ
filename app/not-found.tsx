import Link from "next/link"
import { Logo } from "@/components/logo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Logo className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">HeatCheck HQ</span>
          </Link>
        </div>

        {/* 404 content */}
        <p className="text-7xl font-bold text-primary font-mono">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Primary CTA */}
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Home
        </Link>

        {/* Sport quick links */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="text-xs text-muted-foreground">Jump to:</span>
          {[
            { href: "/nba/first-basket", label: "NBA" },
            { href: "/mlb/nrfi", label: "MLB" },
            { href: "/nfl/trends", label: "NFL" },
          ].map((sport) => (
            <Link
              key={sport.href}
              href={sport.href}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {sport.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
