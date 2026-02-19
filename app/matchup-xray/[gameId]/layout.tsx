import { ProtectedPage } from "@/components/protected-page"

export default function MatchupXrayLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/matchup-xray">
      {children}
    </ProtectedPage>
  )
}
