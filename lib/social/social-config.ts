/**
 * Brand constants for social media cheat sheet graphics.
 * All colors are hex (not HSL CSS vars) because Satori needs direct values.
 */

/* ── Colors ── */

export const COLORS = {
  background: "#0d1117",
  backgroundAlt: "#151b24",
  foreground: "#e3e8ef",
  primary: "#2dd4a8",
  primaryMuted: "rgba(45, 212, 168, 0.15)",
  muted: "#7b8794",
  border: "#272f3a",
  card: "#161b22",
  accent: "#f59e0b",

  // Semantic
  green: "#22c55e",
  greenBg: "rgba(34, 197, 94, 0.15)",
  amber: "#f59e0b",
  amberBg: "rgba(245, 158, 11, 0.15)",
  red: "#ef4444",
  redBg: "rgba(239, 68, 68, 0.15)",
  gray: "#6b7280",
  grayBg: "rgba(107, 114, 128, 0.10)",
} as const

/* ── Teal Gradient (header) ── */

export const GRADIENT = {
  /** Darkest layer — base of the gradient */
  base: "#0a1a1a",
  /** Mid-tone teal at 60% opacity */
  mid: "#0d9373",
  /** Bright teal at 40% opacity */
  bright: "#2dd4a8",
} as const

/* ── Sport Accent Colors (4px stripe below header) ── */

export type Sport = "nba" | "mlb" | "nfl" | "multi"

export const SPORT_ACCENT: Record<Sport, string> = {
  nba: "#F97316",  // warm orange — basketball color, indoor energy
  mlb: "#3B82F6",  // deep blue — blue sky, stats-heavy trust
  nfl: "#10B981",  // emerald green — green turf, harmonious with brand
  multi: "#2dd4a8", // brand teal — default for cross-sport content
} as const

/* ── Social Handle & CTA ── */

export const SOCIAL = {
  handle: "@HEATCHECKIO",
  cta: "FREE DAILY ANALYTICS",
  url: "HEATCHECKHQ.IO",
} as const

/* ── Glow / Highlight ── */

export const GLOW = {
  /** Subtle teal glow for stat highlights */
  teal: "rgba(45, 212, 168, 0.25)",
  /** Slightly brighter for hit streaks */
  tealBright: "rgba(45, 212, 168, 0.40)",
} as const

/* ── Typography ── */

export const FONTS = {
  bold: "Inter-Bold",
  semibold: "Inter-SemiBold",
  regular: "Inter-Regular",
} as const

/* ── Layout ── */

export const SHEET = {
  /** Standard cheat sheet: 4:5 ratio, fits lots of rows */
  width: 1200,
  height: 1500,
  /** Compact card: 16:9 ratio for recap/summary */
  compactWidth: 1200,
  compactHeight: 675,
  padding: 40,
  /** Premium header: gradient + title + sport stripe */
  headerHeight: 130,
  footerHeight: 64,
  rowHeight: 52,
  /** Sport accent stripe height */
  accentStripeHeight: 4,
} as const

/* ── Logo SVG path data (Concept D: ascending bars + flame) ── */

export const LOGO_PATHS = {
  bar1: { d: "M3,17 L7,17 L7,22 L3,22 Z", opacity: 0.4 },
  bar2: { d: "M10,13 L14,13 L14,22 L10,22 Z", opacity: 0.65 },
  bar3: { d: "M17,10 L21,10 L21,22 L17,22 Z", opacity: 0.9 },
  flameOuter:
    "M19 10c0 0-2.8-3.5-2.8-6.3c0-1.5 0.8-2.7 1.5-3.3c0.3 1.1 1.1 2 1.9 2.7c0.8 0.8 1.5 1.7 1.5 3c0 2-1.2 3.9-2.1 3.9z",
  flameInner:
    "M19 10c0 0-1.2-1.5-1.2-2.8c0-0.7 0.35-1.2 0.6-1.5c0.13 0.5 0.5 0.9 0.85 1.2c0.35 0.35 0.65 0.8 0.65 1.5c0 0.9-0.5 1.6-0.9 1.6z",
} as const

export const BRAND = {
  name: "HeatCheck HQ",
  url: "heatcheckhq.io",
  tagline: "Your daily heat checks for every play",
} as const

/* ── Social Persona ── */

export const PERSONA = {
  name: "Velma",
  handle: "@HeatCheckHQ",
  voice: "confident, data-driven, playful — she brings the receipts and the personality",
} as const
