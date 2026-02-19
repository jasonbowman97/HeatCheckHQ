import { ProtectedPage } from "@/components/protected-page"

export default function CorrelationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/correlations">
      {children}
    </ProtectedPage>
  )
}
