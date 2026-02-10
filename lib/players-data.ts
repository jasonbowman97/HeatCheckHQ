export interface Player {
  id: string
  name: string
  position: string
  team: string
  abs: number
  avg: number
  slg: number
  xbh: number
  hr: number
  ballsLaunched: number
  exitVelo: number
  barrelPct: number
  hardHitPct: number
  flyBallPct: number
  pulledAirPct: number
}

export interface GameLog {
  date: string
  opponent: string
  pitcher: string
  pitcherHand: "RHP" | "LHP"
  pitchType: string
  result: string
  exitVelo: number
  launchAngle: number
  distance: number
  barrel: boolean
  hardHit: boolean
}

export const players: Player[] = [
  {
    id: "kyle-manzardo",
    name: "Kyle Manzardo",
    position: "L",
    team: "CLE",
    abs: 107,
    avg: 0.309,
    slg: 0.589,
    xbh: 14,
    hr: 8,
    ballsLaunched: 7,
    exitVelo: 93.0,
    barrelPct: 8.41,
    hardHitPct: 46.67,
    flyBallPct: 38.16,
    pulledAirPct: 28.0,
  },
  {
    id: "jose-ramirez",
    name: "Jose Ramirez",
    position: "S",
    team: "CLE",
    abs: 126,
    avg: 0.230,
    slg: 0.444,
    xbh: 12,
    hr: 6,
    ballsLaunched: 6,
    exitVelo: 87.6,
    barrelPct: 4.76,
    hardHitPct: 27.78,
    flyBallPct: 33.33,
    pulledAirPct: 34.26,
  },
  {
    id: "daniel-schneemann",
    name: "Daniel Schneemann",
    position: "L",
    team: "CLE",
    abs: 95,
    avg: 0.232,
    slg: 0.379,
    xbh: 8,
    hr: 3,
    ballsLaunched: 5,
    exitVelo: 94.0,
    barrelPct: 7.37,
    hardHitPct: 61.9,
    flyBallPct: 34.92,
    pulledAirPct: 20.63,
  },
  {
    id: "nolan-jones",
    name: "Nolan Jones",
    position: "L",
    team: "CLE",
    abs: 86,
    avg: 0.233,
    slg: 0.384,
    xbh: 7,
    hr: 3,
    ballsLaunched: 5,
    exitVelo: 92.8,
    barrelPct: 11.63,
    hardHitPct: 50.79,
    flyBallPct: 26.15,
    pulledAirPct: 20.63,
  },
  {
    id: "bo-naylor",
    name: "Bo Naylor",
    position: "L",
    team: "CLE",
    abs: 82,
    avg: 0.195,
    slg: 0.378,
    xbh: 9,
    hr: 3,
    ballsLaunched: 3,
    exitVelo: 91.3,
    barrelPct: 8.54,
    hardHitPct: 52.73,
    flyBallPct: 36.21,
    pulledAirPct: 21.82,
  },
  {
    id: "angel-martinez",
    name: "Angel Martinez",
    position: "S",
    team: "CLE",
    abs: 80,
    avg: 0.150,
    slg: 0.287,
    xbh: 5,
    hr: 2,
    ballsLaunched: 3,
    exitVelo: 87.6,
    barrelPct: 5.0,
    hardHitPct: 29.63,
    flyBallPct: 50.0,
    pulledAirPct: 24.07,
  },
  {
    id: "gabriel-arias",
    name: "Gabriel Arias",
    position: "R",
    team: "CLE",
    abs: 97,
    avg: 0.175,
    slg: 0.299,
    xbh: 6,
    hr: 2,
    ballsLaunched: 4,
    exitVelo: 94.4,
    barrelPct: 8.25,
    hardHitPct: 53.85,
    flyBallPct: 28.85,
    pulledAirPct: 17.31,
  },
  {
    id: "steven-kwan",
    name: "Steven Kwan",
    position: "L",
    team: "CLE",
    abs: 154,
    avg: 0.260,
    slg: 0.370,
    xbh: 10,
    hr: 2,
    ballsLaunched: 1,
    exitVelo: 86.9,
    barrelPct: 0.65,
    hardHitPct: 17.14,
    flyBallPct: 30.56,
    pulledAirPct: 15.0,
  },
  {
    id: "cj-kayfus",
    name: "CJ Kayfus",
    position: "L",
    team: "CLE",
    abs: 52,
    avg: 0.173,
    slg: 0.385,
    xbh: 6,
    hr: 2,
    ballsLaunched: 3,
    exitVelo: 89.9,
    barrelPct: 5.77,
    hardHitPct: 44.44,
    flyBallPct: 37.84,
    pulledAirPct: 16.67,
  },
  {
    id: "george-valera",
    name: "George Valera",
    position: "L",
    team: "CLE",
    abs: 20,
    avg: 0.300,
    slg: 0.650,
    xbh: 4,
    hr: 2,
    ballsLaunched: 1,
    exitVelo: 96.1,
    barrelPct: 5.0,
    hardHitPct: 50.0,
    flyBallPct: 28.57,
    pulledAirPct: 7.14,
  },
]

export const gameLogsMap: Record<string, GameLog[]> = {
  "kyle-manzardo": [
    { date: "9/19/2024", opponent: "vs KC", pitcher: "Ragans", pitcherHand: "RHP", pitchType: "Fastball", result: "HR", exitVelo: 104, launchAngle: 32, distance: 412, barrel: true, hardHit: true },
    { date: "9/19/2024", opponent: "vs KC", pitcher: "Ragans", pitcherHand: "RHP", pitchType: "Slider", result: "Out", exitVelo: 78, launchAngle: 28, distance: 220, barrel: false, hardHit: false },
    { date: "9/19/2024", opponent: "vs KC", pitcher: "Coleman", pitcherHand: "LHP", pitchType: "Changeup", result: "1B", exitVelo: 92, launchAngle: 18, distance: 165, barrel: false, hardHit: true },
    { date: "9/18/2024", opponent: "vs TB", pitcher: "Springs", pitcherHand: "RHP", pitchType: "Fastball", result: "2B", exitVelo: 98, launchAngle: 24, distance: 380, barrel: true, hardHit: true },
    { date: "9/18/2024", opponent: "vs TB", pitcher: "Springs", pitcherHand: "RHP", pitchType: "Curveball", result: "Out", exitVelo: 72, launchAngle: 45, distance: 190, barrel: false, hardHit: false },
    { date: "9/17/2024", opponent: "vs TB", pitcher: "Littell", pitcherHand: "RHP", pitchType: "Sinker", result: "1B", exitVelo: 95, launchAngle: 12, distance: 210, barrel: false, hardHit: true },
    { date: "9/16/2024", opponent: "vs MIN", pitcher: "Ryan", pitcherHand: "RHP", pitchType: "Fastball", result: "HR", exitVelo: 108, launchAngle: 28, distance: 425, barrel: true, hardHit: true },
    { date: "9/16/2024", opponent: "vs MIN", pitcher: "Ryan", pitcherHand: "RHP", pitchType: "Curveball", result: "Out", exitVelo: 85, launchAngle: 35, distance: 280, barrel: false, hardHit: false },
  ],
  "jose-ramirez": [
    { date: "9/19/2024", opponent: "vs KC", pitcher: "Ragans", pitcherHand: "RHP", pitchType: "Slider", result: "HR", exitVelo: 101, launchAngle: 30, distance: 398, barrel: true, hardHit: true },
    { date: "9/19/2024", opponent: "vs KC", pitcher: "Ragans", pitcherHand: "RHP", pitchType: "Fastball", result: "1B", exitVelo: 88, launchAngle: 8, distance: 175, barrel: false, hardHit: false },
    { date: "9/18/2024", opponent: "vs TB", pitcher: "Springs", pitcherHand: "RHP", pitchType: "Changeup", result: "2B", exitVelo: 96, launchAngle: 22, distance: 355, barrel: true, hardHit: true },
    { date: "9/18/2024", opponent: "vs TB", pitcher: "Springs", pitcherHand: "RHP", pitchType: "Fastball", result: "Out", exitVelo: 90, launchAngle: 40, distance: 285, barrel: false, hardHit: true },
    { date: "9/17/2024", opponent: "vs TB", pitcher: "Littell", pitcherHand: "RHP", pitchType: "Sinker", result: "Out", exitVelo: 82, launchAngle: -5, distance: 120, barrel: false, hardHit: false },
    { date: "9/16/2024", opponent: "vs MIN", pitcher: "Ryan", pitcherHand: "RHP", pitchType: "Fastball", result: "HR", exitVelo: 105, launchAngle: 26, distance: 410, barrel: true, hardHit: true },
  ],
  "daniel-schneemann": [
    { date: "9/19/2024", opponent: "vs KC", pitcher: "Ragans", pitcherHand: "RHP", pitchType: "Fastball", result: "1B", exitVelo: 94, launchAngle: 14, distance: 205, barrel: false, hardHit: true },
    { date: "9/18/2024", opponent: "vs TB", pitcher: "Springs", pitcherHand: "RHP", pitchType: "Slider", result: "Out", exitVelo: 76, launchAngle: 32, distance: 195, barrel: false, hardHit: false },
    { date: "9/17/2024", opponent: "vs TB", pitcher: "Littell", pitcherHand: "RHP", pitchType: "Fastball", result: "2B", exitVelo: 99, launchAngle: 20, distance: 365, barrel: true, hardHit: true },
    { date: "9/16/2024", opponent: "vs MIN", pitcher: "Ryan", pitcherHand: "RHP", pitchType: "Curveball", result: "Out", exitVelo: 80, launchAngle: 42, distance: 230, barrel: false, hardHit: false },
  ],
}

// Generate default game logs for players without specific data
const defaultGameLogs: GameLog[] = [
  { date: "9/19/2024", opponent: "vs KC", pitcher: "Ragans", pitcherHand: "RHP", pitchType: "Fastball", result: "Out", exitVelo: 88, launchAngle: 22, distance: 280, barrel: false, hardHit: false },
  { date: "9/18/2024", opponent: "vs TB", pitcher: "Springs", pitcherHand: "RHP", pitchType: "Slider", result: "1B", exitVelo: 93, launchAngle: 10, distance: 195, barrel: false, hardHit: true },
  { date: "9/17/2024", opponent: "vs TB", pitcher: "Littell", pitcherHand: "RHP", pitchType: "Changeup", result: "Out", exitVelo: 75, launchAngle: 38, distance: 210, barrel: false, hardHit: false },
  { date: "9/16/2024", opponent: "vs MIN", pitcher: "Ryan", pitcherHand: "RHP", pitchType: "Fastball", result: "2B", exitVelo: 97, launchAngle: 18, distance: 340, barrel: true, hardHit: true },
]

export function getGameLogs(playerId: string): GameLog[] {
  return gameLogsMap[playerId] || defaultGameLogs
}

// Heatmap color utility: returns a tailwind-compatible bg color class
export function getHeatmapColor(value: number, min: number, max: number): string {
  if (max === min) return "bg-secondary"
  const ratio = (value - min) / (max - min)
  
  if (ratio >= 0.8) return "bg-emerald-500/20 text-emerald-400"
  if (ratio >= 0.6) return "bg-emerald-500/10 text-emerald-300"
  if (ratio >= 0.4) return "bg-amber-500/10 text-amber-300"
  if (ratio >= 0.2) return "bg-orange-500/10 text-orange-300"
  return "bg-red-500/15 text-red-400"
}

export function getResultColor(result: string): string {
  switch (result) {
    case "HR":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "2B":
    case "3B":
      return "bg-sky-500/20 text-sky-400 border-sky-500/30"
    case "1B":
      return "bg-teal-500/20 text-teal-400 border-teal-500/30"
    case "Out":
      return "bg-red-500/15 text-red-400 border-red-500/20"
    default:
      return "bg-secondary text-muted-foreground border-border"
  }
}
