// NFL Matchup Data

export interface TeamStats {
  pointsScored: number
  pointsScoredRank: number
  pointsAllowed: number
  pointsAllowedRank: number
  passYards: number
  passYardsRank: number
  passYardsAllowed: number
  passYardsAllowedRank: number
  rushingYards: number
  rushingYardsRank: number
  rushingYardsAllowed: number
  rushingYardsAllowedRank: number
}

export interface GameLogEntry {
  yards: number
  secondary: number // TDs for passing, attempts for rushing, receptions for receiving
}

export interface PassingPlayer {
  name: string
  position: string
  yardsPerGame: number
  tdsPerGame: number
  gameLogs: GameLogEntry[]
}

export interface RushingPlayer {
  name: string
  position: string
  yardsPerGame: number
  attemptsPerGame: number
  gameLogs: GameLogEntry[]
}

export interface ReceivingPlayer {
  name: string
  position: string
  yardsPerGame: number
  targetsPerGame: number
  gameLogs: GameLogEntry[]
}

export interface NFLTeam {
  name: string
  abbreviation: string
  spread: string
  stats: TeamStats
  passing: PassingPlayer[]
  rushing: RushingPlayer[]
  receiving: ReceivingPlayer[]
}

export interface NFLMatchup {
  id: string
  dateTime: string
  week: string
  away: NFLTeam
  home: NFLTeam
}

export const nflMatchups: NFLMatchup[] = [
  {
    id: "sea-ne-wk5",
    dateTime: "02/08/2026, 6:30 PM",
    week: "Week 5",
    away: {
      name: "Seattle Seahawks",
      abbreviation: "SEA",
      spread: "-4.5",
      stats: {
        pointsScored: 28.4, pointsScoredRank: 5,
        pointsAllowed: 17.2, pointsAllowedRank: 1,
        passYards: 239.0, passYardsRank: 9,
        passYardsAllowed: 205.4, passYardsAllowedRank: 14,
        rushingYards: 123.3, rushingYardsRank: 11,
        rushingYardsAllowed: 88.5, rushingYardsAllowedRank: 4,
      },
      passing: [
        { name: "Sam Darnold", position: "QB", yardsPerGame: 237.8, tdsPerGame: 1.5, gameLogs: [{ yards: 346, secondary: 3 }, { yards: 198, secondary: 0 }, { yards: 278, secondary: 2 }, { yards: 124, secondary: 1 }, { yards: 147, secondary: 1 }] },
        { name: "Drew Lock", position: "QB", yardsPerGame: 5, tdsPerGame: 0, gameLogs: [{ yards: 15, secondary: 0 }] },
        { name: "Jalen Milroe", position: "QB", yardsPerGame: 0, tdsPerGame: 0, gameLogs: [] },
      ],
      rushing: [
        { name: "Kenneth Walker III", position: "RB", yardsPerGame: 63.4, attemptsPerGame: 13.6, gameLogs: [{ yards: 62, secondary: 19 }, { yards: 116, secondary: 19 }, { yards: 97, secondary: 16 }, { yards: 100, secondary: 11 }, { yards: 51, secondary: 15 }] },
        { name: "Zach Charbonnet", position: "RB", yardsPerGame: 44.1, attemptsPerGame: 11.1, gameLogs: [{ yards: 20, secondary: 5 }, { yards: 118, secondary: 18 }, { yards: 31, secondary: 8 }, { yards: 74, secondary: 17 }, { yards: 32, secondary: 9 }] },
        { name: "Jacardia Wright", position: "RB", yardsPerGame: 20, attemptsPerGame: 5, gameLogs: [{ yards: 20, secondary: 5 }] },
      ],
      receiving: [
        { name: "Jaxon Smith-Njigba", position: "WR", yardsPerGame: 78.3, targetsPerGame: 8.2, gameLogs: [{ yards: 102, secondary: 6 }, { yards: 45, secondary: 5 }, { yards: 88, secondary: 9 }, { yards: 67, secondary: 7 }, { yards: 90, secondary: 11 }] },
        { name: "Jake Bobo", position: "WR", yardsPerGame: 42.1, targetsPerGame: 5.4, gameLogs: [{ yards: 48, secondary: 5 }, { yards: 35, secondary: 4 }, { yards: 50, secondary: 6 }, { yards: 38, secondary: 5 }, { yards: 40, secondary: 7 }] },
        { name: "Pharaoh Brown", position: "TE", yardsPerGame: 29.5, targetsPerGame: 3.9, gameLogs: [{ yards: 33, secondary: 3 }, { yards: 22, secondary: 2 }, { yards: 35, secondary: 5 }, { yards: 28, secondary: 4 }, { yards: 30, secondary: 5 }] },
        { name: "Noah Fant", position: "TE", yardsPerGame: 25.2, targetsPerGame: 3.4, gameLogs: [{ yards: 28, secondary: 3 }, { yards: 18, secondary: 2 }, { yards: 30, secondary: 4 }, { yards: 22, secondary: 3 }, { yards: 28, secondary: 5 }] },
      ],
    },
    home: {
      name: "New England Patriots",
      abbreviation: "NE",
      spread: "+4.5",
      stats: {
        pointsScored: 28.8, pointsScoredRank: 4,
        pointsAllowed: 18.8, pointsAllowedRank: 4,
        passYards: 260.4, passYardsRank: 4,
        passYardsAllowed: 198.5, passYardsAllowedRank: 9,
        rushingYards: 128.9, rushingYardsRank: 6,
        rushingYardsAllowed: 98.0, rushingYardsAllowedRank: 10,
      },
      passing: [
        { name: "Drake Maye", position: "QB", yardsPerGame: 246.4, tdsPerGame: 1.8, gameLogs: [{ yards: 86, secondary: 0 }, { yards: 268, secondary: 1 }, { yards: 256, secondary: 5 }, { yards: 179, secondary: 3 }, { yards: 191, secondary: 1 }] },
        { name: "Joshua Dobbs", position: "QB", yardsPerGame: 16.3, tdsPerGame: 0, gameLogs: [{ yards: 23, secondary: 0 }, { yards: 12, secondary: 0 }, { yards: 30, secondary: 0 }, { yards: 0, secondary: 0 }] },
      ],
      rushing: [
        { name: "TreVeyon Henderson", position: "RB", yardsPerGame: 48.4, attemptsPerGame: 10.2, gameLogs: [{ yards: 5, secondary: 3 }, { yards: 27, secondary: 9 }, { yards: 82, secondary: 19 }, { yards: 25, secondary: 12 }, { yards: 53, secondary: 13 }] },
        { name: "Rhamondre Stevenson", position: "RB", yardsPerGame: 46.9, attemptsPerGame: 10.6, gameLogs: [{ yards: 71, secondary: 25 }, { yards: 53, secondary: 10 }, { yards: 47, secondary: 8 }, { yards: 78, secondary: 16 }, { yards: 131, secondary: 7 }] },
        { name: "Antonio Gibson", position: "RB", yardsPerGame: 21.2, attemptsPerGame: 5, gameLogs: [{ yards: 21, secondary: 6 }, { yards: 28, secondary: 7 }, { yards: 3, secondary: 1 }, { yards: 27, secondary: 6 }, { yards: 27, secondary: 5 }] },
      ],
      receiving: [
        { name: "Ja'Lynn Polk", position: "WR", yardsPerGame: 71.8, targetsPerGame: 8.6, gameLogs: [{ yards: 88, secondary: 7 }, { yards: 92, secondary: 10 }, { yards: 55, secondary: 6 }, { yards: 60, secondary: 9 }, { yards: 64, secondary: 8 }] },
        { name: "DeMario Douglas", position: "WR", yardsPerGame: 55.3, targetsPerGame: 7.1, gameLogs: [{ yards: 40, secondary: 5 }, { yards: 65, secondary: 8 }, { yards: 72, secondary: 9 }, { yards: 38, secondary: 6 }, { yards: 62, secondary: 7 }] },
        { name: "Kayshon Boutte", position: "WR", yardsPerGame: 32.4, targetsPerGame: 4.5, gameLogs: [{ yards: 28, secondary: 3 }, { yards: 40, secondary: 5 }, { yards: 22, secondary: 4 }, { yards: 35, secondary: 5 }, { yards: 37, secondary: 6 }] },
        { name: "Hunter Henry", position: "TE", yardsPerGame: 41.6, targetsPerGame: 5.2, gameLogs: [{ yards: 52, secondary: 4 }, { yards: 35, secondary: 6 }, { yards: 38, secondary: 5 }, { yards: 44, secondary: 5 }, { yards: 39, secondary: 6 }] },
      ],
    },
  },
  {
    id: "buf-kc-wk5",
    dateTime: "02/08/2026, 4:25 PM",
    week: "Week 5",
    away: {
      name: "Buffalo Bills",
      abbreviation: "BUF",
      spread: "-1.5",
      stats: {
        pointsScored: 31.2, pointsScoredRank: 2,
        pointsAllowed: 21.5, pointsAllowedRank: 8,
        passYards: 275.1, passYardsRank: 2,
        passYardsAllowed: 220.3, passYardsAllowedRank: 18,
        rushingYards: 135.7, rushingYardsRank: 4,
        rushingYardsAllowed: 105.2, rushingYardsAllowedRank: 14,
      },
      passing: [
        { name: "Josh Allen", position: "QB", yardsPerGame: 268.5, tdsPerGame: 2.1, gameLogs: [{ yards: 312, secondary: 3 }, { yards: 245, secondary: 2 }, { yards: 287, secondary: 1 }, { yards: 220, secondary: 2 }, { yards: 278, secondary: 3 }] },
        { name: "Mitchell Trubisky", position: "QB", yardsPerGame: 6.5, tdsPerGame: 0, gameLogs: [{ yards: 13, secondary: 0 }] },
      ],
      rushing: [
        { name: "James Cook", position: "RB", yardsPerGame: 72.3, attemptsPerGame: 15.1, gameLogs: [{ yards: 85, secondary: 18 }, { yards: 60, secondary: 12 }, { yards: 92, secondary: 20 }, { yards: 55, secondary: 13 }, { yards: 70, secondary: 14 }] },
        { name: "Josh Allen", position: "QB", yardsPerGame: 35.8, attemptsPerGame: 7.2, gameLogs: [{ yards: 42, secondary: 8 }, { yards: 28, secondary: 6 }, { yards: 50, secondary: 9 }, { yards: 22, secondary: 5 }, { yards: 37, secondary: 8 }] },
        { name: "Ray Davis", position: "RB", yardsPerGame: 27.5, attemptsPerGame: 6.3, gameLogs: [{ yards: 30, secondary: 7 }, { yards: 22, secondary: 5 }, { yards: 35, secondary: 8 }, { yards: 20, secondary: 5 }, { yards: 31, secondary: 7 }] },
      ],
      receiving: [
        { name: "Khalil Shakir", position: "WR", yardsPerGame: 68.9, targetsPerGame: 7.8, gameLogs: [{ yards: 82, secondary: 6 }, { yards: 55, secondary: 7 }, { yards: 75, secondary: 8 }, { yards: 60, secondary: 9 }, { yards: 73, secondary: 9 }] },
        { name: "Dalton Kincaid", position: "TE", yardsPerGame: 52.1, targetsPerGame: 6.5, gameLogs: [{ yards: 60, secondary: 5 }, { yards: 45, secondary: 7 }, { yards: 48, secondary: 6 }, { yards: 55, secondary: 7 }, { yards: 53, secondary: 8 }] },
        { name: "Curtis Samuel", position: "WR", yardsPerGame: 38.4, targetsPerGame: 5.2, gameLogs: [{ yards: 42, secondary: 4 }, { yards: 30, secondary: 5 }, { yards: 45, secondary: 6 }, { yards: 35, secondary: 5 }, { yards: 40, secondary: 6 }] },
      ],
    },
    home: {
      name: "Kansas City Chiefs",
      abbreviation: "KC",
      spread: "+1.5",
      stats: {
        pointsScored: 26.1, pointsScoredRank: 7,
        pointsAllowed: 19.3, pointsAllowedRank: 5,
        passYards: 245.8, passYardsRank: 8,
        passYardsAllowed: 192.1, passYardsAllowedRank: 6,
        rushingYards: 118.4, rushingYardsRank: 15,
        rushingYardsAllowed: 92.3, rushingYardsAllowedRank: 7,
      },
      passing: [
        { name: "Patrick Mahomes", position: "QB", yardsPerGame: 241.2, tdsPerGame: 1.6, gameLogs: [{ yards: 260, secondary: 2 }, { yards: 218, secondary: 1 }, { yards: 275, secondary: 2 }, { yards: 230, secondary: 1 }, { yards: 223, secondary: 2 }] },
        { name: "Carson Wentz", position: "QB", yardsPerGame: 4.6, tdsPerGame: 0, gameLogs: [{ yards: 9, secondary: 0 }] },
      ],
      rushing: [
        { name: "Isiah Pacheco", position: "RB", yardsPerGame: 58.7, attemptsPerGame: 14.3, gameLogs: [{ yards: 70, secondary: 16 }, { yards: 45, secondary: 12 }, { yards: 65, secondary: 15 }, { yards: 52, secondary: 14 }, { yards: 62, secondary: 15 }] },
        { name: "Clyde Edwards-Helaire", position: "RB", yardsPerGame: 32.1, attemptsPerGame: 8.4, gameLogs: [{ yards: 38, secondary: 9 }, { yards: 25, secondary: 7 }, { yards: 40, secondary: 10 }, { yards: 28, secondary: 8 }, { yards: 30, secondary: 8 }] },
        { name: "Patrick Mahomes", position: "QB", yardsPerGame: 18.5, attemptsPerGame: 3.8, gameLogs: [{ yards: 22, secondary: 4 }, { yards: 15, secondary: 3 }, { yards: 25, secondary: 5 }, { yards: 12, secondary: 3 }, { yards: 19, secondary: 4 }] },
      ],
      receiving: [
        { name: "Travis Kelce", position: "TE", yardsPerGame: 58.2, targetsPerGame: 7.9, gameLogs: [{ yards: 65, secondary: 6 }, { yards: 50, secondary: 8 }, { yards: 72, secondary: 9 }, { yards: 45, secondary: 7 }, { yards: 59, secondary: 8 }] },
        { name: "Xavier Worthy", position: "WR", yardsPerGame: 55.6, targetsPerGame: 6.1, gameLogs: [{ yards: 68, secondary: 5 }, { yards: 42, secondary: 6 }, { yards: 60, secondary: 7 }, { yards: 50, secondary: 6 }, { yards: 58, secondary: 7 }] },
        { name: "Rashee Rice", position: "WR", yardsPerGame: 48.3, targetsPerGame: 6.8, gameLogs: [{ yards: 52, secondary: 5 }, { yards: 38, secondary: 6 }, { yards: 55, secondary: 8 }, { yards: 45, secondary: 7 }, { yards: 52, secondary: 8 }] },
        { name: "Hollywood Brown", position: "WR", yardsPerGame: 35.1, targetsPerGame: 4.3, gameLogs: [{ yards: 40, secondary: 4 }, { yards: 28, secondary: 3 }, { yards: 38, secondary: 5 }, { yards: 32, secondary: 4 }, { yards: 37, secondary: 5 }] },
      ],
    },
  },
]

export function getMatchup(id: string): NFLMatchup | undefined {
  return nflMatchups.find((m) => m.id === id)
}

export function getAllMatchups(): NFLMatchup[] {
  return nflMatchups
}
