"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { trackEvent } from "@/lib/analytics"

const ONBOARDED_KEY = "hchq-onboarded"

export function isOnboarded(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(ONBOARDED_KEY) === "true"
}

function setOnboarded() {
  if (typeof window !== "undefined") {
    localStorage.setItem(ONBOARDED_KEY, "true")
  }
}

const SPORTS = [
  {
    key: "nba",
    label: "NBA",
    description: "First Basket picks, H2H, Defense vs Position",
    href: "/nba/first-basket",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" />
        <path d="M4.93 4.93c4.08 2.38 8.58 3.73 14.14 1.14" />
        <path d="M4.93 19.07c4.08-2.38 8.58-3.73 14.14-1.14" />
        <path d="M12 2v20" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    key: "mlb",
    label: "MLB",
    description: "NRFI predictions, Hot Hitters, Pitcher matchups",
    href: "/mlb/nrfi",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" />
        <path d="M18.09 5.91c-1.52 1.94-1.83 4.89-.43 7.33 1.4 2.44 3.9 3.57 6.22 3.25" />
        <path d="M5.91 18.09c1.94-1.52 4.89-1.83 7.33-.43 2.44 1.4 3.57 3.9 3.25 6.22" />
      </svg>
    ),
  },
  {
    key: "nfl",
    label: "NFL",
    description: "Matchup analysis, Defense vs Position, Streak Tracker",
    href: "/nfl/defense-vs-position",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
        <path d="M9 9l6 6" />
        <path d="M9 12l3 3" />
        <path d="M12 9l3 3" />
      </svg>
    ),
  },
]

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const router = useRouter()

  function handleSportSelect(sport: (typeof SPORTS)[number]) {
    setOnboarded()
    trackEvent("onboarding_completed", { sport: sport.key })
    onOpenChange(false)
    router.push(sport.href)
  }

  function handleSkip() {
    setOnboarded()
    trackEvent("onboarding_skipped", {})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to HeatCheck HQ</DialogTitle>
          <DialogDescription>
            Pick a sport to jump into your first dashboard, or explore on your own.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {SPORTS.map((sport) => (
            <button
              key={sport.key}
              onClick={() => handleSportSelect(sport)}
              className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-secondary hover:border-primary/30 group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                {sport.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{sport.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sport.description}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSkip}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Explore on my own
        </button>
      </DialogContent>
    </Dialog>
  )
}
