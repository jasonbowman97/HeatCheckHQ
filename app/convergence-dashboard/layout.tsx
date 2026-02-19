import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Convergence Dashboard - Cross-Sport Signal Overview | HeatCheck HQ",
  description: "See convergence signals across MLB, NBA & NFL in one view. Track where multiple data points align on player props to find the strongest edges.",
  path: "/convergence-dashboard",
  keywords: ["convergence dashboard", "cross-sport signals", "prop convergence", "sports analytics signals"],
})

export default function ConvergenceDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/convergence-dashboard">
      {children}
    </ProtectedPage>
  )
}
