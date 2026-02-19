import { ProtectedPage } from "@/components/protected-page"

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/check">
      {children}
    </ProtectedPage>
  )
}
