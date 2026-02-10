/* ──────────────────────────────────────────
   ESPN API Client – minimal fetch wrapper
   No API key needed. Caches at the Next.js layer.
   ────────────────────────────────────────── */

const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports"
const LEADERS_BASE = "https://site.api.espn.com/apis/site/v3/sports"
const WEB_BASE = "https://site.web.api.espn.com/apis/common/v3/sports"

/**
 * Generic fetch with error handling + timeout
 */
async function espnFetch<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // 1-hour ISR cache at fetch level
    })
    if (!res.ok) {
      throw new Error(`ESPN API ${res.status}: ${url}`)
    }
    return res.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

/* ── Scoreboard ── */
export function fetchMLBScoreboard(date?: string) {
  const dateParam = date ?? todayESPN()
  return espnFetch<Record<string, unknown>>(
    `${SITE_BASE}/baseball/mlb/scoreboard?dates=${dateParam}`
  )
}

/* ── Leaders ── */
export function fetchMLBLeaders() {
  return espnFetch<Record<string, unknown>>(
    `${LEADERS_BASE}/baseball/mlb/leaders`
  )
}

/* ── Team list (cached indefinitely since teams rarely change) ── */
export function fetchMLBTeams() {
  return espnFetch<Record<string, unknown>>(
    `${SITE_BASE}/baseball/mlb/teams`
  )
}

/* ── Athlete overview with stats ── */
export function fetchAthleteOverview(athleteId: string) {
  return espnFetch<Record<string, unknown>>(
    `${WEB_BASE}/baseball/mlb/athletes/${athleteId}/overview`
  )
}

/* ── Athlete game log ── */
export function fetchAthleteGameLog(athleteId: string) {
  return espnFetch<Record<string, unknown>>(
    `${WEB_BASE}/baseball/mlb/athletes/${athleteId}/gamelog`
  )
}

/* ── Game summary (box score level) ── */
export function fetchGameSummary(eventId: string) {
  return espnFetch<Record<string, unknown>>(
    `${SITE_BASE}/baseball/mlb/summary?event=${eventId}`
  )
}

/* ── Helpers ── */
function todayESPN(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}${mm}${dd}`
}
