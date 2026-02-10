export interface RedzoneZoneStats {
  att: number
  comp: number
  compPct: number
  td: number
  int: number
}

export interface RushingZoneStats {
  att: number
  yds: number
  avg: number
  td: number
}

export interface ReceivingZoneStats {
  tgt: number
  rec: number
  yds: number
  td: number
}

export interface RedzonePassingPlayer {
  name: string
  pos: "QB"
  team: string
  gp: number
  totTd: number
  redzone: RedzoneZoneStats
  inside10: RedzoneZoneStats
  inside5: RedzoneZoneStats
}

export interface RedzoneRushingPlayer {
  name: string
  pos: "RB" | "QB"
  team: string
  gp: number
  totTd: number
  redzone: RushingZoneStats
  inside10: RushingZoneStats
  inside5: RushingZoneStats
}

export interface RedzoneReceivingPlayer {
  name: string
  pos: "WR" | "TE"
  team: string
  gp: number
  totTd: number
  redzone: ReceivingZoneStats
  inside10: ReceivingZoneStats
  inside5: ReceivingZoneStats
}

export const passingPlayers: RedzonePassingPlayer[] = [
  { name: "Matthew Stafford", pos: "QB", team: "LAR", gp: 17, totTd: 46, redzone: { att: 110, comp: 69, compPct: 62.7, td: 33, int: 2 }, inside10: { att: 58, comp: 34, compPct: 58.6, td: 27, int: 1 }, inside5: { att: 28, comp: 18, compPct: 64, td: 18, int: 0 } },
  { name: "Josh Allen", pos: "QB", team: "BUF", gp: 17, totTd: 39, redzone: { att: 65, comp: 42, compPct: 64.6, td: 16, int: 3 }, inside10: { att: 30, comp: 21, compPct: 70, td: 9, int: 1 }, inside5: { att: 14, comp: 9, compPct: 64, td: 7, int: 1 } },
  { name: "Trevor Lawrence", pos: "QB", team: "JAX", gp: 17, totTd: 38, redzone: { att: 88, comp: 51, compPct: 58, td: 23, int: 4 }, inside10: { att: 40, comp: 23, compPct: 57.5, td: 17, int: 3 }, inside5: { att: 11, comp: 7, compPct: 64, td: 7, int: 1 } },
  { name: "Drake Maye", pos: "QB", team: "NE", gp: 17, totTd: 35, redzone: { att: 72, comp: 47, compPct: 65.3, td: 20, int: 3 }, inside10: { att: 38, comp: 20, compPct: 52.6, td: 14, int: 2 }, inside5: { att: 24, comp: 11, compPct: 46, td: 10, int: 2 } },
  { name: "Jared Goff", pos: "QB", team: "DET", gp: 17, totTd: 34, redzone: { att: 94, comp: 53, compPct: 56.4, td: 25, int: 2 }, inside10: { att: 43, comp: 21, compPct: 48.8, td: 13, int: 0 }, inside5: { att: 19, comp: 7, compPct: 37, td: 7, int: 0 } },
  { name: "Jalen Hurts", pos: "QB", team: "PHI", gp: 16, totTd: 33, redzone: { att: 52, comp: 37, compPct: 71.2, td: 16, int: 2 }, inside10: { att: 20, comp: 15, compPct: 75, td: 13, int: 0 }, inside5: { att: 13, comp: 10, compPct: 77, td: 10, int: 0 } },
  { name: "Dak Prescott", pos: "QB", team: "DAL", gp: 17, totTd: 32, redzone: { att: 102, comp: 57, compPct: 55.9, td: 21, int: 3 }, inside10: { att: 48, comp: 26, compPct: 54.2, td: 17, int: 2 }, inside5: { att: 30, comp: 14, compPct: 47, td: 13, int: 2 } },
  { name: "Caleb Williams", pos: "QB", team: "CHI", gp: 17, totTd: 31, redzone: { att: 73, comp: 39, compPct: 53.4, td: 14, int: 2 }, inside10: { att: 29, comp: 18, compPct: 62.1, td: 12, int: 0 }, inside5: { att: 18, comp: 10, compPct: 56, td: 9, int: 0 } },
  { name: "Bo Nix", pos: "QB", team: "DEN", gp: 17, totTd: 30, redzone: { att: 87, comp: 53, compPct: 60.9, td: 17, int: 1 }, inside10: { att: 38, comp: 16, compPct: 42.1, td: 9, int: 1 }, inside5: { att: 20, comp: 9, compPct: 45, td: 7, int: 1 } },
  { name: "Justin Herbert", pos: "QB", team: "LAC", gp: 16, totTd: 28, redzone: { att: 82, comp: 43, compPct: 52.4, td: 20, int: 4 }, inside10: { att: 33, comp: 17, compPct: 51.5, td: 14, int: 3 }, inside5: { att: 13, comp: 7, compPct: 54, td: 7, int: 2 } },
  { name: "Baker Mayfield", pos: "QB", team: "TB", gp: 17, totTd: 27, redzone: { att: 67, comp: 40, compPct: 59.7, td: 16, int: 1 }, inside10: { att: 24, comp: 12, compPct: 50, td: 9, int: 0 }, inside5: { att: 12, comp: 6, compPct: 50, td: 6, int: 0 } },
  { name: "Patrick Mahomes", pos: "QB", team: "KC", gp: 14, totTd: 27, redzone: { att: 88, comp: 46, compPct: 52.3, td: 18, int: 3 }, inside10: { att: 50, comp: 26, compPct: 52, td: 15, int: 2 }, inside5: { att: 23, comp: 11, compPct: 48, td: 9, int: 1 } },
  { name: "Aaron Rodgers", pos: "QB", team: "PIT", gp: 16, totTd: 25, redzone: { att: 77, comp: 47, compPct: 61, td: 14, int: 1 }, inside10: { att: 37, comp: 15, compPct: 40.5, td: 6, int: 1 }, inside5: { att: 15, comp: 7, compPct: 47, td: 5, int: 1 } },
  { name: "Bryce Young", pos: "QB", team: "CAR", gp: 16, totTd: 25, redzone: { att: 68, comp: 40, compPct: 58.8, td: 14, int: 2 }, inside10: { att: 23, comp: 16, compPct: 69.6, td: 12, int: 1 }, inside5: { att: 12, comp: 8, compPct: 67, td: 6, int: 1 } },
  { name: "Sam Darnold", pos: "QB", team: "SEA", gp: 17, totTd: 25, redzone: { att: 67, comp: 39, compPct: 58.2, td: 15, int: 2 }, inside10: { att: 28, comp: 15, compPct: 53.6, td: 7, int: 1 }, inside5: { att: 12, comp: 6, compPct: 50, td: 4, int: 0 } },
  { name: "C.J. Stroud", pos: "QB", team: "HOU", gp: 17, totTd: 24, redzone: { att: 76, comp: 44, compPct: 57.9, td: 19, int: 3 }, inside10: { att: 34, comp: 19, compPct: 55.9, td: 14, int: 1 }, inside5: { att: 16, comp: 8, compPct: 50, td: 8, int: 1 } },
]

export const rushingPlayers: RedzoneRushingPlayer[] = [
  { name: "Derrick Henry", pos: "RB", team: "BAL", gp: 17, totTd: 18, redzone: { att: 72, yds: 198, avg: 2.8, td: 16 }, inside10: { att: 38, yds: 78, avg: 2.1, td: 12 }, inside5: { att: 22, yds: 36, avg: 1.6, td: 10 } },
  { name: "Saquon Barkley", pos: "RB", team: "PHI", gp: 16, totTd: 16, redzone: { att: 65, yds: 185, avg: 2.8, td: 14 }, inside10: { att: 30, yds: 62, avg: 2.1, td: 10 }, inside5: { att: 18, yds: 28, avg: 1.6, td: 9 } },
  { name: "Josh Jacobs", pos: "RB", team: "GB", gp: 17, totTd: 15, redzone: { att: 70, yds: 190, avg: 2.7, td: 13 }, inside10: { att: 35, yds: 65, avg: 1.9, td: 9 }, inside5: { att: 20, yds: 30, avg: 1.5, td: 8 } },
  { name: "Jahmyr Gibbs", pos: "RB", team: "DET", gp: 17, totTd: 14, redzone: { att: 55, yds: 160, avg: 2.9, td: 12 }, inside10: { att: 28, yds: 55, avg: 2.0, td: 8 }, inside5: { att: 15, yds: 22, avg: 1.5, td: 7 } },
  { name: "Bijan Robinson", pos: "RB", team: "ATL", gp: 17, totTd: 13, redzone: { att: 62, yds: 175, avg: 2.8, td: 11 }, inside10: { att: 32, yds: 60, avg: 1.9, td: 8 }, inside5: { att: 17, yds: 25, avg: 1.5, td: 6 } },
  { name: "De'Von Achane", pos: "RB", team: "MIA", gp: 15, totTd: 12, redzone: { att: 42, yds: 130, avg: 3.1, td: 10 }, inside10: { att: 20, yds: 42, avg: 2.1, td: 7 }, inside5: { att: 12, yds: 18, avg: 1.5, td: 6 } },
  { name: "Kyren Williams", pos: "RB", team: "LAR", gp: 17, totTd: 12, redzone: { att: 58, yds: 148, avg: 2.6, td: 10 }, inside10: { att: 30, yds: 52, avg: 1.7, td: 7 }, inside5: { att: 18, yds: 24, avg: 1.3, td: 6 } },
  { name: "Jonathan Taylor", pos: "RB", team: "IND", gp: 16, totTd: 11, redzone: { att: 52, yds: 140, avg: 2.7, td: 9 }, inside10: { att: 26, yds: 48, avg: 1.8, td: 6 }, inside5: { att: 14, yds: 20, avg: 1.4, td: 5 } },
  { name: "Breece Hall", pos: "RB", team: "NYJ", gp: 17, totTd: 10, redzone: { att: 48, yds: 125, avg: 2.6, td: 8 }, inside10: { att: 22, yds: 38, avg: 1.7, td: 5 }, inside5: { att: 12, yds: 16, avg: 1.3, td: 4 } },
  { name: "James Cook", pos: "RB", team: "BUF", gp: 17, totTd: 10, redzone: { att: 45, yds: 118, avg: 2.6, td: 8 }, inside10: { att: 20, yds: 35, avg: 1.8, td: 5 }, inside5: { att: 11, yds: 14, avg: 1.3, td: 4 } },
  { name: "Jalen Hurts", pos: "QB", team: "PHI", gp: 16, totTd: 15, redzone: { att: 58, yds: 165, avg: 2.8, td: 14 }, inside10: { att: 28, yds: 50, avg: 1.8, td: 10 }, inside5: { att: 16, yds: 22, avg: 1.4, td: 8 } },
  { name: "Josh Allen", pos: "QB", team: "BUF", gp: 17, totTd: 14, redzone: { att: 50, yds: 148, avg: 3.0, td: 12 }, inside10: { att: 24, yds: 45, avg: 1.9, td: 9 }, inside5: { att: 14, yds: 18, avg: 1.3, td: 7 } },
]

export const receivingPlayers: RedzoneReceivingPlayer[] = [
  { name: "Puka Nacua", pos: "WR", team: "LAR", gp: 17, totTd: 14, redzone: { tgt: 30, rec: 22, yds: 145, td: 12 }, inside10: { tgt: 16, rec: 12, yds: 68, td: 10 }, inside5: { tgt: 10, rec: 8, yds: 32, td: 8 } },
  { name: "CeeDee Lamb", pos: "WR", team: "DAL", gp: 17, totTd: 13, redzone: { tgt: 32, rec: 20, yds: 138, td: 11 }, inside10: { tgt: 18, rec: 11, yds: 60, td: 8 }, inside5: { tgt: 12, rec: 7, yds: 28, td: 7 } },
  { name: "Ja'Marr Chase", pos: "WR", team: "CIN", gp: 16, totTd: 13, redzone: { tgt: 28, rec: 19, yds: 130, td: 12 }, inside10: { tgt: 14, rec: 10, yds: 52, td: 9 }, inside5: { tgt: 8, rec: 6, yds: 22, td: 6 } },
  { name: "Amon-Ra St. Brown", pos: "WR", team: "DET", gp: 17, totTd: 12, redzone: { tgt: 26, rec: 18, yds: 120, td: 10 }, inside10: { tgt: 14, rec: 10, yds: 48, td: 8 }, inside5: { tgt: 8, rec: 6, yds: 18, td: 6 } },
  { name: "Travis Kelce", pos: "TE", team: "KC", gp: 14, totTd: 11, redzone: { tgt: 24, rec: 17, yds: 95, td: 9 }, inside10: { tgt: 14, rec: 10, yds: 42, td: 7 }, inside5: { tgt: 8, rec: 6, yds: 16, td: 6 } },
  { name: "George Kittle", pos: "TE", team: "SF", gp: 16, totTd: 10, redzone: { tgt: 22, rec: 16, yds: 88, td: 9 }, inside10: { tgt: 12, rec: 9, yds: 38, td: 7 }, inside5: { tgt: 7, rec: 5, yds: 14, td: 5 } },
  { name: "Tyreek Hill", pos: "WR", team: "MIA", gp: 17, totTd: 10, redzone: { tgt: 20, rec: 14, yds: 98, td: 8 }, inside10: { tgt: 10, rec: 7, yds: 40, td: 6 }, inside5: { tgt: 5, rec: 4, yds: 14, td: 4 } },
  { name: "A.J. Brown", pos: "WR", team: "PHI", gp: 15, totTd: 10, redzone: { tgt: 22, rec: 15, yds: 105, td: 9 }, inside10: { tgt: 11, rec: 8, yds: 42, td: 7 }, inside5: { tgt: 6, rec: 4, yds: 12, td: 4 } },
  { name: "Davante Adams", pos: "WR", team: "NYJ", gp: 17, totTd: 9, redzone: { tgt: 24, rec: 16, yds: 110, td: 8 }, inside10: { tgt: 12, rec: 8, yds: 38, td: 6 }, inside5: { tgt: 7, rec: 5, yds: 16, td: 5 } },
  { name: "Sam LaPorta", pos: "TE", team: "DET", gp: 17, totTd: 9, redzone: { tgt: 20, rec: 14, yds: 78, td: 8 }, inside10: { tgt: 10, rec: 7, yds: 30, td: 6 }, inside5: { tgt: 6, rec: 4, yds: 10, td: 4 } },
  { name: "Malik Nabers", pos: "WR", team: "NYG", gp: 16, totTd: 9, redzone: { tgt: 22, rec: 14, yds: 96, td: 7 }, inside10: { tgt: 11, rec: 7, yds: 36, td: 5 }, inside5: { tgt: 6, rec: 4, yds: 12, td: 4 } },
  { name: "Mike Evans", pos: "WR", team: "TB", gp: 17, totTd: 8, redzone: { tgt: 26, rec: 15, yds: 108, td: 7 }, inside10: { tgt: 14, rec: 8, yds: 44, td: 5 }, inside5: { tgt: 8, rec: 4, yds: 14, td: 3 } },
]

export type PositionTab = "passing" | "rushing" | "receiving"
