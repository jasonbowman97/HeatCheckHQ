import { ProtectedPage } from "@/components/protected-page"

export default function NarrativeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/check">
      {children}
    </ProtectedPage>
  )
}
