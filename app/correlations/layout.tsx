import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Prop Correlations - Correlation Matrix | HeatCheck HQ",
  description: "Find correlated player props for smarter parlays. See which stats move together and build data-backed same-game parlays across MLB, NBA & NFL.",
  path: "/correlations",
  keywords: ["prop correlations", "correlation matrix", "same game parlay correlations", "correlated props"],
})

export default function CorrelationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/correlations">
      {children}
    </ProtectedPage>
  )
}
