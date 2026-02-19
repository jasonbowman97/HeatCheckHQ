import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Edge Lab - Custom Filters & Strategy Builder | HeatCheck HQ",
  description: "Build custom prop filters and backtest strategies against historical data. Create, save, and refine your edge with the Edge Lab strategy builder.",
  path: "/edge-lab",
  keywords: ["edge lab", "custom prop filters", "sports strategy builder", "backtest props"],
})

export default function EdgeLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/edge-lab">
      {children}
    </ProtectedPage>
  )
}
