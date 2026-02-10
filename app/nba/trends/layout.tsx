import { ProtectedPage } from "@/components/protected-page"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedPage pathname="/nba/trends">{children}</ProtectedPage>
}
