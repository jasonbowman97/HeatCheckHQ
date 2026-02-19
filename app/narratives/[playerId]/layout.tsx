import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Player Narratives - Trend & Story Analysis | HeatCheck HQ",
  description: "Deep player narrative analysis with trend breakdowns, recent performance stories, and data-driven context for smarter prop decisions.",
  path: "/narratives",
  keywords: ["player narratives", "player trend analysis", "prop betting stories", "player performance trends"],
})

export default function NarrativeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/narratives">
      {children}
    </ProtectedPage>
  )
}
