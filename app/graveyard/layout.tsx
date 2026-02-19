import { generateSEO } from "@/lib/seo"
import { ProtectedPage } from "@/components/protected-page"

export const metadata = generateSEO({
  title: "Graveyard - Bad Beat Autopsy & Prop Analysis | HeatCheck HQ",
  description: "Dissect your worst bad beats with data. See what went wrong and learn from near-misses with detailed prop autopsy across MLB, NBA & NFL.",
  path: "/graveyard",
  keywords: ["bad beat analysis", "prop autopsy", "sports betting graveyard", "near miss props"],
})

export default function GraveyardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/graveyard">
      {children}
    </ProtectedPage>
  )
}
