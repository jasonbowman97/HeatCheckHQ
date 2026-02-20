import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Prop Analyzer — Player Prop Analysis & Convergence Engine | HeatCheck HQ",
  description: "Analyze any player's props with our 9-factor convergence engine. See all prop lines, hit rates, and verdicts for MLB, NBA & NFL players at a glance.",
  path: "/check",
  keywords: ["prop analyzer", "player prop analysis", "prop bet analyzer", "convergence engine", "check my prop"],
})

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/check">
      {children}
    </ProtectedPage>
  )
}
