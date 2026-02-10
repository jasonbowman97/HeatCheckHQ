export interface PitcherStats {
  id: string
  name: string
  team: string
  hand: "L" | "R"
  era: number
  kPerGame: number
  kPct: number
  cswPct: number
  inningsPitched: number
  oppKPctL30: number
  hr9: number
  barrelPct: number
  hardHitPct: number
  hrFbPct: number
  flyBallPct: number
  pulledAirPct: number
  arsenal: PitchArsenalEntry[]
}

export interface PitchArsenalEntry {
  pitch: string
  usagePct: number
  avg: number
  slg: number
  iso: number
  hr: number
  barrelPct: number
  hardHitPct: number
}

export function getHeatmapColor(value: number, min: number, max: number): string {
  if (max === min) return "bg-secondary text-foreground"
  const ratio = (value - min) / (max - min)
  if (ratio <= 0.2) return "bg-red-500/20 text-red-400"
  if (ratio <= 0.4) return "bg-orange-500/20 text-orange-400"
  if (ratio <= 0.6) return "bg-yellow-500/20 text-yellow-300"
  if (ratio <= 0.8) return "bg-emerald-500/20 text-emerald-400"
  return "bg-green-500/20 text-green-400"
}

// Inverted: lower is better (for ERA, HR/9, Barrel%, Hard-Hit%)
export function getHeatmapColorInverted(value: number, min: number, max: number): string {
  if (max === min) return "bg-secondary text-foreground"
  const ratio = (value - min) / (max - min)
  if (ratio <= 0.2) return "bg-green-500/20 text-green-400"
  if (ratio <= 0.4) return "bg-emerald-500/20 text-emerald-400"
  if (ratio <= 0.6) return "bg-yellow-500/20 text-yellow-300"
  if (ratio <= 0.8) return "bg-orange-500/20 text-orange-400"
  return "bg-red-500/20 text-red-400"
}

export const pitchers: PitcherStats[] = [
  {
    id: "lauer", name: "Eric Lauer", team: "CWS", hand: "L", era: 3.92,
    kPerGame: 3.9, kPct: 24.2, cswPct: 29.5, inningsPitched: 26.0, oppKPctL30: 32.5,
    hr9: 1.03, barrelPct: 5.7, hardHitPct: 34.58, hrFbPct: 11.8, flyBallPct: 32.86, pulledAirPct: 17.5,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 42, avg: 0.231, slg: 0.364, iso: 0.133, hr: 3, barrelPct: 6, hardHitPct: 42 },
      { pitch: "Changeup", usagePct: 24, avg: 0.205, slg: 0.318, iso: 0.113, hr: 1, barrelPct: 4, hardHitPct: 31 },
      { pitch: "Slider", usagePct: 22, avg: 0.188, slg: 0.271, iso: 0.083, hr: 1, barrelPct: 3, hardHitPct: 28 },
      { pitch: "Curveball", usagePct: 12, avg: 0.167, slg: 0.222, iso: 0.055, hr: 0, barrelPct: 2, hardHitPct: 22 },
    ],
  },
  {
    id: "giolito", name: "Lucas Giolito", team: "BOS", hand: "R", era: 4.78,
    kPerGame: 4.8, kPct: 21.2, cswPct: 27.0, inningsPitched: 51.2, oppKPctL30: 27.8,
    hr9: 1.42, barrelPct: 7.2, hardHitPct: 38.90, hrFbPct: 14.3, flyBallPct: 29.10, pulledAirPct: 19.8,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 38, avg: 0.258, slg: 0.442, iso: 0.184, hr: 5, barrelPct: 8, hardHitPct: 44 },
      { pitch: "Changeup", usagePct: 22, avg: 0.215, slg: 0.349, iso: 0.134, hr: 3, barrelPct: 7, hardHitPct: 34 },
      { pitch: "Slider", usagePct: 28, avg: 0.198, slg: 0.301, iso: 0.103, hr: 2, barrelPct: 5, hardHitPct: 30 },
      { pitch: "Curveball", usagePct: 12, avg: 0.176, slg: 0.244, iso: 0.068, hr: 1, barrelPct: 3, hardHitPct: 25 },
    ],
  },
  {
    id: "luzardo", name: "Jesus Luzardo", team: "PHI", hand: "L", era: 3.41,
    kPerGame: 6.4, kPct: 26.4, cswPct: 30.8, inningsPitched: 72.2, oppKPctL30: 26.5,
    hr9: 0.87, barrelPct: 4.9, hardHitPct: 32.10, hrFbPct: 9.8, flyBallPct: 35.20, pulledAirPct: 15.2,
    arsenal: [
      { pitch: "Sinker", usagePct: 34, avg: 0.221, slg: 0.330, iso: 0.109, hr: 2, barrelPct: 5, hardHitPct: 36 },
      { pitch: "Changeup", usagePct: 27, avg: 0.195, slg: 0.289, iso: 0.094, hr: 2, barrelPct: 4, hardHitPct: 29 },
      { pitch: "Slider", usagePct: 21, avg: 0.178, slg: 0.267, iso: 0.089, hr: 1, barrelPct: 3, hardHitPct: 26 },
      { pitch: "Cutter", usagePct: 18, avg: 0.210, slg: 0.345, iso: 0.135, hr: 2, barrelPct: 6, hardHitPct: 33 },
    ],
  },
  {
    id: "rocker", name: "Kumar Rocker", team: "TEX", hand: "R", era: 4.12,
    kPerGame: 4.1, kPct: 19.7, cswPct: 27.2, inningsPitched: 33.2, oppKPctL30: 25.4,
    hr9: 1.34, barrelPct: 6.5, hardHitPct: 37.40, hrFbPct: 13.1, flyBallPct: 30.50, pulledAirPct: 18.6,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 45, avg: 0.245, slg: 0.410, iso: 0.165, hr: 4, barrelPct: 7, hardHitPct: 41 },
      { pitch: "Slider", usagePct: 30, avg: 0.201, slg: 0.312, iso: 0.111, hr: 2, barrelPct: 5, hardHitPct: 32 },
      { pitch: "Changeup", usagePct: 15, avg: 0.220, slg: 0.350, iso: 0.130, hr: 1, barrelPct: 6, hardHitPct: 35 },
      { pitch: "Curveball", usagePct: 10, avg: 0.180, slg: 0.260, iso: 0.080, hr: 0, barrelPct: 2, hardHitPct: 24 },
    ],
  },
  {
    id: "elder", name: "Bryce Elder", team: "ATL", hand: "R", era: 4.38,
    kPerGame: 4.4, kPct: 19.6, cswPct: 26.9, inningsPitched: 66.0, oppKPctL30: 24.8,
    hr9: 1.22, barrelPct: 6.1, hardHitPct: 36.20, hrFbPct: 12.6, flyBallPct: 31.40, pulledAirPct: 17.9,
    arsenal: [
      { pitch: "Sinker", usagePct: 40, avg: 0.252, slg: 0.388, iso: 0.136, hr: 3, barrelPct: 6, hardHitPct: 39 },
      { pitch: "Slider", usagePct: 25, avg: 0.210, slg: 0.320, iso: 0.110, hr: 2, barrelPct: 5, hardHitPct: 31 },
      { pitch: "Changeup", usagePct: 20, avg: 0.228, slg: 0.355, iso: 0.127, hr: 2, barrelPct: 5, hardHitPct: 34 },
      { pitch: "Four-Seam Fastball", usagePct: 15, avg: 0.240, slg: 0.400, iso: 0.160, hr: 2, barrelPct: 7, hardHitPct: 40 },
    ],
  },
  {
    id: "peterson", name: "David Peterson", team: "NYM", hand: "L", era: 5.10,
    kPerGame: 5.1, kPct: 21.7, cswPct: 27.9, inningsPitched: 70.2, oppKPctL30: 24.6,
    hr9: 1.54, barrelPct: 5.68, hardHitPct: 41.73, hrFbPct: 20.79, flyBallPct: 24.69, pulledAirPct: 15.8,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 36, avg: 0.268, slg: 0.458, iso: 0.190, hr: 6, barrelPct: 9, hardHitPct: 46 },
      { pitch: "Cutter", usagePct: 24, avg: 0.232, slg: 0.380, iso: 0.148, hr: 3, barrelPct: 6, hardHitPct: 38 },
      { pitch: "Changeup", usagePct: 22, avg: 0.210, slg: 0.325, iso: 0.115, hr: 2, barrelPct: 5, hardHitPct: 33 },
      { pitch: "Slider", usagePct: 18, avg: 0.195, slg: 0.290, iso: 0.095, hr: 1, barrelPct: 4, hardHitPct: 29 },
    ],
  },
  {
    id: "bubic", name: "Kris Bubic", team: "KC", hand: "L", era: 6.28,
    kPerGame: 6.3, kPct: 26.9, cswPct: 31.7, inningsPitched: 75.1, oppKPctL30: 24.6,
    hr9: 1.67, barrelPct: 7.8, hardHitPct: 42.50, hrFbPct: 18.4, flyBallPct: 27.80, pulledAirPct: 20.1,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 30, avg: 0.272, slg: 0.480, iso: 0.208, hr: 7, barrelPct: 10, hardHitPct: 48 },
      { pitch: "Curveball", usagePct: 28, avg: 0.198, slg: 0.305, iso: 0.107, hr: 2, barrelPct: 4, hardHitPct: 30 },
      { pitch: "Changeup", usagePct: 25, avg: 0.225, slg: 0.370, iso: 0.145, hr: 3, barrelPct: 6, hardHitPct: 36 },
      { pitch: "Slider", usagePct: 17, avg: 0.205, slg: 0.310, iso: 0.105, hr: 1, barrelPct: 5, hardHitPct: 32 },
    ],
  },
  {
    id: "spence", name: "Mitch Spence", team: "OAK", hand: "R", era: 2.10,
    kPerGame: 2.1, kPct: 19.9, cswPct: 27.7, inningsPitched: 58.2, oppKPctL30: 23.8,
    hr9: 0.76, barrelPct: 4.2, hardHitPct: 30.50, hrFbPct: 8.9, flyBallPct: 33.10, pulledAirPct: 14.3,
    arsenal: [
      { pitch: "Sinker", usagePct: 38, avg: 0.218, slg: 0.310, iso: 0.092, hr: 1, barrelPct: 4, hardHitPct: 32 },
      { pitch: "Slider", usagePct: 28, avg: 0.185, slg: 0.262, iso: 0.077, hr: 1, barrelPct: 3, hardHitPct: 26 },
      { pitch: "Changeup", usagePct: 20, avg: 0.200, slg: 0.298, iso: 0.098, hr: 1, barrelPct: 4, hardHitPct: 29 },
      { pitch: "Four-Seam Fastball", usagePct: 14, avg: 0.230, slg: 0.355, iso: 0.125, hr: 1, barrelPct: 5, hardHitPct: 35 },
    ],
  },
  {
    id: "evans", name: "Logan Evans", team: "SEA", hand: "R", era: 4.08,
    kPerGame: 4.1, kPct: 18.0, cswPct: 26.4, inningsPitched: 40.0, oppKPctL30: 23.7,
    hr9: 1.13, barrelPct: 5.4, hardHitPct: 35.80, hrFbPct: 11.5, flyBallPct: 30.90, pulledAirPct: 16.8,
    arsenal: [
      { pitch: "Sinker", usagePct: 42, avg: 0.240, slg: 0.375, iso: 0.135, hr: 2, barrelPct: 6, hardHitPct: 38 },
      { pitch: "Slider", usagePct: 26, avg: 0.195, slg: 0.288, iso: 0.093, hr: 1, barrelPct: 4, hardHitPct: 28 },
      { pitch: "Changeup", usagePct: 18, avg: 0.215, slg: 0.340, iso: 0.125, hr: 1, barrelPct: 5, hardHitPct: 34 },
      { pitch: "Curveball", usagePct: 14, avg: 0.178, slg: 0.245, iso: 0.067, hr: 0, barrelPct: 2, hardHitPct: 23 },
    ],
  },
  {
    id: "senzatela", name: "Antonio Senzatela", team: "COL", hand: "R", era: 2.60,
    kPerGame: 2.6, kPct: 10.9, cswPct: 23.2, inningsPitched: 76.1, oppKPctL30: 23.6,
    hr9: 0.82, barrelPct: 4.5, hardHitPct: 31.20, hrFbPct: 9.4, flyBallPct: 34.50, pulledAirPct: 15.0,
    arsenal: [
      { pitch: "Sinker", usagePct: 48, avg: 0.235, slg: 0.340, iso: 0.105, hr: 2, barrelPct: 5, hardHitPct: 34 },
      { pitch: "Four-Seam Fastball", usagePct: 20, avg: 0.248, slg: 0.390, iso: 0.142, hr: 2, barrelPct: 6, hardHitPct: 38 },
      { pitch: "Slider", usagePct: 18, avg: 0.195, slg: 0.280, iso: 0.085, hr: 1, barrelPct: 3, hardHitPct: 27 },
      { pitch: "Changeup", usagePct: 14, avg: 0.210, slg: 0.315, iso: 0.105, hr: 1, barrelPct: 4, hardHitPct: 30 },
    ],
  },
  {
    id: "alcantara", name: "Sandy Alcantara", team: "MIA", hand: "R", era: 3.88,
    kPerGame: 3.9, kPct: 17.9, cswPct: 25.7, inningsPitched: 74.0, oppKPctL30: 23.6,
    hr9: 0.97, barrelPct: 5.1, hardHitPct: 33.50, hrFbPct: 10.8, flyBallPct: 32.40, pulledAirPct: 16.2,
    arsenal: [
      { pitch: "Sinker", usagePct: 40, avg: 0.228, slg: 0.348, iso: 0.120, hr: 2, barrelPct: 5, hardHitPct: 36 },
      { pitch: "Changeup", usagePct: 22, avg: 0.198, slg: 0.295, iso: 0.097, hr: 1, barrelPct: 4, hardHitPct: 29 },
      { pitch: "Slider", usagePct: 20, avg: 0.185, slg: 0.275, iso: 0.090, hr: 1, barrelPct: 3, hardHitPct: 27 },
      { pitch: "Four-Seam Fastball", usagePct: 18, avg: 0.245, slg: 0.405, iso: 0.160, hr: 3, barrelPct: 7, hardHitPct: 40 },
    ],
  },
  {
    id: "horton", name: "Cade Horton", team: "CHC", hand: "R", era: 3.82,
    kPerGame: 3.8, kPct: 17.6, cswPct: 28.2, inningsPitched: 41.0, oppKPctL30: 23.3,
    hr9: 1.10, barrelPct: 5.6, hardHitPct: 34.90, hrFbPct: 11.2, flyBallPct: 31.80, pulledAirPct: 17.1,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 44, avg: 0.238, slg: 0.385, iso: 0.147, hr: 3, barrelPct: 6, hardHitPct: 38 },
      { pitch: "Curveball", usagePct: 24, avg: 0.178, slg: 0.250, iso: 0.072, hr: 0, barrelPct: 2, hardHitPct: 22 },
      { pitch: "Slider", usagePct: 20, avg: 0.195, slg: 0.305, iso: 0.110, hr: 1, barrelPct: 4, hardHitPct: 30 },
      { pitch: "Changeup", usagePct: 12, avg: 0.215, slg: 0.348, iso: 0.133, hr: 1, barrelPct: 5, hardHitPct: 35 },
    ],
  },
  {
    id: "cease", name: "Dylan Cease", team: "SD", hand: "R", era: 6.72,
    kPerGame: 6.7, kPct: 29.2, cswPct: 30.3, inningsPitched: 87.1, oppKPctL30: 23.2,
    hr9: 1.55, barrelPct: 7.5, hardHitPct: 40.20, hrFbPct: 16.8, flyBallPct: 28.50, pulledAirPct: 19.5,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 40, avg: 0.265, slg: 0.468, iso: 0.203, hr: 8, barrelPct: 9, hardHitPct: 45 },
      { pitch: "Slider", usagePct: 32, avg: 0.192, slg: 0.298, iso: 0.106, hr: 2, barrelPct: 4, hardHitPct: 29 },
      { pitch: "Knuckle Curve", usagePct: 18, avg: 0.175, slg: 0.255, iso: 0.080, hr: 1, barrelPct: 3, hardHitPct: 25 },
      { pitch: "Changeup", usagePct: 10, avg: 0.230, slg: 0.380, iso: 0.150, hr: 2, barrelPct: 6, hardHitPct: 37 },
    ],
  },
  {
    id: "sugano", name: "Tomoyuki Sugano", team: "BAL", hand: "R", era: 3.42,
    kPerGame: 3.4, kPct: 14.4, cswPct: 24.2, inningsPitched: 83.2, oppKPctL30: 22.6,
    hr9: 0.86, barrelPct: 4.3, hardHitPct: 30.80, hrFbPct: 9.2, flyBallPct: 33.60, pulledAirPct: 14.8,
    arsenal: [
      { pitch: "Splitter", usagePct: 30, avg: 0.195, slg: 0.288, iso: 0.093, hr: 2, barrelPct: 4, hardHitPct: 28 },
      { pitch: "Four-Seam Fastball", usagePct: 28, avg: 0.232, slg: 0.365, iso: 0.133, hr: 3, barrelPct: 6, hardHitPct: 36 },
      { pitch: "Slider", usagePct: 22, avg: 0.188, slg: 0.272, iso: 0.084, hr: 1, barrelPct: 3, hardHitPct: 26 },
      { pitch: "Curveball", usagePct: 20, avg: 0.175, slg: 0.248, iso: 0.073, hr: 1, barrelPct: 2, hardHitPct: 24 },
    ],
  },
  {
    id: "littell", name: "Zack Littell", team: "TB", hand: "R", era: 4.18,
    kPerGame: 4.2, kPct: 16.3, cswPct: 25.3, inningsPitched: 80.2, oppKPctL30: 22.2,
    hr9: 1.12, barrelPct: 5.3, hardHitPct: 34.50, hrFbPct: 11.0, flyBallPct: 31.60, pulledAirPct: 16.5,
    arsenal: [
      { pitch: "Sinker", usagePct: 36, avg: 0.238, slg: 0.362, iso: 0.124, hr: 3, barrelPct: 5, hardHitPct: 37 },
      { pitch: "Slider", usagePct: 26, avg: 0.198, slg: 0.295, iso: 0.097, hr: 1, barrelPct: 4, hardHitPct: 29 },
      { pitch: "Cutter", usagePct: 22, avg: 0.215, slg: 0.340, iso: 0.125, hr: 2, barrelPct: 5, hardHitPct: 33 },
      { pitch: "Changeup", usagePct: 16, avg: 0.208, slg: 0.318, iso: 0.110, hr: 1, barrelPct: 4, hardHitPct: 31 },
    ],
  },
  {
    id: "abbott", name: "Andrew Abbott", team: "CIN", hand: "L", era: 3.56,
    kPerGame: 5.8, kPct: 25.1, cswPct: 30.2, inningsPitched: 68.1, oppKPctL30: 28.2,
    hr9: 0.92, barrelPct: 4.8, hardHitPct: 32.40, hrFbPct: 10.1, flyBallPct: 33.80, pulledAirPct: 15.6,
    arsenal: [
      { pitch: "Four-Seam Fastball", usagePct: 42, avg: 0.231, slg: 0.364, iso: 0.133, hr: 7, barrelPct: 6, hardHitPct: 42 },
      { pitch: "Changeup", usagePct: 22, avg: 0.215, slg: 0.349, iso: 0.134, hr: 5, barrelPct: 7, hardHitPct: 34 },
      { pitch: "Curveball", usagePct: 15, avg: 0.253, slg: 0.337, iso: 0.084, hr: 2, barrelPct: 2, hardHitPct: 31 },
      { pitch: "Sweeper", usagePct: 11, avg: 0.229, slg: 0.414, iso: 0.186, hr: 3, barrelPct: 4, hardHitPct: 29 },
      { pitch: "Cutter", usagePct: 4, avg: 0.333, slg: 0.667, iso: 0.333, hr: 2, barrelPct: 17, hardHitPct: 48 },
    ],
  },
]
