import { NextResponse } from "next/server"
import { scrapeFirstBasketData } from "@/lib/bettingpros-scraper"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await scrapeFirstBasketData()
    const players = data.players || []

    // Sort by first basket rate (firstBaskets / gamesPlayed)
    const ranked = players
      .filter((p) => p.gamesPlayed >= 10)
      .map((p) => ({
        ...p,
        fbRate: p.gamesPlayed > 0 ? (p.firstBaskets / p.gamesPlayed) * 100 : 0,
        fsRate: p.gamesPlayed > 0 ? (p.firstShots / p.gamesPlayed) * 100 : 0,
      }))
      .sort((a, b) => b.fbRate - a.fbRate)

    const top5 = ranked.slice(0, 5)
    const topPlayer = top5[0]

    const tweets: { type: string; text: string }[] = []

    // Tweet 1: Daily First Basket leaders
    if (top5.length > 0) {
      const leaderboard = top5
        .map((p, i) => `${i + 1}. ${p.name} (${p.team}) — ${p.fbRate.toFixed(1)}%`)
        .join("\n")

      tweets.push({
        type: "first_basket_leaders",
        text: `🏀 First Basket Leaders (min 10 games)\n\n${leaderboard}\n\nFull breakdown + every player → heatcheckhq.io/nba/first-basket\n\n#NBA #NBABets #PlayerProps #FirstBasket`,
      })
    }

    // Tweet 2: Top player spotlight
    if (topPlayer) {
      tweets.push({
        type: "player_spotlight",
        text: `${topPlayer.name} has scored the first basket in ${topPlayer.firstBaskets} of ${topPlayer.gamesPlayed} games this season (${topPlayer.fbRate.toFixed(1)}%)\n\nHome: ${topPlayer.firstBasketHome} | Away: ${topPlayer.firstBasketAway}\n\nTrack every player's first basket stats → heatcheckhq.io/nba/first-basket\n\n#NBA #FirstBasket #PlayerProps`,
      })
    }

    // Tweet 3: First shot leaders (different angle)
    const topShooters = [...ranked].sort((a, b) => b.fsRate - a.fsRate).slice(0, 3)
    if (topShooters.length > 0) {
      const list = topShooters
        .map((p) => `${p.name} — ${p.fsRate.toFixed(1)}% first shot rate`)
        .join("\n")

      tweets.push({
        type: "first_shot_leaders",
        text: `Who takes the first shot most often?\n\n${list}\n\nFirst shot ≠ first basket, but it matters for your props.\n\nAll data free → heatcheckhq.io/nba/first-basket\n\n#NBA #NBABets #SportsBetting`,
      })
    }

    // Tweet 4: Educational / engagement
    tweets.push({
      type: "educational",
      text: `Most bettors pick first basket scorers based on PPG.\n\nBetter approach: look at who actually takes — and makes — the first shot.\n\nWe track first basket rate, first shot rate, home/away splits for every player.\n\n100% free → heatcheckhq.io/nba/first-basket\n\n#NBA #SportsBetting`,
    })

    // Tweet 5: DVP teaser
    tweets.push({
      type: "dvp_teaser",
      text: `Before locking in player props tonight, check which defenses are giving up the most points by position.\n\nOur Defense vs Position dashboard ranks all 30 teams by PG, SG, SF, PF, C.\n\nFree — no signup needed → heatcheckhq.io/nba/defense-vs-position\n\n#NBA #NBABets #DVP #PlayerProps`,
    })

    return NextResponse.json({
      generated: new Date().toISOString(),
      count: tweets.length,
      tweets,
    })
  } catch (e) {
    console.error("[Social Tweets API]", e)
    return NextResponse.json({ error: "Failed to generate tweets" }, { status: 500 })
  }
}
