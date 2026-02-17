import { getUserTier } from "@/lib/get-user-tier"
import { getRouteAccess } from "@/lib/access-control"
import { UserTierProvider } from "@/components/user-tier-provider"
import { Paywall } from "@/components/paywall"

interface ProtectedPageProps {
  pathname: string
  children: React.ReactNode
}

export async function ProtectedPage({ pathname, children }: ProtectedPageProps) {
  const userTier = await getUserTier()
  const routeAccess = getRouteAccess(pathname)

  if (!routeAccess || routeAccess.tier === "public") {
    return (
      <UserTierProvider tier={userTier}>
        {children}
      </UserTierProvider>
    )
  }

  return (
    <UserTierProvider tier={userTier}>
      <Paywall requiredTier={routeAccess.tier} userTier={userTier}>
        {children}
      </Paywall>
    </UserTierProvider>
  )
}
