"use client"

import type { Player } from "@/lib/players-data"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCards } from "@/components/stat-cards"
import { FiltersBar } from "@/components/filters-bar"
import { GameLogTable } from "@/components/game-log-table"

interface PlayerDetailProps {
  player: Player
  onBack: () => void
}

export function PlayerDetail({ player, onBack }: PlayerDetailProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader showBack onBack={onBack} playerName={player.name} />
      <main className="mx-auto max-w-[1440px] px-6 py-6 flex flex-col gap-6">
        <StatCards player={player} />
        <FiltersBar variant="detail" />
        <GameLogTable player={player} />
      </main>
    </div>
  )
}
