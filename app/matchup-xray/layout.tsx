import { ProtectedPage } from "@/components/protected-page"

export default function MatchupXRayLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedPage pathname="/matchup-xray">{children}</ProtectedPage>
}
