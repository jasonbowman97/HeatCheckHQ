export interface NBAGame {
  id: string
  awayTeam: string
  awayFull: string
  homeTeam: string
  homeFull: string
  date: string
  time: string
  venue: string
  awayInjuries: InjuredPlayer[]
  homeInjuries: InjuredPlayer[]
  h2hHistory: H2HHistory
  awayMomentum: TeamMomentum
  homeMomentum: TeamMomentum
  awayDefense: DefenseVsPosition
  homeDefense: DefenseVsPosition
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

export interface DefenseVsPosition {
  pg: number
  sg: number
  sf: number
  pf: number
  c: number
}

export const nbaGames: NBAGame[] = [
  {
    id: "ny-det",
    awayTeam: "NY",
    awayFull: "New York Knicks",
    homeTeam: "DET",
    homeFull: "Detroit Pistons",
    date: "Feb 6",
    time: "5:30 PM",
    venue: "Little Caesars Arena",
    awayInjuries: [
      { name: "OG Anunoby", injury: "Right Leg Soreness", status: "Day-To-Day" },
      { name: "Josh Hart", injury: "Left Leg Sprain", status: "Day-To-Day" },
      { name: "Karl-Anthony Towns", injury: "Right Head Laceration", status: "Day-To-Day" },
      { name: "Jose Alvarado", injury: "Not Specified", status: "Out" },
      { name: "Miles McBride", injury: "Torso Surgery", status: "Out" },
    ],
    homeInjuries: [
      { name: "Tobias Harris", injury: "Left Torso Soreness", status: "Day-To-Day" },
      { name: "Duncan Robinson", injury: "Leg", status: "Day-To-Day" },
      { name: "Dario Saric", injury: "Not Specified", status: "Out" },
      { name: "Jalen Duren", injury: "Right Leg Soreness", status: "Day-To-Day" },
      { name: "Tolu Smith", injury: "Leg Not Specified", status: "Out" },
    ],
    h2hHistory: {
      record: "DET 1 - 0 NY",
      awayAvgPts: 90.0,
      homeAvgPts: 121.0,
      avgTotal: 211.0,
      margin: "DET: +31.0",
      recentMeetings: [
        { date: "Jan 5", time: "5:00 PM", awayScore: 90, homeScore: 121, total: 211, winner: "DET" },
      ],
    },
    awayMomentum: {
      trend: "Trending Up",
      streak: "8W",
      streakType: "W",
      last5: { wins: 5, losses: 0 },
      last10: { wins: 8, losses: 2 },
      ppg: 115.5,
      oppPpg: 99.9,
      atsRecord: "8-2",
      ouRecord: "2-8 O/U",
      homeRecord: "5-2",
      homePpg: 113.1,
      awayRecord: "3-0",
      awayPpg: 121.0,
    },
    homeMomentum: {
      trend: "Trending Up",
      streak: "1L",
      streakType: "L",
      last5: { wins: 3, losses: 2 },
      last10: { wins: 7, losses: 3 },
      ppg: 116.6,
      oppPpg: 110.3,
      atsRecord: "3-7",
      ouRecord: "5-5 O/U",
      homeRecord: "4-2",
      homePpg: 119.7,
      awayRecord: "3-1",
      awayPpg: 112.0,
    },
    awayDefense: { pg: 10, sg: 17, sf: 25, pf: 4, c: 4 },
    homeDefense: { pg: 9, sg: 12, sf: 16, pf: 9, c: 1 },
  },
  {
    id: "mia-bos",
    awayTeam: "MIA",
    awayFull: "Miami Heat",
    homeTeam: "BOS",
    homeFull: "Boston Celtics",
    date: "Feb 6",
    time: "5:30 PM",
    venue: "TD Garden",
    awayInjuries: [
      { name: "Jimmy Butler", injury: "Knee Soreness", status: "Day-To-Day" },
      { name: "Terry Rozier", injury: "Foot Injury", status: "Out" },
    ],
    homeInjuries: [
      { name: "Kristaps Porzingis", injury: "Leg Soreness", status: "Day-To-Day" },
      { name: "Robert Williams", injury: "Knee Recovery", status: "Out" },
    ],
    h2hHistory: {
      record: "BOS 2 - 1 MIA",
      awayAvgPts: 101.3,
      homeAvgPts: 108.7,
      avgTotal: 210.0,
      margin: "BOS: +7.3",
      recentMeetings: [
        { date: "Jan 22", time: "7:30 PM", awayScore: 105, homeScore: 112, total: 217, winner: "BOS" },
        { date: "Dec 14", time: "5:00 PM", awayScore: 110, homeScore: 102, total: 212, winner: "MIA" },
        { date: "Nov 8", time: "7:00 PM", awayScore: 89, homeScore: 112, total: 201, winner: "BOS" },
      ],
    },
    awayMomentum: {
      trend: "Steady",
      streak: "2W",
      streakType: "W",
      last5: { wins: 3, losses: 2 },
      last10: { wins: 5, losses: 5 },
      ppg: 108.2,
      oppPpg: 107.1,
      atsRecord: "5-5",
      ouRecord: "4-6 O/U",
      homeRecord: "3-2",
      homePpg: 110.5,
      awayRecord: "2-3",
      awayPpg: 105.2,
    },
    homeMomentum: {
      trend: "Trending Up",
      streak: "5W",
      streakType: "W",
      last5: { wins: 4, losses: 1 },
      last10: { wins: 8, losses: 2 },
      ppg: 118.4,
      oppPpg: 104.2,
      atsRecord: "7-3",
      ouRecord: "6-4 O/U",
      homeRecord: "5-0",
      homePpg: 121.3,
      awayRecord: "3-2",
      awayPpg: 114.1,
    },
    awayDefense: { pg: 14, sg: 8, sf: 11, pf: 20, c: 15 },
    homeDefense: { pg: 3, sg: 5, sf: 7, pf: 2, c: 6 },
  },
  {
    id: "no-min",
    awayTeam: "NO",
    awayFull: "New Orleans Pelicans",
    homeTeam: "MIN",
    homeFull: "Minnesota Timberwolves",
    date: "Feb 6",
    time: "6:00 PM",
    venue: "Target Center",
    awayInjuries: [
      { name: "Zion Williamson", injury: "Hamstring", status: "Out" },
      { name: "Brandon Ingram", injury: "Ankle", status: "Day-To-Day" },
    ],
    homeInjuries: [
      { name: "Karl-Anthony Towns", injury: "Trade", status: "Out" },
    ],
    h2hHistory: {
      record: "MIN 1 - 1 NO",
      awayAvgPts: 107.5,
      homeAvgPts: 109.0,
      avgTotal: 216.5,
      margin: "MIN: +1.5",
      recentMeetings: [
        { date: "Dec 28", time: "6:00 PM", awayScore: 112, homeScore: 104, total: 216, winner: "NO" },
        { date: "Nov 15", time: "7:00 PM", awayScore: 103, homeScore: 114, total: 217, winner: "MIN" },
      ],
    },
    awayMomentum: {
      trend: "Trending Down",
      streak: "3L",
      streakType: "L",
      last5: { wins: 1, losses: 4 },
      last10: { wins: 3, losses: 7 },
      ppg: 104.8,
      oppPpg: 113.2,
      atsRecord: "2-8",
      ouRecord: "6-4 O/U",
      homeRecord: "1-4",
      homePpg: 102.1,
      awayRecord: "2-3",
      awayPpg: 108.4,
    },
    homeMomentum: {
      trend: "Trending Up",
      streak: "4W",
      streakType: "W",
      last5: { wins: 4, losses: 1 },
      last10: { wins: 7, losses: 3 },
      ppg: 112.6,
      oppPpg: 106.3,
      atsRecord: "6-4",
      ouRecord: "5-5 O/U",
      homeRecord: "4-1",
      homePpg: 115.2,
      awayRecord: "3-2",
      awayPpg: 109.8,
    },
    awayDefense: { pg: 22, sg: 19, sf: 14, pf: 26, c: 18 },
    homeDefense: { pg: 6, sg: 3, sf: 10, pf: 8, c: 5 },
  },
  {
    id: "ind-mil",
    awayTeam: "IND",
    awayFull: "Indiana Pacers",
    homeTeam: "MIL",
    homeFull: "Milwaukee Bucks",
    date: "Feb 6",
    time: "6:00 PM",
    venue: "Fiserv Forum",
    awayInjuries: [
      { name: "James Wiseman", injury: "Achilles", status: "Out" },
    ],
    homeInjuries: [
      { name: "Khris Middleton", injury: "Ankle Surgery", status: "Out" },
      { name: "MarJon Beauchamp", injury: "Leg", status: "Day-To-Day" },
    ],
    h2hHistory: {
      record: "MIL 2 - 0 IND",
      awayAvgPts: 108.0,
      homeAvgPts: 119.5,
      avgTotal: 227.5,
      margin: "MIL: +11.5",
      recentMeetings: [
        { date: "Jan 18", time: "6:00 PM", awayScore: 112, homeScore: 124, total: 236, winner: "MIL" },
        { date: "Dec 6", time: "7:00 PM", awayScore: 104, homeScore: 115, total: 219, winner: "MIL" },
      ],
    },
    awayMomentum: {
      trend: "Steady",
      streak: "1W",
      streakType: "W",
      last5: { wins: 3, losses: 2 },
      last10: { wins: 6, losses: 4 },
      ppg: 120.8,
      oppPpg: 118.4,
      atsRecord: "4-6",
      ouRecord: "7-3 O/U",
      homeRecord: "3-2",
      homePpg: 122.1,
      awayRecord: "3-2",
      awayPpg: 119.0,
    },
    homeMomentum: {
      trend: "Trending Up",
      streak: "6W",
      streakType: "W",
      last5: { wins: 5, losses: 0 },
      last10: { wins: 9, losses: 1 },
      ppg: 121.4,
      oppPpg: 108.9,
      atsRecord: "8-2",
      ouRecord: "5-5 O/U",
      homeRecord: "5-0",
      homePpg: 124.2,
      awayRecord: "4-1",
      awayPpg: 117.8,
    },
    awayDefense: { pg: 28, sg: 24, sf: 20, pf: 15, c: 22 },
    homeDefense: { pg: 7, sg: 11, sf: 4, pf: 6, c: 3 },
  },
]
