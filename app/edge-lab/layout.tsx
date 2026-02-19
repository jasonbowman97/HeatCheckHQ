import { ProtectedPage } from "@/components/protected-page"

export default function EdgeLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/edge-lab">
      {children}
    </ProtectedPage>
  )
}
