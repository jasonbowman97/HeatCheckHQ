export interface PitchArsenal {
  pitchType: string
  usagePct: number
  avgVelocity: number
}

export interface Pitcher {
  id: string
  name: string
  team: string
  hand: "R" | "L"
  arsenal: PitchArsenal[]
}

export interface TodayMatchup {
  opponent: string
  opponentAbbr: string
  gameTime: string
  probablePitcher: Pitcher
}

export interface BatterVsPitchStats {
  pitchType: string
  pitcherHand: "R" | "L"
  abs: number
  avg: number
  slg: number
  xbh: number
  hr: number
  exitVelo: number
  barrelPct: number
  hardHitPct: number
  flyBallPct: number
  pulledAirPct: number
}

// Probable pitchers CLE could face
export const pitchers: Pitcher[] = [
  {
    id: "cole-ragans",
    name: "Cole Ragans",
    team: "KC",
    hand: "L",
    arsenal: [
      { pitchType: "Four-Seam Fastball", usagePct: 38.2, avgVelocity: 95.1 },
      { pitchType: "Changeup", usagePct: 22.5, avgVelocity: 87.4 },
      { pitchType: "Slider", usagePct: 21.8, avgVelocity: 85.2 },
      { pitchType: "Curveball", usagePct: 14.1, avgVelocity: 79.6 },
      { pitchType: "Sinker", usagePct: 3.4, avgVelocity: 94.3 },
    ],
  },
  {
    id: "ryan-bergert",
    name: "Ryan Bergert",
    team: "KC",
    hand: "R",
    arsenal: [
      { pitchType: "Four-Seam Fastball", usagePct: 42.1, avgVelocity: 94.8 },
      { pitchType: "Slider", usagePct: 28.6, avgVelocity: 84.1 },
      { pitchType: "Changeup", usagePct: 18.3, avgVelocity: 86.7 },
      { pitchType: "Curveball", usagePct: 11.0, avgVelocity: 78.2 },
    ],
  },
  {
    id: "seth-lugo",
    name: "Seth Lugo",
    team: "KC",
    hand: "R",
    arsenal: [
      { pitchType: "Four-Seam Fastball", usagePct: 30.5, avgVelocity: 93.2 },
      { pitchType: "Sinker", usagePct: 22.8, avgVelocity: 92.6 },
      { pitchType: "Slider", usagePct: 19.4, avgVelocity: 86.3 },
      { pitchType: "Sweeper", usagePct: 15.1, avgVelocity: 81.5 },
      { pitchType: "Curveball", usagePct: 8.7, avgVelocity: 76.9 },
      { pitchType: "Changeup", usagePct: 3.5, avgVelocity: 85.1 },
    ],
  },
]

// Today's matchup
export function getTodayMatchup(): TodayMatchup {
  return {
    opponent: "Kansas City Royals",
    opponentAbbr: "KC",
    gameTime: "7:10 PM ET",
    probablePitcher: pitchers[0], // Cole Ragans
  }
}

// Available pitchers for the opponent (for dropdown)
export function getOpponentPitchers(teamAbbr: string): Pitcher[] {
  return pitchers.filter((p) => p.team === teamAbbr)
}

// Batter vs pitch type stats, broken down by pitcher hand
// Key: playerId -> BatterVsPitchStats[]
export const batterVsPitchStats: Record<string, BatterVsPitchStats[]> = {
  "kyle-manzardo": [
    // vs RHP
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 42, avg: 0.310, slg: 0.643, xbh: 6, hr: 4, exitVelo: 94.8, barrelPct: 11.2, hardHitPct: 52.1, flyBallPct: 40.2, pulledAirPct: 32.0 },
    { pitchType: "Slider", pitcherHand: "R", abs: 24, slg: 0.458, avg: 0.200, xbh: 2, hr: 1, exitVelo: 89.4, barrelPct: 6.3, hardHitPct: 38.5, flyBallPct: 35.7, pulledAirPct: 24.1 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 18, slg: 0.556, avg: 0.278, xbh: 2, hr: 2, exitVelo: 92.1, barrelPct: 9.1, hardHitPct: 48.3, flyBallPct: 42.1, pulledAirPct: 30.5 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 15, slg: 0.467, avg: 0.200, xbh: 2, hr: 1, exitVelo: 88.2, barrelPct: 5.4, hardHitPct: 35.2, flyBallPct: 33.8, pulledAirPct: 22.8 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 8, slg: 0.750, avg: 0.375, xbh: 2, hr: 0, exitVelo: 95.6, barrelPct: 12.5, hardHitPct: 55.0, flyBallPct: 30.0, pulledAirPct: 25.0 },
    // vs LHP
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 28, slg: 0.536, avg: 0.250, xbh: 2, hr: 2, exitVelo: 92.3, barrelPct: 7.8, hardHitPct: 42.5, flyBallPct: 36.1, pulledAirPct: 28.5 },
    { pitchType: "Slider", pitcherHand: "L", abs: 14, slg: 0.357, avg: 0.143, xbh: 2, hr: 0, exitVelo: 86.1, barrelPct: 3.5, hardHitPct: 28.6, flyBallPct: 30.0, pulledAirPct: 18.2 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 12, slg: 0.583, avg: 0.333, xbh: 2, hr: 1, exitVelo: 93.8, barrelPct: 10.2, hardHitPct: 50.0, flyBallPct: 45.0, pulledAirPct: 35.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 8, slg: 0.375, avg: 0.125, xbh: 2, hr: 0, exitVelo: 85.5, barrelPct: 2.5, hardHitPct: 25.0, flyBallPct: 28.0, pulledAirPct: 15.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 5, slg: 0.600, avg: 0.200, xbh: 2, hr: 0, exitVelo: 91.0, barrelPct: 8.0, hardHitPct: 40.0, flyBallPct: 25.0, pulledAirPct: 20.0 },
  ],
  "jose-ramirez": [
    // vs RHP
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 48, slg: 0.521, avg: 0.271, xbh: 2, hr: 3, exitVelo: 89.2, barrelPct: 5.8, hardHitPct: 32.4, flyBallPct: 35.6, pulledAirPct: 38.2 },
    { pitchType: "Slider", pitcherHand: "R", abs: 32, slg: 0.375, avg: 0.156, xbh: 2, hr: 1, exitVelo: 85.6, barrelPct: 3.2, hardHitPct: 22.1, flyBallPct: 30.5, pulledAirPct: 32.4 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 22, slg: 0.500, avg: 0.227, xbh: 2, hr: 1, exitVelo: 88.8, barrelPct: 5.5, hardHitPct: 30.0, flyBallPct: 36.8, pulledAirPct: 36.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 16, slg: 0.313, avg: 0.125, xbh: 2, hr: 0, exitVelo: 83.4, barrelPct: 2.1, hardHitPct: 18.8, flyBallPct: 28.0, pulledAirPct: 25.5 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 8, slg: 0.500, avg: 0.250, xbh: 2, hr: 1, exitVelo: 90.5, barrelPct: 6.0, hardHitPct: 35.0, flyBallPct: 32.0, pulledAirPct: 40.0 },
    // vs LHP (switch hitter - bats R vs LHP)
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 38, slg: 0.474, avg: 0.211, xbh: 2, hr: 2, exitVelo: 88.1, barrelPct: 4.5, hardHitPct: 28.3, flyBallPct: 32.4, pulledAirPct: 35.1 },
    { pitchType: "Slider", pitcherHand: "L", abs: 20, slg: 0.400, avg: 0.200, xbh: 2, hr: 1, exitVelo: 86.9, barrelPct: 4.8, hardHitPct: 25.5, flyBallPct: 34.0, pulledAirPct: 30.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 15, slg: 0.467, avg: 0.200, xbh: 2, hr: 0, exitVelo: 87.5, barrelPct: 3.8, hardHitPct: 26.7, flyBallPct: 30.0, pulledAirPct: 33.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 10, slg: 0.300, avg: 0.100, xbh: 2, hr: 0, exitVelo: 82.0, barrelPct: 2.0, hardHitPct: 15.0, flyBallPct: 25.0, pulledAirPct: 28.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 5, slg: 0.600, avg: 0.200, xbh: 2, hr: 0, exitVelo: 89.0, barrelPct: 5.0, hardHitPct: 40.0, flyBallPct: 35.0, pulledAirPct: 42.0 },
  ],
  "daniel-schneemann": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 35, slg: 0.429, avg: 0.171, xbh: 2, hr: 1, exitVelo: 95.2, barrelPct: 8.5, hardHitPct: 65.3, flyBallPct: 36.0, pulledAirPct: 22.4 },
    { pitchType: "Slider", pitcherHand: "R", abs: 22, slg: 0.318, avg: 0.136, xbh: 2, hr: 1, exitVelo: 92.8, barrelPct: 6.2, hardHitPct: 58.1, flyBallPct: 32.5, pulledAirPct: 18.5 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 16, slg: 0.375, avg: 0.125, xbh: 2, hr: 0, exitVelo: 93.4, barrelPct: 7.0, hardHitPct: 62.0, flyBallPct: 35.0, pulledAirPct: 20.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 14, slg: 0.357, avg: 0.143, xbh: 2, hr: 1, exitVelo: 91.5, barrelPct: 6.8, hardHitPct: 55.0, flyBallPct: 38.0, pulledAirPct: 22.0 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 8, slg: 0.500, avg: 0.250, xbh: 2, hr: 0, exitVelo: 96.0, barrelPct: 10.0, hardHitPct: 70.0, flyBallPct: 30.0, pulledAirPct: 18.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 22, slg: 0.409, avg: 0.182, xbh: 2, hr: 1, exitVelo: 93.8, barrelPct: 7.2, hardHitPct: 60.5, flyBallPct: 34.0, pulledAirPct: 20.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 12, slg: 0.333, avg: 0.167, xbh: 2, hr: 0, exitVelo: 91.5, barrelPct: 5.5, hardHitPct: 50.0, flyBallPct: 30.0, pulledAirPct: 16.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 10, slg: 0.400, avg: 0.200, xbh: 2, hr: 0, exitVelo: 94.0, barrelPct: 8.0, hardHitPct: 65.0, flyBallPct: 38.0, pulledAirPct: 22.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 6, slg: 0.333, avg: 0.167, xbh: 2, hr: 0, exitVelo: 90.0, barrelPct: 5.0, hardHitPct: 50.0, flyBallPct: 32.0, pulledAirPct: 18.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 3, slg: 0.667, avg: 0.333, xbh: 2, hr: 0, exitVelo: 95.0, barrelPct: 12.0, hardHitPct: 75.0, flyBallPct: 28.0, pulledAirPct: 15.0 },
  ],
  "nolan-jones": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 30, slg: 0.433, avg: 0.167, xbh: 2, hr: 1, exitVelo: 93.5, barrelPct: 12.8, hardHitPct: 54.2, flyBallPct: 28.0, pulledAirPct: 22.5 },
    { pitchType: "Slider", pitcherHand: "R", abs: 20, slg: 0.350, avg: 0.150, xbh: 2, hr: 1, exitVelo: 91.2, barrelPct: 10.5, hardHitPct: 48.0, flyBallPct: 25.0, pulledAirPct: 20.0 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 15, slg: 0.400, avg: 0.133, xbh: 2, hr: 0, exitVelo: 92.0, barrelPct: 11.0, hardHitPct: 50.0, flyBallPct: 24.0, pulledAirPct: 18.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 12, slg: 0.333, avg: 0.083, xbh: 2, hr: 0, exitVelo: 89.5, barrelPct: 8.5, hardHitPct: 42.0, flyBallPct: 22.0, pulledAirPct: 15.0 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 9, slg: 0.444, avg: 0.222, xbh: 2, hr: 1, exitVelo: 94.8, barrelPct: 14.0, hardHitPct: 58.0, flyBallPct: 30.0, pulledAirPct: 25.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 20, slg: 0.350, avg: 0.100, xbh: 2, hr: 0, exitVelo: 91.0, barrelPct: 9.0, hardHitPct: 45.0, flyBallPct: 26.0, pulledAirPct: 18.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 12, slg: 0.333, avg: 0.083, xbh: 2, hr: 0, exitVelo: 89.5, barrelPct: 7.0, hardHitPct: 40.0, flyBallPct: 22.0, pulledAirPct: 14.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 8, slg: 0.375, avg: 0.125, xbh: 2, hr: 0, exitVelo: 90.5, barrelPct: 8.0, hardHitPct: 42.0, flyBallPct: 20.0, pulledAirPct: 12.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 6, slg: 0.167, avg: 0.000, xbh: 2, hr: 0, exitVelo: 85.0, barrelPct: 3.0, hardHitPct: 25.0, flyBallPct: 18.0, pulledAirPct: 10.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 4, slg: 0.500, avg: 0.250, xbh: 2, hr: 0, exitVelo: 93.0, barrelPct: 12.0, hardHitPct: 55.0, flyBallPct: 28.0, pulledAirPct: 20.0 },
  ],
  "bo-naylor": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 28, slg: 0.429, avg: 0.214, xbh: 2, hr: 1, exitVelo: 92.0, barrelPct: 9.5, hardHitPct: 56.0, flyBallPct: 38.0, pulledAirPct: 24.0 },
    { pitchType: "Slider", pitcherHand: "R", abs: 18, slg: 0.333, avg: 0.167, xbh: 2, hr: 1, exitVelo: 89.5, barrelPct: 7.2, hardHitPct: 48.0, flyBallPct: 34.0, pulledAirPct: 20.0 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 14, slg: 0.357, avg: 0.143, xbh: 2, hr: 0, exitVelo: 90.8, barrelPct: 8.0, hardHitPct: 52.0, flyBallPct: 36.0, pulledAirPct: 22.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 12, slg: 0.417, avg: 0.167, xbh: 2, hr: 1, exitVelo: 91.5, barrelPct: 9.0, hardHitPct: 54.0, flyBallPct: 40.0, pulledAirPct: 25.0 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 10, slg: 0.400, avg: 0.200, xbh: 2, hr: 0, exitVelo: 93.0, barrelPct: 10.0, hardHitPct: 58.0, flyBallPct: 32.0, pulledAirPct: 18.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 18, slg: 0.389, avg: 0.167, xbh: 2, hr: 1, exitVelo: 90.5, barrelPct: 7.5, hardHitPct: 50.0, flyBallPct: 35.0, pulledAirPct: 20.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 10, slg: 0.300, avg: 0.100, xbh: 2, hr: 0, exitVelo: 87.0, barrelPct: 5.0, hardHitPct: 40.0, flyBallPct: 30.0, pulledAirPct: 16.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 8, slg: 0.375, avg: 0.125, xbh: 2, hr: 0, exitVelo: 89.0, barrelPct: 6.0, hardHitPct: 45.0, flyBallPct: 32.0, pulledAirPct: 18.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 6, slg: 0.333, avg: 0.167, xbh: 2, hr: 0, exitVelo: 88.0, barrelPct: 5.5, hardHitPct: 42.0, flyBallPct: 28.0, pulledAirPct: 14.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 4, slg: 0.500, avg: 0.250, xbh: 2, hr: 0, exitVelo: 92.0, barrelPct: 10.0, hardHitPct: 60.0, flyBallPct: 30.0, pulledAirPct: 16.0 },
  ],
  "angel-martinez": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 30, slg: 0.333, avg: 0.167, xbh: 2, hr: 1, exitVelo: 88.5, barrelPct: 5.5, hardHitPct: 32.0, flyBallPct: 52.0, pulledAirPct: 26.0 },
    { pitchType: "Slider", pitcherHand: "R", abs: 18, slg: 0.222, avg: 0.111, xbh: 2, hr: 0, exitVelo: 85.2, barrelPct: 3.8, hardHitPct: 24.0, flyBallPct: 48.0, pulledAirPct: 22.0 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 14, slg: 0.286, avg: 0.143, xbh: 2, hr: 1, exitVelo: 87.0, barrelPct: 5.0, hardHitPct: 28.0, flyBallPct: 50.0, pulledAirPct: 24.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 10, slg: 0.200, avg: 0.100, xbh: 2, hr: 0, exitVelo: 83.5, barrelPct: 3.0, hardHitPct: 20.0, flyBallPct: 46.0, pulledAirPct: 20.0 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 8, slg: 0.375, avg: 0.125, xbh: 2, hr: 0, exitVelo: 90.0, barrelPct: 6.0, hardHitPct: 38.0, flyBallPct: 55.0, pulledAirPct: 30.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 22, slg: 0.318, avg: 0.136, xbh: 2, hr: 0, exitVelo: 87.0, barrelPct: 4.5, hardHitPct: 28.0, flyBallPct: 50.0, pulledAirPct: 22.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 12, slg: 0.250, avg: 0.083, xbh: 2, hr: 0, exitVelo: 84.0, barrelPct: 3.0, hardHitPct: 22.0, flyBallPct: 45.0, pulledAirPct: 18.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 8, slg: 0.375, avg: 0.250, xbh: 2, hr: 1, exitVelo: 89.0, barrelPct: 6.0, hardHitPct: 35.0, flyBallPct: 55.0, pulledAirPct: 28.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 6, slg: 0.167, avg: 0.000, xbh: 2, hr: 0, exitVelo: 82.0, barrelPct: 2.0, hardHitPct: 15.0, flyBallPct: 42.0, pulledAirPct: 15.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 4, slg: 0.500, avg: 0.250, xbh: 2, hr: 0, exitVelo: 88.5, barrelPct: 5.5, hardHitPct: 40.0, flyBallPct: 48.0, pulledAirPct: 25.0 },
  ],
  "gabriel-arias": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 36, slg: 0.333, avg: 0.139, xbh: 2, hr: 1, exitVelo: 95.0, barrelPct: 9.0, hardHitPct: 56.0, flyBallPct: 30.0, pulledAirPct: 18.0 },
    { pitchType: "Slider", pitcherHand: "R", abs: 24, slg: 0.250, avg: 0.083, xbh: 2, hr: 0, exitVelo: 93.0, barrelPct: 7.0, hardHitPct: 50.0, flyBallPct: 26.0, pulledAirPct: 15.0 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 16, slg: 0.313, avg: 0.125, xbh: 2, hr: 1, exitVelo: 94.5, barrelPct: 8.5, hardHitPct: 55.0, flyBallPct: 32.0, pulledAirPct: 20.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 12, slg: 0.250, avg: 0.083, xbh: 2, hr: 0, exitVelo: 92.0, barrelPct: 6.5, hardHitPct: 48.0, flyBallPct: 28.0, pulledAirPct: 16.0 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 9, slg: 0.333, avg: 0.222, xbh: 2, hr: 0, exitVelo: 96.5, barrelPct: 11.0, hardHitPct: 62.0, flyBallPct: 25.0, pulledAirPct: 14.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 24, slg: 0.292, avg: 0.125, xbh: 2, hr: 0, exitVelo: 93.5, barrelPct: 7.5, hardHitPct: 52.0, flyBallPct: 28.0, pulledAirPct: 16.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 14, slg: 0.214, avg: 0.071, xbh: 2, hr: 0, exitVelo: 91.0, barrelPct: 5.5, hardHitPct: 45.0, flyBallPct: 24.0, pulledAirPct: 12.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 10, slg: 0.300, avg: 0.100, xbh: 2, hr: 0, exitVelo: 93.0, barrelPct: 7.0, hardHitPct: 50.0, flyBallPct: 30.0, pulledAirPct: 18.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 6, slg: 0.167, avg: 0.000, xbh: 2, hr: 0, exitVelo: 88.0, barrelPct: 4.0, hardHitPct: 35.0, flyBallPct: 22.0, pulledAirPct: 10.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 5, slg: 0.400, avg: 0.200, xbh: 2, hr: 0, exitVelo: 95.0, barrelPct: 10.0, hardHitPct: 58.0, flyBallPct: 24.0, pulledAirPct: 12.0 },
  ],
  "steven-kwan": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 56, slg: 0.411, avg: 0.125, xbh: 2, hr: 1, exitVelo: 87.5, barrelPct: 1.0, hardHitPct: 18.5, flyBallPct: 32.0, pulledAirPct: 16.0 },
    { pitchType: "Slider", pitcherHand: "R", abs: 36, slg: 0.306, avg: 0.083, xbh: 2, hr: 0, exitVelo: 85.0, barrelPct: 0.5, hardHitPct: 14.0, flyBallPct: 28.0, pulledAirPct: 12.0 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 26, slg: 0.385, avg: 0.115, xbh: 2, hr: 1, exitVelo: 88.0, barrelPct: 0.8, hardHitPct: 20.0, flyBallPct: 34.0, pulledAirPct: 18.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 20, slg: 0.350, avg: 0.100, xbh: 2, hr: 0, exitVelo: 84.5, barrelPct: 0.3, hardHitPct: 12.0, flyBallPct: 26.0, pulledAirPct: 10.0 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 16, slg: 0.375, avg: 0.125, xbh: 2, hr: 0, exitVelo: 89.0, barrelPct: 0.8, hardHitPct: 22.0, flyBallPct: 30.0, pulledAirPct: 14.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 35, slg: 0.343, avg: 0.086, xbh: 2, hr: 0, exitVelo: 85.5, barrelPct: 0.4, hardHitPct: 15.0, flyBallPct: 28.0, pulledAirPct: 12.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 20, slg: 0.250, avg: 0.050, xbh: 2, hr: 0, exitVelo: 83.0, barrelPct: 0.2, hardHitPct: 10.0, flyBallPct: 24.0, pulledAirPct: 8.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 14, slg: 0.357, avg: 0.143, xbh: 2, hr: 0, exitVelo: 87.0, barrelPct: 0.6, hardHitPct: 18.0, flyBallPct: 30.0, pulledAirPct: 15.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 8, slg: 0.250, avg: 0.000, xbh: 2, hr: 0, exitVelo: 82.0, barrelPct: 0.0, hardHitPct: 8.0, flyBallPct: 20.0, pulledAirPct: 6.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 7, slg: 0.286, avg: 0.000, xbh: 2, hr: 0, exitVelo: 86.0, barrelPct: 0.3, hardHitPct: 14.0, flyBallPct: 26.0, pulledAirPct: 10.0 },
  ],
  "cj-kayfus": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 18, slg: 0.444, avg: 0.222, xbh: 2, hr: 1, exitVelo: 90.5, barrelPct: 6.5, hardHitPct: 48.0, flyBallPct: 40.0, pulledAirPct: 18.0 },
    { pitchType: "Slider", pitcherHand: "R", abs: 12, slg: 0.333, avg: 0.167, xbh: 2, hr: 0, exitVelo: 88.0, barrelPct: 5.0, hardHitPct: 40.0, flyBallPct: 36.0, pulledAirPct: 14.0 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 10, slg: 0.400, avg: 0.300, xbh: 2, hr: 1, exitVelo: 91.5, barrelPct: 7.0, hardHitPct: 50.0, flyBallPct: 42.0, pulledAirPct: 20.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 8, slg: 0.375, avg: 0.125, xbh: 2, hr: 0, exitVelo: 87.5, barrelPct: 4.5, hardHitPct: 38.0, flyBallPct: 34.0, pulledAirPct: 12.0 },
    { pitchType: "Sinker", pitcherHand: "R", abs: 4, slg: 0.250, avg: 0.000, xbh: 2, hr: 0, exitVelo: 89.0, barrelPct: 3.0, hardHitPct: 35.0, flyBallPct: 30.0, pulledAirPct: 10.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 12, slg: 0.333, avg: 0.167, xbh: 2, hr: 0, exitVelo: 88.0, barrelPct: 5.0, hardHitPct: 42.0, flyBallPct: 36.0, pulledAirPct: 15.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 8, slg: 0.250, avg: 0.125, xbh: 2, hr: 0, exitVelo: 86.0, barrelPct: 3.5, hardHitPct: 32.0, flyBallPct: 30.0, pulledAirPct: 10.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 6, slg: 0.500, avg: 0.333, xbh: 2, hr: 1, exitVelo: 92.0, barrelPct: 8.0, hardHitPct: 55.0, flyBallPct: 45.0, pulledAirPct: 22.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 4, slg: 0.250, avg: 0.000, xbh: 2, hr: 0, exitVelo: 84.0, barrelPct: 2.0, hardHitPct: 28.0, flyBallPct: 28.0, pulledAirPct: 8.0 },
    { pitchType: "Sinker", pitcherHand: "L", abs: 2, slg: 0.500, avg: 0.500, xbh: 2, hr: 0, exitVelo: 90.0, barrelPct: 5.0, hardHitPct: 50.0, flyBallPct: 25.0, pulledAirPct: 12.0 },
  ],
  "george-valera": [
    { pitchType: "Four-Seam Fastball", pitcherHand: "R", abs: 8, slg: 0.750, avg: 0.375, xbh: 2, hr: 1, exitVelo: 97.0, barrelPct: 6.0, hardHitPct: 55.0, flyBallPct: 30.0, pulledAirPct: 8.0 },
    { pitchType: "Slider", pitcherHand: "R", abs: 5, slg: 0.600, avg: 0.400, xbh: 2, hr: 1, exitVelo: 95.0, barrelPct: 5.0, hardHitPct: 48.0, flyBallPct: 28.0, pulledAirPct: 6.0 },
    { pitchType: "Changeup", pitcherHand: "R", abs: 4, slg: 0.500, avg: 0.250, xbh: 2, hr: 0, exitVelo: 94.0, barrelPct: 4.0, hardHitPct: 42.0, flyBallPct: 26.0, pulledAirPct: 5.0 },
    { pitchType: "Curveball", pitcherHand: "R", abs: 3, slg: 0.667, avg: 0.333, xbh: 2, hr: 0, exitVelo: 96.5, barrelPct: 5.5, hardHitPct: 50.0, flyBallPct: 32.0, pulledAirPct: 10.0 },
    { pitchType: "Four-Seam Fastball", pitcherHand: "L", abs: 6, slg: 0.500, avg: 0.167, xbh: 2, hr: 0, exitVelo: 94.0, barrelPct: 4.0, hardHitPct: 40.0, flyBallPct: 26.0, pulledAirPct: 6.0 },
    { pitchType: "Slider", pitcherHand: "L", abs: 3, slg: 0.333, avg: 0.000, xbh: 2, hr: 0, exitVelo: 90.0, barrelPct: 2.0, hardHitPct: 30.0, flyBallPct: 22.0, pulledAirPct: 4.0 },
    { pitchType: "Changeup", pitcherHand: "L", abs: 2, slg: 0.500, avg: 0.500, xbh: 2, hr: 0, exitVelo: 95.0, barrelPct: 6.0, hardHitPct: 50.0, flyBallPct: 30.0, pulledAirPct: 8.0 },
    { pitchType: "Curveball", pitcherHand: "L", abs: 1, slg: 0.000, avg: 0.000, xbh: 2, hr: 0, exitVelo: 80.0, barrelPct: 0.0, hardHitPct: 0.0, flyBallPct: 20.0, pulledAirPct: 0.0 },
  ],
}

// Helper: compute aggregated batter stats for selected pitch types and pitcher hand
export interface AggregatedBatterStats {
  playerId: string
  name: string
  position: string
  team: string
  abs: number
  avg: number
  slg: number
  xbh: number
  hr: number
  exitVelo: number
  barrelPct: number
  hardHitPct: number
  flyBallPct: number
  pulledAirPct: number
}

export function aggregateBatterStats(
  playerId: string,
  playerName: string,
  playerPosition: string,
  playerTeam: string,
  pitcherHand: "R" | "L",
  selectedPitchTypes: string[]
): AggregatedBatterStats | null {
  const allStats = batterVsPitchStats[playerId]
  if (!allStats) return null

  const filtered = allStats.filter(
    (s) => s.pitcherHand === pitcherHand && selectedPitchTypes.includes(s.pitchType)
  )

  if (filtered.length === 0) {
    return {
      playerId,
      name: playerName,
      position: playerPosition,
      team: playerTeam,
      abs: 0,
      avg: 0,
      slg: 0,
      xbh: 0,
      hr: 0,
      exitVelo: 0,
      barrelPct: 0,
      hardHitPct: 0,
      flyBallPct: 0,
      pulledAirPct: 0,
    }
  }

  const totalAbs = filtered.reduce((sum, s) => sum + s.abs, 0)

  // Weighted average by ABs
  const weightedAvg = (field: keyof BatterVsPitchStats) => {
    if (totalAbs === 0) return 0
    return filtered.reduce((sum, s) => sum + (s[field] as number) * s.abs, 0) / totalAbs
  }

  return {
    playerId,
    name: playerName,
    position: playerPosition,
    team: playerTeam,
    abs: totalAbs,
    avg: weightedAvg("avg"),
    slg: weightedAvg("slg"),
    xbh: filtered.reduce((sum, s) => sum + (s.xbh || 0), 0),
    hr: filtered.reduce((sum, s) => sum + s.hr, 0),
    exitVelo: weightedAvg("exitVelo"),
    barrelPct: weightedAvg("barrelPct"),
    hardHitPct: weightedAvg("hardHitPct"),
    flyBallPct: weightedAvg("flyBallPct"),
    pulledAirPct: weightedAvg("pulledAirPct"),
  }
}
