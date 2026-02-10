import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "MLB NRFI Stats - No Run First Inning Analytics | HeatCheck HQ",
  description: "NRFI (No Run First Inning) statistics and probabilities for MLB games. Track pitcher and team first inning performance, streaks, and betting insights.",
  path: "/mlb/nrfi",
  keywords: [
    "NRFI",
    "no run first inning",
    "MLB first inning",
    "NRFI stats",
    "NRFI betting",
    "first inning analytics",
    "MLB betting",
  ],
})

export default function NRFILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
