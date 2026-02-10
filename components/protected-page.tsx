import { getUserTier } from "@/lib/get-user-tier"
import { getRouteAccess } from "@/lib/access-control"
import { Paywall } from "@/components/paywall"

interface ProtectedPageProps {
  pathname: string
  children: React.ReactNode
}

export async function ProtectedPage({ pathname, children }: ProtectedPageProps) {
  const userTier = await getUserTier()
  const routeAccess = getRouteAccess(pathname)

  if (!routeAccess || routeAccess.tier === "public") {
    return <>{children}</>
  }

  return (
    <Paywall requiredTier={routeAccess.tier} userTier={userTier}>
      {children}
    </Paywall>
  )
}
