// ============================================================
// components/app-shell.tsx — Thin client wrapper for DashboardShell
// ============================================================
// Used by server-component pages that need the app navigation.
// Client-component pages can import DashboardShell directly.

"use client"

import { DashboardShell } from "@/components/dashboard-shell"

interface AppShellProps {
  children: React.ReactNode
  subtitle?: string
}

export function AppShell({ children, subtitle }: AppShellProps) {
  return <DashboardShell subtitle={subtitle}>{children}</DashboardShell>
}
