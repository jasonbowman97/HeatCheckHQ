import { ProtectedPage } from "@/components/protected-page"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedPage pathname="/nba/defense-vs-position">{children}</ProtectedPage>
}
