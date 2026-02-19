import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Check My Prop - Player Prop Validator & Convergence Engine | HeatCheck HQ",
  description: "Validate any player prop bet with our convergence engine. Get data-driven verdicts on over/under lines across MLB, NBA & NFL with advanced stat analysis.",
  path: "/check",
  keywords: ["check my prop", "player prop validator", "prop bet analyzer", "convergence engine"],
})

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/check">
      {children}
    </ProtectedPage>
  )
}
