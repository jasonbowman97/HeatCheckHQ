"use client"

import { createContext, useContext } from "react"

type UserTier = "anonymous" | "free" | "pro"

const UserTierContext = createContext<UserTier>("anonymous")

export function UserTierProvider({
  tier,
  children,
}: {
  tier: UserTier
  children: React.ReactNode
}) {
  return (
    <UserTierContext.Provider value={tier}>
      {children}
    </UserTierContext.Provider>
  )
}

export function useUserTier(): UserTier {
  return useContext(UserTierContext)
}
