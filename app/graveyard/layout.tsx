import { ProtectedPage } from "@/components/protected-page"

export default function GraveyardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/graveyard">
      {children}
    </ProtectedPage>
  )
}
