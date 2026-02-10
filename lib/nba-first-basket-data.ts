export interface NBAPlayer {
  id: string
  name: string
  team: string
  position: string
  matchup: string
}

export interface FirstBasketStats {
  playerId: string
  gamesStarted: number
  tipWinPct: number
  firstShotPct: number
  firstBasketsMade: number
  firstBasketPerGmPct: number
  firstBasketRank: number
  teamFirstBaskets: number
}

export interface NBAGame {
  id: string
  date: string
  away: string
  home: string
  label: string
}

// Today's NBA schedule
export const todayGames: NBAGame[] = [
  { id: "g1", date: "2026-02-07", away: "SAS", home: "DAL", label: "SAS @ DAL" },
  { id: "g2", date: "2026-02-07", away: "CLE", home: "SAC", label: "CLE @ SAC" },
  { id: "g3", date: "2026-02-07", away: "BKN", home: "WAS", label: "BKN @ WAS" },
  { id: "g4", date: "2026-02-07", away: "DEN", home: "CHI", label: "DEN @ CHI" },
  { id: "g5", date: "2026-02-07", away: "OKC", home: "HOU", label: "OKC @ HOU" },
  { id: "g6", date: "2026-02-07", away: "PHO", home: "PHI", label: "PHO @ PHI" },
]

export const nbaPlayers: NBAPlayer[] = [
  { id: "wemby", name: "V. Wembanyama", team: "SAS", position: "C", matchup: "vs. DAL" },
  { id: "mitchell", name: "D. Mitchell", team: "CLE", position: "G", matchup: "at SAC" },
  { id: "porter", name: "M. Porter Jr.", team: "BKN", position: "F", matchup: "vs. WAS" },
  { id: "jokic", name: "N. Jokic", team: "DEN", position: "C", matchup: "at CHI" },
  { id: "holmgren", name: "C. Holmgren", team: "OKC", position: "F", matchup: "vs. HOU" },
  { id: "murray", name: "J. Murray", team: "DEN", position: "G", matchup: "at CHI" },
  { id: "booker", name: "D. Booker", team: "PHO", position: "G", matchup: "vs. PHI" },
  { id: "sga", name: "S. Gilgeous-Alexander", team: "OKC", position: "G", matchup: "vs. HOU" },
  { id: "garland", name: "D. Garland", team: "CLE", position: "G", matchup: "at SAC" },
  { id: "mobley", name: "E. Mobley", team: "CLE", position: "F", matchup: "at SAC" },
  { id: "bridges", name: "M. Bridges", team: "BKN", position: "F", matchup: "vs. WAS" },
  { id: "allen", name: "J. Allen", team: "CLE", position: "C", matchup: "at SAC" },
  { id: "vassell", name: "D. Vassell", team: "SAS", position: "G", matchup: "vs. DAL" },
  { id: "johnson", name: "K. Johnson", team: "SAS", position: "F", matchup: "vs. DAL" },
  { id: "gordon", name: "A. Gordon", team: "DEN", position: "F", matchup: "at CHI" },
  { id: "durant", name: "K. Durant", team: "PHO", position: "F", matchup: "vs. PHI" },
  { id: "beal", name: "B. Beal", team: "PHO", position: "G", matchup: "vs. PHI" },
  { id: "jalen", name: "J. Williams", team: "OKC", position: "G", matchup: "vs. HOU" },
  { id: "coby", name: "C. White", team: "CHI", position: "G", matchup: "vs. DEN" },
  { id: "lavine", name: "Z. LaVine", team: "CHI", position: "G", matchup: "vs. DEN" },
]

// First basket stats keyed by timeframe
type TimeFrame = "season" | "L10" | "L5"

const seasonStats: Record<string, FirstBasketStats> = {
  wemby:    { playerId: "wemby",    gamesStarted: 28, tipWinPct: 72.5, firstShotPct: 21.4, firstBasketsMade: 3, firstBasketPerGmPct: 10.7, firstBasketRank: 4, teamFirstBaskets: 23 },
  mitchell: { playerId: "mitchell", gamesStarted: 48, tipWinPct: 63.5, firstShotPct: 12.5, firstBasketsMade: 7, firstBasketPerGmPct: 14.6, firstBasketRank: 2, teamFirstBaskets: 32 },
  porter:   { playerId: "porter",   gamesStarted: 40, tipWinPct: 62.0, firstShotPct: 22.5, firstBasketsMade: 9, firstBasketPerGmPct: 22.5, firstBasketRank: 1, teamFirstBaskets: 25 },
  jokic:    { playerId: "jokic",    gamesStarted: 36, tipWinPct: 51.9, firstShotPct: 11.1, firstBasketsMade: 4, firstBasketPerGmPct: 11.1, firstBasketRank: 2, teamFirstBaskets: 26 },
  holmgren: { playerId: "holmgren", gamesStarted: 45, tipWinPct: 55.8, firstShotPct: 13.3, firstBasketsMade: 9, firstBasketPerGmPct: 20.0, firstBasketRank: 1, teamFirstBaskets: 29 },
  murray:   { playerId: "murray",   gamesStarted: 47, tipWinPct: 51.9, firstShotPct: 10.6, firstBasketsMade: 8, firstBasketPerGmPct: 17.0, firstBasketRank: 1, teamFirstBaskets: 26 },
  booker:   { playerId: "booker",   gamesStarted: 39, tipWinPct: 71.2, firstShotPct: 17.9, firstBasketsMade: 7, firstBasketPerGmPct: 17.9, firstBasketRank: 1, teamFirstBaskets: 27 },
  sga:      { playerId: "sga",      gamesStarted: 50, tipWinPct: 55.8, firstShotPct: 18.0, firstBasketsMade: 12, firstBasketPerGmPct: 24.0, firstBasketRank: 1, teamFirstBaskets: 29 },
  garland:  { playerId: "garland",  gamesStarted: 42, tipWinPct: 63.5, firstShotPct: 9.5, firstBasketsMade: 4, firstBasketPerGmPct: 9.5, firstBasketRank: 3, teamFirstBaskets: 32 },
  mobley:   { playerId: "mobley",   gamesStarted: 48, tipWinPct: 63.5, firstShotPct: 8.3, firstBasketsMade: 4, firstBasketPerGmPct: 8.3, firstBasketRank: 4, teamFirstBaskets: 32 },
  bridges:  { playerId: "bridges",  gamesStarted: 40, tipWinPct: 62.0, firstShotPct: 15.0, firstBasketsMade: 6, firstBasketPerGmPct: 15.0, firstBasketRank: 2, teamFirstBaskets: 25 },
  allen:    { playerId: "allen",    gamesStarted: 44, tipWinPct: 63.5, firstShotPct: 6.8, firstBasketsMade: 3, firstBasketPerGmPct: 6.8, firstBasketRank: 5, teamFirstBaskets: 32 },
  vassell:  { playerId: "vassell",  gamesStarted: 30, tipWinPct: 72.5, firstShotPct: 16.7, firstBasketsMade: 5, firstBasketPerGmPct: 16.7, firstBasketRank: 2, teamFirstBaskets: 23 },
  johnson:  { playerId: "johnson",  gamesStarted: 35, tipWinPct: 72.5, firstShotPct: 14.3, firstBasketsMade: 5, firstBasketPerGmPct: 14.3, firstBasketRank: 3, teamFirstBaskets: 23 },
  gordon:   { playerId: "gordon",   gamesStarted: 38, tipWinPct: 51.9, firstShotPct: 7.9, firstBasketsMade: 3, firstBasketPerGmPct: 7.9, firstBasketRank: 3, teamFirstBaskets: 26 },
  durant:   { playerId: "durant",   gamesStarted: 34, tipWinPct: 71.2, firstShotPct: 20.6, firstBasketsMade: 7, firstBasketPerGmPct: 20.6, firstBasketRank: 1, teamFirstBaskets: 27 },
  beal:     { playerId: "beal",     gamesStarted: 32, tipWinPct: 71.2, firstShotPct: 9.4, firstBasketsMade: 3, firstBasketPerGmPct: 9.4, firstBasketRank: 3, teamFirstBaskets: 27 },
  jalen:    { playerId: "jalen",    gamesStarted: 46, tipWinPct: 55.8, firstShotPct: 8.7, firstBasketsMade: 4, firstBasketPerGmPct: 8.7, firstBasketRank: 3, teamFirstBaskets: 29 },
  coby:     { playerId: "coby",     gamesStarted: 41, tipWinPct: 48.8, firstShotPct: 14.6, firstBasketsMade: 6, firstBasketPerGmPct: 14.6, firstBasketRank: 1, teamFirstBaskets: 22 },
  lavine:   { playerId: "lavine",   gamesStarted: 38, tipWinPct: 48.8, firstShotPct: 13.2, firstBasketsMade: 5, firstBasketPerGmPct: 13.2, firstBasketRank: 2, teamFirstBaskets: 22 },
}

const l10Stats: Record<string, FirstBasketStats> = {
  wemby:    { playerId: "wemby",    gamesStarted: 10, tipWinPct: 80.0, firstShotPct: 30.0, firstBasketsMade: 2, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 8 },
  mitchell: { playerId: "mitchell", gamesStarted: 10, tipWinPct: 70.0, firstShotPct: 20.0, firstBasketsMade: 3, firstBasketPerGmPct: 30.0, firstBasketRank: 1, teamFirstBaskets: 7 },
  porter:   { playerId: "porter",   gamesStarted: 10, tipWinPct: 60.0, firstShotPct: 30.0, firstBasketsMade: 3, firstBasketPerGmPct: 30.0, firstBasketRank: 1, teamFirstBaskets: 6 },
  jokic:    { playerId: "jokic",    gamesStarted: 10, tipWinPct: 60.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 3, teamFirstBaskets: 7 },
  holmgren: { playerId: "holmgren", gamesStarted: 10, tipWinPct: 50.0, firstShotPct: 20.0, firstBasketsMade: 3, firstBasketPerGmPct: 30.0, firstBasketRank: 1, teamFirstBaskets: 7 },
  murray:   { playerId: "murray",   gamesStarted: 10, tipWinPct: 60.0, firstShotPct: 10.0, firstBasketsMade: 2, firstBasketPerGmPct: 20.0, firstBasketRank: 1, teamFirstBaskets: 7 },
  booker:   { playerId: "booker",   gamesStarted: 10, tipWinPct: 80.0, firstShotPct: 20.0, firstBasketsMade: 2, firstBasketPerGmPct: 20.0, firstBasketRank: 1, teamFirstBaskets: 7 },
  sga:      { playerId: "sga",      gamesStarted: 10, tipWinPct: 50.0, firstShotPct: 30.0, firstBasketsMade: 4, firstBasketPerGmPct: 40.0, firstBasketRank: 1, teamFirstBaskets: 7 },
  garland:  { playerId: "garland",  gamesStarted: 10, tipWinPct: 70.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 3, teamFirstBaskets: 7 },
  mobley:   { playerId: "mobley",   gamesStarted: 10, tipWinPct: 70.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 4, teamFirstBaskets: 7 },
  bridges:  { playerId: "bridges",  gamesStarted: 10, tipWinPct: 60.0, firstShotPct: 20.0, firstBasketsMade: 2, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 6 },
  allen:    { playerId: "allen",    gamesStarted: 10, tipWinPct: 70.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 5, teamFirstBaskets: 7 },
  vassell:  { playerId: "vassell",  gamesStarted: 10, tipWinPct: 80.0, firstShotPct: 20.0, firstBasketsMade: 2, firstBasketPerGmPct: 20.0, firstBasketRank: 1, teamFirstBaskets: 8 },
  johnson:  { playerId: "johnson",  gamesStarted: 10, tipWinPct: 80.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 3, teamFirstBaskets: 8 },
  gordon:   { playerId: "gordon",   gamesStarted: 10, tipWinPct: 60.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 3, teamFirstBaskets: 7 },
  durant:   { playerId: "durant",   gamesStarted: 10, tipWinPct: 80.0, firstShotPct: 30.0, firstBasketsMade: 3, firstBasketPerGmPct: 30.0, firstBasketRank: 1, teamFirstBaskets: 7 },
  beal:     { playerId: "beal",     gamesStarted: 10, tipWinPct: 80.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 3, teamFirstBaskets: 7 },
  jalen:    { playerId: "jalen",    gamesStarted: 10, tipWinPct: 50.0, firstShotPct: 10.0, firstBasketsMade: 1, firstBasketPerGmPct: 10.0, firstBasketRank: 3, teamFirstBaskets: 7 },
  coby:     { playerId: "coby",     gamesStarted: 10, tipWinPct: 50.0, firstShotPct: 20.0, firstBasketsMade: 2, firstBasketPerGmPct: 20.0, firstBasketRank: 1, teamFirstBaskets: 6 },
  lavine:   { playerId: "lavine",   gamesStarted: 10, tipWinPct: 50.0, firstShotPct: 20.0, firstBasketsMade: 2, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 6 },
}

const l5Stats: Record<string, FirstBasketStats> = {
  wemby:    { playerId: "wemby",    gamesStarted: 5, tipWinPct: 80.0, firstShotPct: 40.0, firstBasketsMade: 2, firstBasketPerGmPct: 40.0, firstBasketRank: 1, teamFirstBaskets: 4 },
  mitchell: { playerId: "mitchell", gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 4 },
  porter:   { playerId: "porter",   gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 40.0, firstBasketsMade: 2, firstBasketPerGmPct: 40.0, firstBasketRank: 1, teamFirstBaskets: 3 },
  jokic:    { playerId: "jokic",    gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 4 },
  holmgren: { playerId: "holmgren", gamesStarted: 5, tipWinPct: 40.0, firstShotPct: 20.0, firstBasketsMade: 2, firstBasketPerGmPct: 40.0, firstBasketRank: 1, teamFirstBaskets: 3 },
  murray:   { playerId: "murray",   gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 1, teamFirstBaskets: 4 },
  booker:   { playerId: "booker",   gamesStarted: 5, tipWinPct: 80.0, firstShotPct: 40.0, firstBasketsMade: 2, firstBasketPerGmPct: 40.0, firstBasketRank: 1, teamFirstBaskets: 4 },
  sga:      { playerId: "sga",      gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 40.0, firstBasketsMade: 3, firstBasketPerGmPct: 60.0, firstBasketRank: 1, teamFirstBaskets: 3 },
  garland:  { playerId: "garland",  gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 0.0, firstBasketsMade: 0, firstBasketPerGmPct: 0.0, firstBasketRank: 5, teamFirstBaskets: 4 },
  mobley:   { playerId: "mobley",   gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 3, teamFirstBaskets: 4 },
  bridges:  { playerId: "bridges",  gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 3 },
  allen:    { playerId: "allen",    gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 0.0, firstBasketsMade: 0, firstBasketPerGmPct: 0.0, firstBasketRank: 5, teamFirstBaskets: 4 },
  vassell:  { playerId: "vassell",  gamesStarted: 5, tipWinPct: 80.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 4 },
  johnson:  { playerId: "johnson",  gamesStarted: 5, tipWinPct: 80.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 4 },
  gordon:   { playerId: "gordon",   gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 0.0, firstBasketsMade: 0, firstBasketPerGmPct: 0.0, firstBasketRank: 4, teamFirstBaskets: 4 },
  durant:   { playerId: "durant",   gamesStarted: 5, tipWinPct: 80.0, firstShotPct: 40.0, firstBasketsMade: 2, firstBasketPerGmPct: 40.0, firstBasketRank: 1, teamFirstBaskets: 4 },
  beal:     { playerId: "beal",     gamesStarted: 5, tipWinPct: 80.0, firstShotPct: 0.0, firstBasketsMade: 0, firstBasketPerGmPct: 0.0, firstBasketRank: 4, teamFirstBaskets: 4 },
  jalen:    { playerId: "jalen",    gamesStarted: 5, tipWinPct: 60.0, firstShotPct: 0.0, firstBasketsMade: 0, firstBasketPerGmPct: 0.0, firstBasketRank: 4, teamFirstBaskets: 3 },
  coby:     { playerId: "coby",     gamesStarted: 5, tipWinPct: 40.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 1, teamFirstBaskets: 3 },
  lavine:   { playerId: "lavine",   gamesStarted: 5, tipWinPct: 40.0, firstShotPct: 20.0, firstBasketsMade: 1, firstBasketPerGmPct: 20.0, firstBasketRank: 2, teamFirstBaskets: 3 },
}

const allStats: Record<TimeFrame, Record<string, FirstBasketStats>> = {
  season: seasonStats,
  L10: l10Stats,
  L5: l5Stats,
}

export function getFirstBasketStats(timeFrame: TimeFrame, playerId: string): FirstBasketStats | undefined {
  return allStats[timeFrame]?.[playerId]
}

export function getAllFirstBasketStats(timeFrame: TimeFrame): FirstBasketStats[] {
  return Object.values(allStats[timeFrame] || seasonStats)
}

export function getHeatmapClass(value: number, min: number, max: number): string {
  if (max === min) return "bg-secondary text-foreground"
  const ratio = (value - min) / (max - min)
  if (ratio >= 0.8) return "bg-emerald-500/20 text-emerald-400"
  if (ratio >= 0.6) return "bg-emerald-500/10 text-emerald-300"
  if (ratio >= 0.4) return "bg-amber-500/10 text-amber-300"
  if (ratio >= 0.2) return "bg-orange-500/10 text-orange-400"
  return "bg-red-500/15 text-red-400"
}

export type { TimeFrame }
