import { NextResponse } from "next/server"
import { scrapeFirstBasketData } from "@/lib/bettingpros-scraper"
import { getTodayMatchupInsights } from "@/lib/nba-defense-vs-position"
import { getNBAStreakTrends } from "@/lib/nba-streaks"
import { getNBAScoreboard } from "@/lib/nba-api"
import type { BPFirstBasketData } from "@/lib/bettingpros-scraper"
import type { TodayMatchup, MatchupInsight } from "@/lib/nba-defense-vs-position"
import type { Trend } from "@/lib/trends-types"
import type { NBAScheduleGame } from "@/lib/nba-api"

export const dynamic = "force-dynamic"

/* ── Types ── */

interface Tweet {
  type: string
  text: string
  reply: string
  timeSlot: "morning" | "midday" | "pregame" | "engagement" | "educational"
  priority: number
}

/* ── Constants ── */

const NBA_TEAMS = new Set([
  "ATL","BOS","BKN","CHA","CHI","CLE","DAL","DEN","DET","GS",
  "HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NO","NY",
  "OKC","ORL","PHI","PHX","POR","SA","SAC","TOR","UTAH","WSH",
])

/* ── Helpers ── */

function teamSet(games: NBAScheduleGame[]): Set<string> {
  const s = new Set<string>()
  for (const g of games) {
    s.add(g.awayTeam.abbreviation)
    s.add(g.homeTeam.abbreviation)
  }
  return s
}

function gameFor(team: string, games: NBAScheduleGame[]): NBAScheduleGame | undefined {
  return games.find(
    (g) => g.awayTeam.abbreviation === team || g.homeTeam.abbreviation === team
  )
}

function opponentOf(team: string, game: NBAScheduleGame): string {
  return game.awayTeam.abbreviation === team
    ? game.homeTeam.abbreviation
    : game.awayTeam.abbreviation
}

function dots(recentGames: boolean[]): string {
  return recentGames.map((hit) => (hit ? "\u2705" : "\u274c")).join("")
}

/* ── Morning: First Basket + Tipoff ── */

function generateMorningTweets(
  fb: BPFirstBasketData,
  games: NBAScheduleGame[]
): Tweet[] {
  const tweets: Tweet[] = []
  const playing = teamSet(games)

  // 1. Tonight's First Basket probabilities — one top pick per game
  const playersTonight = fb.players
    .filter((p) => p.gamesPlayed >= 10 && playing.has(p.team))
    .map((p) => ({ ...p, fbRate: (p.firstBaskets / p.gamesPlayed) * 100 }))
    .sort((a, b) => b.fbRate - a.fbRate)

  // Best player per game
  const seen = new Set<string>()
  const bestPerGame: (typeof playersTonight)[0][] = []
  for (const p of playersTonight) {
    const g = gameFor(p.team, games)
    if (!g) continue
    const key = [g.awayTeam.abbreviation, g.homeTeam.abbreviation].sort().join("-")
    if (seen.has(key)) continue
    seen.add(key)
    bestPerGame.push(p)
    if (bestPerGame.length >= 6) break
  }

  if (bestPerGame.length >= 2) {
    const lines = bestPerGame.map((p) => {
      const g = gameFor(p.team, games)!
      const opp = opponentOf(p.team, g)
      return `${p.name} (${p.team} vs ${opp}) — ${p.fbRate.toFixed(1)}% FB rate`
    })

    tweets.push({
      type: "first_basket_slate",
      text: `Tonight's First Basket leaders\n\n${lines.join("\n")}\n\nWho are you riding with tonight?`,
      reply: `Full first basket data for every NBA player (100% free)\n\nheatcheckhq.io/nba/first-basket`,
      timeSlot: "morning",
      priority: 1,
    })
  }

  // 2. Tipoff edge — teams winning the tip tonight
  const teamsTonight = fb.teams
    .filter((t) => playing.has(t.team) && t.teamGames >= 10)
    .map((t) => ({ ...t, tipRate: (t.tipoffWins / t.teamGames) * 100 }))
    .sort((a, b) => b.tipRate - a.tipRate)
    .slice(0, 3)

  if (teamsTonight.length >= 2) {
    const lines = teamsTonight.map(
      (t) =>
        `${t.team} — ${t.tipRate.toFixed(0)}% tip win rate (${t.tipoffHome}H/${t.tipoffAway}A)`
    )

    tweets.push({
      type: "tipoff_edge",
      text: `Teams winning the opening tip tonight\n\n${lines.join("\n")}\n\nThe team that wins the tip gets first crack at the first basket. Are you factoring this in?`,
      reply: `See every team's tipoff win rate and first basket stats\n\nheatcheckhq.io/nba/first-basket`,
      timeSlot: "morning",
      priority: 2,
    })
  }

  // 3. Home/away split spotlight
  const homeDominant = playersTonight
    .filter((p) => p.firstBasketHome >= 3 && p.firstBasketAway >= 1)
    .sort((a, b) => b.firstBasketHome / b.gamesPlayed - a.firstBasketHome / a.gamesPlayed)

  const spotlightPlayer = homeDominant[0]
  if (spotlightPlayer) {
    const g = gameFor(spotlightPlayer.team, games)
    const isHome = g?.homeTeam.abbreviation === spotlightPlayer.team

    tweets.push({
      type: "home_away_split",
      text: `${spotlightPlayer.name} first basket splits:\n\nHome: ${spotlightPlayer.firstBasketHome} FBs\nAway: ${spotlightPlayer.firstBasketAway} FBs\n\nTonight: ${isHome ? "HOME" : "AWAY"}\n\nDoes the venue matter for your first basket pick?`,
      reply: `Check home/away splits for every player\n\nheatcheckhq.io/nba/first-basket`,
      timeSlot: "morning",
      priority: 3,
    })
  }

  return tweets
}

/* ── Midday: DVP Mismatches ── */

function generateMiddayTweets(matchups: TodayMatchup[]): Tweet[] {
  const tweets: Tweet[] = []

  // Collect all insights across games, filter to top mismatches (rank <= 3 = top 3 worst defense)
  const topMismatches: (MatchupInsight & { gameTime: string })[] = []
  for (const m of matchups) {
    for (const ins of m.insights) {
      if (ins.rank <= 3 && ins.statCategory === "Points" && ins.playerName) {
        topMismatches.push({ ...ins, gameTime: m.gameTime })
      }
    }
  }
  topMismatches.sort((a, b) => a.rank - b.rank)

  // 1. Tonight's biggest mismatches
  const top3 = topMismatches.slice(0, 3)
  if (top3.length >= 2) {
    const lines = top3.map(
      (m) =>
        `${m.teamAbbr} allows ${m.rankLabel} PTS to ${m.position}s (${m.avgAllowed.toFixed(1)} PPG)\n→ Tonight they face ${m.playerName}`
    )

    tweets.push({
      type: "dvp_mismatch",
      text: `Tonight's biggest DVP mismatches\n\n${lines.join("\n\n")}\n\nWhich mismatch are you targeting?`,
      reply: `Full Defense vs Position rankings for all 30 teams\n\nheatcheckhq.io/nba/defense-vs-position`,
      timeSlot: "midday",
      priority: 1,
    })
  }

  // 2. Position exploit — find which position is most exploitable tonight
  const positionCounts: Record<string, { count: number; players: string[] }> = {}
  for (const m of matchups) {
    for (const ins of m.insights) {
      if (ins.rank <= 5 && ins.statCategory === "Points" && ins.playerName) {
        if (!positionCounts[ins.position]) positionCounts[ins.position] = { count: 0, players: [] }
        positionCounts[ins.position].count++
        if (positionCounts[ins.position].players.length < 3) {
          positionCounts[ins.position].players.push(ins.playerName)
        }
      }
    }
  }

  const bestPosition = Object.entries(positionCounts).sort((a, b) => b[1].count - a[1].count)[0]
  if (bestPosition && bestPosition[1].count >= 2) {
    const [pos, data] = bestPosition

    tweets.push({
      type: "position_exploit",
      text: `${pos} is the position to target tonight\n\n${data.count} games with soft ${pos} defense on the slate\n\nPlayers to watch: ${data.players.join(", ")}\n\nAre you loading up on ${pos} props tonight?`,
      reply: `See which positions have the softest defenses tonight\n\nheatcheckhq.io/nba/defense-vs-position`,
      timeSlot: "midday",
      priority: 2,
    })
  }

  // 3. Single biggest mismatch deep-dive
  if (top3[0]) {
    const m = top3[0]
    tweets.push({
      type: "mismatch_spotlight",
      text: `${m.playerName} has one of the best matchups on the board tonight\n\n${m.teamAbbr} ranks ${m.rank === 1 ? "DEAD LAST" : `#${31 - m.rank}`} defending ${m.position}s — allowing ${m.avgAllowed.toFixed(1)} PPG\n\nThe data is screaming. Are you listening?`,
      reply: `Defense vs Position data updated daily\n\nheatcheckhq.io/nba/defense-vs-position`,
      timeSlot: "midday",
      priority: 3,
    })
  }

  return tweets
}

/* ── Pre-Game: Trends & Streaks ── */

function generatePregameTweets(
  trends: Trend[],
  games: NBAScheduleGame[]
): Tweet[] {
  const tweets: Tweet[] = []
  const playing = teamSet(games)

  // Filter to players playing tonight
  const tonightHot = trends
    .filter((t) => t.type === "hot" && (t.playingToday || playing.has(t.team)))
    .sort((a, b) => b.streakLength - a.streakLength)

  const tonightCold = trends
    .filter((t) => t.type === "cold" && (t.playingToday || playing.has(t.team)))
    .sort((a, b) => b.streakLength - a.streakLength)

  const tonightConsistency = trends
    .filter(
      (t) =>
        t.threshold &&
        t.threshold.hitPct >= 0.7 &&
        (t.playingToday || playing.has(t.team))
    )
    .sort((a, b) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0))

  // 1. Hot player alert
  const hotTop3 = tonightHot.slice(0, 3)
  if (hotTop3.length >= 2) {
    const lines = hotTop3.map((t) => {
      const opp = t.opponent || ""
      return `${t.playerName} (${t.team}${opp ? ` vs ${opp}` : ""}) — ${t.headline}`
    })

    tweets.push({
      type: "hot_players",
      text: `Players on FIRE tonight\n\n${lines.join("\n")}\n\nRide the hot hand or fade the streak? Drop your take`,
      reply: `Track every NBA player's hot and cold streaks\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "pregame",
      priority: 1,
    })
  }

  // 2. Cold player warning
  const coldTop2 = tonightCold.slice(0, 2)
  if (coldTop2.length >= 1) {
    const lines = coldTop2.map((t) => {
      const opp = t.opponent || ""
      return `${t.playerName} (${t.team}${opp ? ` vs ${opp}` : ""}) — ${t.headline}`
    })

    tweets.push({
      type: "cold_players",
      text: `Players struggling tonight\n\n${lines.join("\n")}\n\nDo you fade the slump or bet on the bounce-back?`,
      reply: `See all hot and cold streaks updated daily\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "pregame",
      priority: 2,
    })
  }

  // 3. Prop line consistency
  const consistencyTop3 = tonightConsistency.slice(0, 3)
  if (consistencyTop3.length >= 2) {
    const lines = consistencyTop3.map((t) => {
      const th = t.threshold!
      return `${t.playerName} — OVER ${th.line} ${th.stat} in ${th.hitRate} recent games (${(th.hitPct * 100).toFixed(0)}%)`
    })

    tweets.push({
      type: "prop_consistency",
      text: `Prop lines to watch tonight\n\n${lines.join("\n")}\n\nConsistency is king. Which line are you hammering?`,
      reply: `Prop consistency data for every NBA player\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "pregame",
      priority: 1,
    })
  }

  // 4. Single hot streak spotlight with game dots
  const spotlight = tonightHot.find((t) => t.recentGames.length >= 5)
  if (spotlight) {
    const d = dots(spotlight.recentGames.slice(-10))
    const opp = spotlight.opponent || ""

    tweets.push({
      type: "streak_spotlight",
      text: `${spotlight.playerName} is locked in\n\n${spotlight.headline}\n\nLast 10: ${d}\n${spotlight.statValue} ${spotlight.statLabel}${opp ? `\n\nTonight vs ${opp}` : ""}\n\nDoes the streak continue?`,
      reply: `Full streak breakdown for every player\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "pregame",
      priority: 3,
    })
  }

  return tweets
}

/* ── Engagement: Polls, Debates, Surprises ── */

function generateEngagementTweets(
  fb: BPFirstBasketData,
  trends: Trend[],
  matchups: TodayMatchup[],
  games: NBAScheduleGame[]
): Tweet[] {
  const tweets: Tweet[] = []
  const playing = teamSet(games)

  // 1. "Who You Got?" — 4 first basket candidates tonight
  const candidates = fb.players
    .filter((p) => p.gamesPlayed >= 15 && playing.has(p.team) && p.firstBaskets >= 3)
    .map((p) => ({ ...p, fbRate: (p.firstBaskets / p.gamesPlayed) * 100 }))
    .sort((a, b) => b.fbRate - a.fbRate)
    .slice(0, 4)

  if (candidates.length >= 4) {
    const lines = candidates.map(
      (p) => `${p.name} (${p.team}) — ${p.fbRate.toFixed(1)}%`
    )

    tweets.push({
      type: "who_you_got",
      text: `Tonight's first basket candidates\n\n${lines.join("\n")}\n\nWho you got? Reply with your pick`,
      reply: `See first basket rates for every NBA starter\n\nheatcheckhq.io/nba/first-basket`,
      timeSlot: "engagement",
      priority: 1,
    })
  }

  // 2. Surprise stat — unexpected player high on the list
  const surprises = fb.players
    .filter((p) => p.gamesPlayed >= 15 && p.firstBaskets >= 3 && playing.has(p.team))
    .map((p) => ({ ...p, fbRate: (p.firstBaskets / p.gamesPlayed) * 100 }))
    .sort((a, b) => b.fbRate - a.fbRate)

  // Find a non-star (rank 6-15 in FB rate) who's playing tonight
  const surprise = surprises.slice(5, 15).find((p) => playing.has(p.team))
  if (surprise) {
    tweets.push({
      type: "surprise_stat",
      text: `${surprise.name} has scored the first basket in ${surprise.firstBaskets} of ${surprise.gamesPlayed} games this season (${surprise.fbRate.toFixed(1)}%)\n\nMost people aren't looking at him for first basket bets\n\nShould they be?`,
      reply: `Discover undervalued first basket picks\n\nheatcheckhq.io/nba/first-basket`,
      timeSlot: "engagement",
      priority: 2,
    })
  }

  // 3. This or That — two hot players, who's hotter?
  const hotTonight = trends
    .filter(
      (t) =>
        t.type === "hot" &&
        t.category === "Scoring" &&
        (t.playingToday || playing.has(t.team))
    )
    .sort((a, b) => b.streakLength - a.streakLength)

  if (hotTonight.length >= 2) {
    const a = hotTonight[0]
    const b = hotTonight[1]

    tweets.push({
      type: "this_or_that",
      text: `Who's hotter right now?\n\n${a.playerName} — ${a.headline}\n${a.statValue} ${a.statLabel}\n\nvs\n\n${b.playerName} — ${b.headline}\n${b.statValue} ${b.statLabel}\n\nReply with your pick`,
      reply: `Track every player's hot and cold streaks\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "engagement",
      priority: 2,
    })
  }

  // 4. DVP debate
  const allInsights: MatchupInsight[] = matchups.flatMap((m) => m.insights)
  const worstDefense = allInsights
    .filter((i) => i.rank === 1 && i.statCategory === "Points" && i.playerName)
    .slice(0, 1)[0]

  if (worstDefense) {
    tweets.push({
      type: "dvp_debate",
      text: `${worstDefense.teamAbbr} allows THE MOST points to ${worstDefense.position}s in the NBA (${worstDefense.avgAllowed.toFixed(1)} PPG)\n\nTonight they face ${worstDefense.playerName}\n\nOver or under on his points tonight?`,
      reply: `Full DVP rankings for all 30 NBA teams\n\nheatcheckhq.io/nba/defense-vs-position`,
      timeSlot: "engagement",
      priority: 1,
    })
  }

  return tweets
}

/* ── Educational: Rotating Templates ── */

function generateEducationalTweets(): Tweet[] {
  const day = new Date().getDay() // 0=Sun, 1=Mon, ...
  const tweets: Tweet[] = []

  // Rotate different educational content by day of week
  if (day === 1 || day === 4) {
    // Monday/Thursday: First Basket education
    tweets.push({
      type: "edu_first_basket",
      text: `Most bettors pick first basket scorers based on PPG\n\nBetter approach:\n\n1. Check who wins the opening tip (possession matters)\n2. Look at first shot rate — who actually shoots first\n3. Check home vs away splits\n4. Factor in opponent's defensive pace\n\nWhat's your first basket strategy?`,
      reply: `We track first basket rate, first shot rate, tipoff wins, and home/away splits for every NBA player — 100% free\n\nheatcheckhq.io/nba/first-basket`,
      timeSlot: "educational",
      priority: 1,
    })
  } else if (day === 2 || day === 5) {
    // Tuesday/Friday: DVP education
    tweets.push({
      type: "edu_dvp",
      text: `Defense vs Position (DVP) explained in 30 seconds:\n\nSome defenses are awful at guarding specific positions\n\nIf a team allows 28 PPG to PGs but only 18 PPG to Centers — you want to target the PG in that matchup\n\nMost sportsbooks don't adjust lines fast enough for this\n\nDo you check DVP before locking props?`,
      reply: `DVP rankings for all 30 NBA teams by PG, SG, SF, PF, and C — updated daily, 100% free\n\nheatcheckhq.io/nba/defense-vs-position`,
      timeSlot: "educational",
      priority: 1,
    })
  } else if (day === 3 || day === 6) {
    // Wednesday/Saturday: Streaks education
    tweets.push({
      type: "edu_streaks",
      text: `How to use player streaks for prop betting:\n\nA player scoring 20+ in 7 straight games isn't just "hot"\n\nIt means the OVER on his points prop has hit 7 consecutive times\n\nStreaks don't guarantee anything — but ignoring them means ignoring data\n\nDo you factor streaks into your research?`,
      reply: `Hot and cold streaks for every NBA player with prop line consistency data\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "educational",
      priority: 1,
    })
  } else {
    // Sunday: General value prop
    tweets.push({
      type: "edu_general",
      text: `Most prop research tools cost $20-30/month\n\nHeatCheck HQ gives you:\n\n- First basket data for every player\n- Defense vs Position rankings (PG through C)\n- Hot and cold streaks with prop consistency\n- Head-to-head matchups\n\nAll free. No signup required.\n\nWhat's stopping you from checking it out?`,
      reply: `heatcheckhq.io\n\nFree sports analytics for NBA, MLB, and NFL`,
      timeSlot: "educational",
      priority: 1,
    })
  }

  return tweets
}

/* ── Engagement: Streak Poll ── */

function generateStreakPollTweet(trends: Trend[]): Tweet[] {
  const tweets: Tweet[] = []

  // Find elite streaks across all three categories
  const eliteStreaks = trends
    .filter((t) => t.eliteStreak && t.type === "hot")
    .sort((a, b) => b.streakLength - a.streakLength)
    .slice(0, 4) // Max 4 options for a Twitter poll

  if (eliteStreaks.length >= 3) {
    const options = eliteStreaks.map((t, i) =>
      `${i + 1}. ${t.playerName} — ${t.statLabel} (${t.statValue})`
    )

    tweets.push({
      type: "streak_poll",
      text: `Which of these streaks ends first?\n\n${options.join("\n")}\n\n[CREATE AS POLL]\n\nDrop your pick below 👇`,
      reply: `Track every NBA player's hot and cold streaks — 100% free\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "engagement",
      priority: 1,
    })
  }

  return tweets
}

/* ── No-Games Fallback ── */

function generateOffDayTweets(fb: BPFirstBasketData, trends: Trend[]): Tweet[] {
  const tweets: Tweet[] = []

  // Season leaders
  const seasonLeaders = fb.players
    .filter((p) => p.gamesPlayed >= 20)
    .map((p) => ({ ...p, fbRate: (p.firstBaskets / p.gamesPlayed) * 100 }))
    .sort((a, b) => b.fbRate - a.fbRate)
    .slice(0, 5)

  if (seasonLeaders.length >= 3) {
    const lines = seasonLeaders.map(
      (p, i) => `${i + 1}. ${p.name} (${p.team}) — ${p.fbRate.toFixed(1)}%`
    )

    tweets.push({
      type: "season_leaders",
      text: `Season first basket leaders (min 20 games)\n\n${lines.join("\n")}\n\nAnyone surprise you on this list?`,
      reply: `Full first basket rankings for every NBA player\n\nheatcheckhq.io/nba/first-basket`,
      timeSlot: "engagement",
      priority: 1,
    })
  }

  // Hottest streaks league-wide
  const longestStreaks = trends
    .filter((t) => t.type === "hot")
    .sort((a, b) => b.streakLength - a.streakLength)
    .slice(0, 3)

  if (longestStreaks.length >= 2) {
    const lines = longestStreaks.map(
      (t) => `${t.playerName} (${t.team}) — ${t.headline}`
    )

    tweets.push({
      type: "hottest_streaks",
      text: `The NBA's hottest players right now\n\n${lines.join("\n")}\n\nWho keeps the streak alive next game?`,
      reply: `Track every streak across the NBA\n\nheatcheckhq.io/nba/trends`,
      timeSlot: "engagement",
      priority: 2,
    })
  }

  return tweets
}

/* ── Main Route Handler ── */

export async function GET() {
  try {
    // Fetch all data sources in parallel
    const [fbData, matchups, trends, games] = await Promise.allSettled([
      scrapeFirstBasketData(),
      getTodayMatchupInsights(),
      getNBAStreakTrends(),
      getNBAScoreboard(),
    ])

    const fb = fbData.status === "fulfilled" ? fbData.value : { players: [], teams: [] }
    const dvpMatchups = matchups.status === "fulfilled" ? matchups.value : []
    const streakTrends = trends.status === "fulfilled" ? trends.value : []
    const todayGames = games.status === "fulfilled"
      ? games.value.filter(
          (g) =>
            (g.status === "Scheduled" || g.status === "In Progress") &&
            NBA_TEAMS.has(g.awayTeam.abbreviation) &&
            NBA_TEAMS.has(g.homeTeam.abbreviation)
        )
      : []


    const hasGames = todayGames.length > 0

    let morning: Tweet[] = []
    let midday: Tweet[] = []
    let pregame: Tweet[] = []
    let engagement: Tweet[] = []
    const educational = generateEducationalTweets()

    if (hasGames) {
      morning = generateMorningTweets(fb, todayGames)
      midday = generateMiddayTweets(dvpMatchups)
      pregame = generatePregameTweets(streakTrends, todayGames)
      engagement = [
        ...generateEngagementTweets(fb, streakTrends, dvpMatchups, todayGames),
        ...generateStreakPollTweet(streakTrends),
      ]
    } else {
      // Off day — generate engagement-only content
      engagement = [
        ...generateOffDayTweets(fb, streakTrends),
        ...generateStreakPollTweet(streakTrends),
      ]
    }

    const allTweets = [...morning, ...midday, ...pregame, ...engagement, ...educational]

    return NextResponse.json({
      generated: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      gamesCount: todayGames.length,
      hasGames,
      categories: {
        morning,
        midday,
        pregame,
        engagement,
        educational,
      },
      count: allTweets.length,
      tweets: allTweets,
    })
  } catch (e) {
    console.error("[Social Tweets API]", e)
    return NextResponse.json({ error: "Failed to generate tweets" }, { status: 500 })
  }
}
