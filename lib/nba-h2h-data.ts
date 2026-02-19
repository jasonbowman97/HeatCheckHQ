export interface NBAGame {
  id: string
  awayTeam: string
  awayFull: string
  awayLogo?: string
  homeTeam: string
  homeFull: string
  homeLogo?: string
  date: string
  time: string
  venue: string
  awayInjuries: InjuredPlayer[]
  homeInjuries: InjuredPlayer[]
  h2hHistory: H2HHistory
  awayMomentum: TeamMomentum
  homeMomentum: TeamMomentum
}

export interface InjuredPlayer {
  name: string
  injury: string
  status: "Day-To-Day" | "Out" | "Questionable"
}

export interface H2HHistory {
  record: string
  awayAvgPts: number
  homeAvgPts: number
  avgTotal: number
  margin: string
  recentMeetings: RecentMeeting[]
}

export interface RecentMeeting {
  date: string
  time: string
  awayScore: number
  homeScore: number
  total: number
  winner: string
}

export interface TeamMomentum {
  trend: "Trending Up" | "Trending Down" | "Steady"
  streak: string
  streakType: "W" | "L"
  last5: { wins: number; losses: number }
  last10: { wins: number; losses: number }
  ppg: number
  oppPpg: number
  atsRecord: string
  ouRecord: string
  homeRecord: string
  homePpg: number
  awayRecord: string
  awayPpg: number
}
