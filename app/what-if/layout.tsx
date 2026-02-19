import { ProtectedPage } from "@/components/protected-page"

export default function WhatIfLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage pathname="/what-if">
      {children}
    </ProtectedPage>
  )
}
