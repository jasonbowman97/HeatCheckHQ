// ============================================================
// convergenceEngine/utils/weather.ts — Weather signal calculator
// ============================================================
// Converts raw weather conditions into a signal strength for MLB and NFL.
// Indoor/dome stadiums always return 0 (no weather effect).
// Wind direction relative to outfield orientation determines
// whether wind is "blowing out" (hitter-friendly) or "blowing in".

import type { Sport } from '@/types/shared'

export interface WeatherData {
  windSpeedMph: number
  windDirection: string        // compass direction: N, NE, E, SE, S, SW, W, NW
  tempF: number
  humidity: number
  condition: string
  isIndoor: boolean
}

// Compass direction to degrees lookup
const DIRECTION_DEGREES: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
}

// Approximate outfield orientation (degrees home plate faces)
// These are static per stadium — compiled from historical data
const MLB_OUTFIELD_ORIENTATION: Record<string, number> = {
  ARI: 0, ATL: 225, BAL: 225, BOS: 200, CHC: 220,
  CWS: 210, CIN: 225, CLE: 175, COL: 230, DET: 195,
  HOU: 0, KC: 180, LAA: 200, LAD: 225, MIA: 0,
  MIL: 0, MIN: 205, NYM: 225, NYY: 195, OAK: 195,
  PHI: 210, PIT: 180, SD: 195, SF: 210, SEA: 0,
  STL: 200, TB: 0, TEX: 0, TOR: 0, WSH: 215,
}

/**
 * Calculate weather signal for a game.
 * Returns a value from -1 (strong under) to +1 (strong over).
 *
 * For MLB: wind direction relative to outfield is critical.
 * For NFL: raw wind speed matters most for passing/receiving.
 */
export function getWeatherSignal(
  weather: WeatherData | null | undefined,
  sport: Sport,
  statType: string,
  homeTeamAbbrev?: string,
): { signal: number; detail: string; dataPoint: string } {
  if (!weather || weather.isIndoor) {
    return {
      signal: 0,
      detail: weather?.isIndoor ? 'Indoor / dome — no weather effect' : 'Weather data unavailable',
      dataPoint: weather?.isIndoor ? 'Dome' : 'N/A',
    }
  }

  let signal = 0
  const details: string[] = []

  // ── WIND ─────────────────────────────────────────────────
  if (sport === 'mlb' && homeTeamAbbrev) {
    const fieldOrientation = MLB_OUTFIELD_ORIENTATION[homeTeamAbbrev] ?? 200
    const windDirDeg = DIRECTION_DEGREES[weather.windDirection] ?? 0
    const effectiveWind = getEffectiveWind(weather.windSpeedMph, windDirDeg, fieldOrientation)

    // Positive effectiveWind = blowing OUT (hitter-friendly)
    if (effectiveWind > 15) { signal += 0.7; details.push('Strong wind blowing out') }
    else if (effectiveWind > 10) { signal += 0.4; details.push('Wind blowing out') }
    else if (effectiveWind > 5) { signal += 0.2; details.push('Mild wind out') }
    else if (effectiveWind < -15) { signal -= 0.8; details.push('Strong wind blowing in') }
    else if (effectiveWind < -10) { signal -= 0.5; details.push('Wind blowing in') }
    else if (effectiveWind < -5) { signal -= 0.2; details.push('Mild wind in') }
  }

  if (sport === 'nfl') {
    const isPassing = ['passing_yards', 'passing_tds', 'completions', 'receiving_yards', 'receptions', 'receiving_tds'].includes(statType)
    const isRushing = ['rushing_yards', 'rushing_tds'].includes(statType)

    if (isPassing) {
      if (weather.windSpeedMph > 30) { signal -= 0.8; details.push('Extreme wind — major passing impact') }
      else if (weather.windSpeedMph > 20) { signal -= 0.5; details.push('High wind — passing suppressed') }
      else if (weather.windSpeedMph > 15) { signal -= 0.25; details.push('Notable wind for passing') }
    }
    if (isRushing && weather.windSpeedMph > 20) {
      signal += 0.3
      details.push('High wind — teams run more')
    }
  }

  // ── TEMPERATURE ─────────────────────────────────────────
  if (sport === 'mlb') {
    if (weather.tempF < 45) { signal -= 0.35; details.push(`Cold (${weather.tempF}F)`) }
    else if (weather.tempF < 55) { signal -= 0.20; details.push(`Cool (${weather.tempF}F)`) }
    else if (weather.tempF > 85) { signal += 0.15; details.push(`Hot (${weather.tempF}F)`) }
  }
  if (sport === 'nfl') {
    if (weather.tempF < 30) { signal -= 0.20; details.push(`Freezing (${weather.tempF}F)`) }
    else if (weather.tempF < 40) { signal -= 0.10; details.push(`Cold (${weather.tempF}F)`) }
  }

  // ── PRECIPITATION ────────────────────────────────────────
  const isRainy = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].some(c =>
    weather.condition.toLowerCase().includes(c.toLowerCase())
  )
  if (isRainy) {
    signal -= sport === 'mlb' ? 0.20 : 0.15
    details.push(weather.condition)
  }

  // Clamp
  signal = Math.max(-1, Math.min(1, signal))

  const windStr = `${weather.windSpeedMph} mph ${weather.windDirection}`
  return {
    signal,
    detail: details.length > 0 ? details.join(' | ') : `${weather.tempF}F, ${windStr} — no significant impact`,
    dataPoint: `${weather.tempF}F | ${windStr}`,
  }
}

/**
 * Effective wind component toward/away from outfield.
 * Positive = blowing out (hitter-friendly).
 */
function getEffectiveWind(speedMph: number, windDirDeg: number, fieldOrientationDeg: number): number {
  const relativeAngle = ((windDirDeg - fieldOrientationDeg) + 360) % 360
  return speedMph * Math.cos((relativeAngle * Math.PI) / 180)
}
