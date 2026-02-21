"use client"

/** Game window sizes for PBP-powered dashboards */
export type GameWindow = 5 | 10 | 20 | "season"

export const GAME_WINDOW_OPTIONS: { value: GameWindow; label: string }[] = [
  { value: 5, label: "L5" },
  { value: 10, label: "L10" },
  { value: 20, label: "L20" },
  { value: "season", label: "Season" },
]

interface GameWindowFilterProps {
  value: GameWindow
  onChange: (window: GameWindow) => void
  className?: string
}

export function GameWindowFilter({ value, onChange, className = "" }: GameWindowFilterProps) {
  return (
    <div
      className={`flex rounded-lg border border-border overflow-hidden ${className}`}
      role="group"
      aria-label="Game window filter"
    >
      {GAME_WINDOW_OPTIONS.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
