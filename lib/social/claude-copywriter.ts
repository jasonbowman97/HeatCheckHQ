/**
 * Claude-powered tweet copy generator.
 * Uses Anthropic's Haiku model to generate engaging, brand-voice tweets
 * for each social cheat sheet graphic.
 */

import Anthropic from "@anthropic-ai/sdk"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface TweetCopy {
  mainTweet: string
  replyTweet: string
  altText: string
  hashtags: string[]
}

interface SheetContext {
  type: string
  date: string
  /** Structured data summary to give Claude context */
  dataSummary: string
}

const SYSTEM_PROMPT = `You are the social media voice of HeatCheck HQ (heatcheckhq.io), a free sports analytics platform. Your tweets accompany daily cheat sheet graphics posted on Twitter/X.

BRAND VOICE:
- Confident, data-backed, conversational — never salesy
- Position as "your daily heat checks" — the edge bettors screenshot and save
- Use emojis sparingly (1-3 per tweet max): 🔥🏀⚾🏈💰📊
- Vary tone: some analytical ("The data says..."), some hype ("This is filthy"), some educational ("Did you know...")
- Never use "Lock of the day" or guarantee language — present data, let users decide
- Always drive engagement with a question or call to action at the end

FORMAT RULES:
- mainTweet: Must be ≤ 270 characters (leave room for emoji). This goes with the cheat sheet image.
- replyTweet: Must be ≤ 270 characters. Self-reply with the link to heatcheckhq.io and a CTA.
- altText: 1-2 sentences describing the image for accessibility.
- hashtags: 2-3 relevant hashtags (without the # symbol).

IMPORTANT:
- Do NOT include links in mainTweet — links go in replyTweet only.
- Do NOT use more than 3 emojis in any single tweet.
- Reference specific data points from the summary — be specific, not generic.
- Each tweet should feel like it could go viral — make people want to save/retweet.`

/**
 * Generate tweet copy for a given cheat sheet using Claude Haiku.
 * Falls back to template-based copy if the API is unavailable.
 */
export async function generateTweetCopy(context: SheetContext): Promise<TweetCopy> {
  if (!ANTHROPIC_API_KEY) {
    console.warn("[claude-copywriter] No ANTHROPIC_API_KEY — using template fallback")
    return templateFallback(context)
  }

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

    const userPrompt = `Generate tweet copy for this ${context.type} cheat sheet (${context.date}):

DATA SUMMARY:
${context.dataSummary}

Return a JSON object with these exact fields:
{
  "mainTweet": "...",
  "replyTweet": "...",
  "altText": "...",
  "hashtags": ["...", "...", "..."]
}

ONLY return the JSON object, no other text.`

    const response = await client.messages.create({
      model: "claude-haiku-4-20250414",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    })

    // Extract text from response
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[claude-copywriter] Failed to parse JSON from response:", text)
      return templateFallback(context)
    }

    const parsed = JSON.parse(jsonMatch[0]) as TweetCopy

    // Validate lengths
    if (parsed.mainTweet.length > 280) {
      parsed.mainTweet = parsed.mainTweet.slice(0, 277) + "..."
    }
    if (parsed.replyTweet.length > 280) {
      parsed.replyTweet = parsed.replyTweet.slice(0, 277) + "..."
    }

    return parsed
  } catch (error) {
    console.error("[claude-copywriter] Error:", error)
    return templateFallback(context)
  }
}

/** Template-based fallback when Claude API is unavailable */
function templateFallback(context: SheetContext): TweetCopy {
  const { type, date } = context

  const templates: Record<string, TweetCopy> = {
    nba_dvp: {
      mainTweet: `🏀 NBA DVP CHEAT SHEET — ${date}\n\nToday's worst defenses by position. Target these matchups.\n\nWho are you building around tonight? 👇`,
      replyTweet: `📊 Free DVP data updated daily → heatcheckhq.io/nba/defense-vs-position\n\nSave this. Screenshot it. Win.`,
      altText: `NBA Defense vs Position cheat sheet for ${date} showing team defensive rankings by position with color-coded severity indicators.`,
      hashtags: ["NBA", "GamblingTwitter", "PlayerProps"],
    },
    nba_parlay: {
      mainTweet: `🏀 NBA PARLAY PIECES — ${date}\n\nThese props have been hitting at elite rates over the last 10 games.\n\nWhat's your lock tonight? 👇`,
      replyTweet: `📊 Free streak data and prop research → heatcheckhq.io/nba/trends\n\nAll data. No paywalls.`,
      altText: `NBA Parlay Pieces cheat sheet for ${date} showing player prop hit rates and recent game trends.`,
      hashtags: ["NBA", "ParlayPicks", "PlayerProps"],
    },
    mlb_nrfi: {
      mainTweet: `⚾ NRFI CHEAT SHEET — ${date}\n\nToday's pitcher matchups ranked by combined NRFI percentage.\n\nWhich game are you riding? 👇`,
      replyTweet: `📊 Free NRFI data updated daily → heatcheckhq.io/mlb/nrfi\n\nNever pay for picks again.`,
      altText: `MLB NRFI cheat sheet for ${date} showing pitcher NRFI rates, streaks, and combined percentages for today's games.`,
      hashtags: ["MLB", "NRFI", "GamblingTwitter"],
    },
    mlb_strikeout: {
      mainTweet: `⚾ STRIKEOUT SHEET — ${date}\n\nToday's pitchers ranked by K rate vs their line.\n\nWho's going over? 👇`,
      replyTweet: `📊 Free MLB analytics → heatcheckhq.io\n\nYour daily edge. Every play.`,
      altText: `MLB Strikeout prop sheet for ${date} showing pitcher K/game averages vs prop lines with over/under verdicts.`,
      hashtags: ["MLB", "Strikeouts", "PlayerProps"],
    },
    daily_recap: {
      mainTweet: `🔥 TODAY'S HEAT CHECK — ${date}\n\nYour daily briefing: best DVP mismatch, hottest streak, top parlay piece, and fade alert.\n\nWhat are you playing? 👇`,
      replyTweet: `📊 Get the full breakdown → heatcheckhq.io\n\nFree. Updated daily. Built for bettors.`,
      altText: `Daily sports recap card for ${date} with DVP mismatch spotlight, hottest streak, parlay piece, and fade alert.`,
      hashtags: ["SportsBetting", "DFS", "GamblingTwitter"],
    },
  }

  return templates[type] || templates.daily_recap
}

/**
 * Generate data summaries for Claude context.
 * These give Claude specific data points to reference in tweets.
 */
export function buildDataSummary(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case "nba_dvp": {
      const rows = data.rows as Array<{
        teamAbbr: string
        position: string
        statCategory: string
        avgAllowed: number
        rank: number
        playerName: string
      }>
      if (!rows?.length) return "No DVP data today."
      const top3 = rows.slice(0, 3)
      return [
        `${rows.length} DVP matchups today.`,
        `Worst defense: ${top3[0].teamAbbr} allows ${top3[0].avgAllowed.toFixed(1)} ${top3[0].statCategory} to ${top3[0].position}s (rank #${top3[0].rank}).`,
        top3[0].playerName ? `Top target: ${top3[0].playerName}.` : "",
        top3.length > 1 ? `Also exploitable: ${top3[1].teamAbbr} vs ${top3[1].position} (${top3[1].avgAllowed.toFixed(1)} ${top3[1].statCategory}).` : "",
      ]
        .filter(Boolean)
        .join(" ")
    }
    case "nba_parlay": {
      const rows = data.rows as Array<{
        playerName: string
        prop: string
        line: number
        hitRate: string
        hitPct: number
      }>
      if (!rows?.length) return "No parlay data today."
      const top3 = rows.slice(0, 3)
      return [
        `${rows.length} high-consistency props today.`,
        `Best: ${top3[0].playerName} ${top3[0].prop} — hitting at ${top3[0].hitRate} (${(top3[0].hitPct * 100).toFixed(0)}%).`,
        top3.length > 1 ? `Also: ${top3[1].playerName} ${top3[1].prop} at ${top3[1].hitRate}.` : "",
        top3.length > 2 ? `And: ${top3[2].playerName} ${top3[2].prop} at ${top3[2].hitRate}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    }
    case "mlb_nrfi": {
      const rows = data.rows as Array<{
        awayTeam: string
        homeTeam: string
        awayPitcher: string
        homePitcher: string
        combinedPct: number
      }>
      if (!rows?.length) return "No NRFI data today."
      const top = rows[0]
      return [
        `${rows.length} NRFI matchups today.`,
        `Best NRFI: ${top.awayTeam} @ ${top.homeTeam} — ${top.awayPitcher} vs ${top.homePitcher} (${top.combinedPct.toFixed(0)}% combined NRFI rate).`,
        rows.length > 1 ? `Runner-up: ${rows[1].awayTeam} @ ${rows[1].homeTeam} (${rows[1].combinedPct.toFixed(0)}%).` : "",
      ]
        .filter(Boolean)
        .join(" ")
    }
    case "mlb_strikeout": {
      const rows = data.rows as Array<{
        pitcher: string
        team: string
        opponent: string
        kPerGame: number
        kLine: number
        trend: string
      }>
      if (!rows?.length) return "No strikeout data today."
      const overs = rows.filter((r) => r.trend === "over")
      const top = rows[0]
      return [
        `${rows.length} pitchers with K props today. ${overs.length} lean OVER.`,
        `Highest K rate: ${top.pitcher} (${top.team}) averaging ${top.kPerGame.toFixed(1)} K/game vs ${top.opponent}.`,
      ].join(" ")
    }
    case "daily_recap": {
      const sections = data.sections as Array<{
        title: string
        playerName: string
        stat: string
        detail: string
      }>
      if (!sections?.length) return "No recap data today."
      return sections.map((s) => `${s.title}: ${s.playerName} — ${s.stat}. ${s.detail}`).join(" | ")
    }
    default:
      return "General sports data summary."
  }
}
