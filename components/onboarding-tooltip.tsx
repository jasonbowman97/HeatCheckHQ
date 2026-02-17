"use client"

import { useState, useEffect } from "react"
import { X, Lightbulb } from "lucide-react"

/** Page-specific tips shown to first-time visitors */
const PAGE_TIPS: Record<string, { title: string; tips: string[] }> = {
  "/mlb/hot-hitters": {
    title: "Hot Hitters Dashboard",
    tips: [
      "Tracks active multi-game hitting, power, and XBH streaks across all rostered MLB batters.",
      "Use the filters to narrow by streak type (hits, HR, XBH) and team.",
      "Players marked 'Today' have a game scheduled — great for same-day prop bets.",
    ],
  },
  "/mlb/hitting-stats": {
    title: "Hitter vs Pitcher Matchups",
    tips: [
      "Select a game from today's schedule, then pick a starting pitcher.",
      "See every opposing batter's career stats against that pitcher's pitch types.",
      "Filter by batter hand (LHH/RHH) and pitch type for targeted analysis.",
    ],
  },
  "/mlb/pitching-stats": {
    title: "Pitching Stats & Arsenal",
    tips: [
      "Deep dive into any pitcher's arsenal — pitch usage, velocity, movement, and results.",
      "CSW% (Called Strike + Whiff %) measures pitch deception.",
      "Compare a pitcher's recent form against their season averages.",
    ],
  },
  "/mlb/nrfi": {
    title: "No Run First Inning (NRFI)",
    tips: [
      "Shows each starting pitcher's record of allowing 0 runs in the 1st inning.",
      "Higher NRFI% = the pitcher usually keeps the 1st inning scoreless.",
      "Combine both starters' NRFI rates for today's best NRFI bet matchups.",
    ],
  },
  "/mlb/weather": {
    title: "Ballpark Weather",
    tips: [
      "Real-time weather for every MLB stadium with games today.",
      "Wind speed/direction, temperature, and humidity all affect ball flight.",
      "Hot + wind out = more home runs. Cold + wind in = pitcher-friendly.",
    ],
  },
  "/mlb/streaks": {
    title: "MLB Streak Tracker",
    tips: [
      "Set custom thresholds for H, HR, RBI, R, SB, TB, and K — see who consistently hits your lines.",
      "Both batters and pitchers are tracked. Pitchers use strikeouts (K) as the key stat.",
      "Adjust the game window (5, 10, 15, or season) to see short-term vs long-term consistency.",
    ],
  },
  "/nba/first-basket": {
    title: "First Basket Picks",
    tips: [
      "Rankings based on first basket %, first shot attempt %, and tipoff win rate.",
      "Composite score weighs all factors — higher is better for first basket props.",
      "Filter by minimum games played to remove small-sample flukes.",
    ],
  },
  "/nba/head-to-head": {
    title: "Team Head-to-Head",
    tips: [
      "Pick two teams to see their season series history and momentum.",
      "Includes injury reports for both teams — key for spread and total bets.",
      "Recent form (last 10 games) often matters more than season-long stats.",
    ],
  },
  "/nba/defense-vs-position": {
    title: "Defense vs Position",
    tips: [
      "Shows how each team defends against specific positions (PG, SG, SF, PF, C).",
      "Green = that defense is weak (good matchup for the player). Red = tough defense.",
      "Great for player prop research — find soft matchups for points, rebounds, assists.",
    ],
  },
  "/nba/streaks": {
    title: "NBA Streak Tracker",
    tips: [
      "Set custom thresholds for PTS, REB, AST, 3PM, STL, BLK — see who consistently hits your lines.",
      "Use the game window selector to compare last 5, 10, 15, or full season consistency.",
      "Filter by team, search for a player, or toggle 'Playing Today' to find tonight's best bets.",
    ],
  },
  "/nfl/matchup": {
    title: "NFL Matchup Analysis",
    tips: [
      "Full stat comparison between two NFL teams — offense, defense, and special teams.",
      "Player-level breakdowns for passing, rushing, and receiving leaders.",
      "Use spread/total context to frame your matchup analysis.",
    ],
  },
  "/nfl/defense-vs-position": {
    title: "NFL Defense vs Position",
    tips: [
      "See which defenses are weakest against QB, RB, and WR.",
      "Helpful for identifying soft matchups for rushing or passing props.",
      "Rankings update throughout the season as games are played.",
    ],
  },
  "/nfl/streaks": {
    title: "NFL Streak Tracker",
    tips: [
      "Set custom thresholds for Pass YD, Pass TD, Rush YD, Rush TD, Rec YD, REC, Rec TD.",
      "Top 30 QBs, RBs, and WRs by season stats are tracked with full game logs.",
      "Adjust the game window to see short-term hot streaks or season-long consistency.",
    ],
  },
}

const STORAGE_KEY = "hchq-onboarding-dismissed"

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function setDismissed(pages: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pages]))
  } catch {
    // localStorage may be unavailable
  }
}

export function OnboardingTooltip({ pathname }: { pathname: string }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissedState] = useState<Set<string>>(new Set())

  useEffect(() => {
    const d = getDismissed()
    setDismissedState(d)
    // Show if this page hasn't been dismissed
    if (!d.has(pathname) && PAGE_TIPS[pathname]) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  const tips = PAGE_TIPS[pathname]
  if (!tips || !visible) return null

  const handleDismiss = () => {
    setVisible(false)
    const updated = new Set(dismissed)
    updated.add(pathname)
    setDismissedState(updated)
    setDismissed(updated)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 mt-2">
      <div className="relative rounded-xl border border-primary/20 bg-primary/5 p-4 pr-10">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Dismiss tips"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">
              {tips.title}
            </h3>
            <ul className="space-y-1">
              {tips.tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-primary/60 shrink-0">&#8226;</span>
                  {tip}
                </li>
              ))}
            </ul>
            <button
              onClick={handleDismiss}
              className="mt-2.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Got it, don&apos;t show again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
