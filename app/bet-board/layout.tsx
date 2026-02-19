import { ProtectedPage } from "@/components/protected-page"

export default function BetBoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/bet-board">
      {children}
    </ProtectedPage>
  )
}
