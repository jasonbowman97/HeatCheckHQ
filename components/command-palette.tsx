"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  SearchCheck,
  Radio,
  Bell,
  Flame,
  Clock,
  ArrowRight,
  Command,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import type { PlayerSearchResult } from "@/types/shared"
import { trackEvent } from "@/lib/analytics"
import { commandEvents } from "@/lib/command-events"

/* ─── Quick navigation pages ─── */

interface QuickNav {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  group: string
}

const QUICK_NAV: QuickNav[] = [
  { label: "Prop Analyzer", href: "/check", icon: SearchCheck, description: "Analyze any player's props", group: "Tools" },
  { label: "Situation Room", href: "/situation-room", icon: Radio, description: "Live game-day command center", group: "Tools" },
  { label: "Alerts", href: "/alerts", icon: Bell, description: "Research-based alerts", group: "Tools" },
  { label: "MLB Hot Hitters", href: "/mlb/hot-hitters", icon: Flame, description: "Today's hottest hitters", group: "MLB" },
  { label: "Hitter vs Pitcher", href: "/mlb/hitting-stats", icon: SearchCheck, description: "Matchup analysis", group: "MLB" },
  { label: "NRFI", href: "/mlb/nrfi", icon: SearchCheck, description: "No Run First Inning picks", group: "MLB" },
  { label: "First Basket", href: "/nba/first-basket", icon: SearchCheck, description: "NBA first scorer picks", group: "NBA" },
  { label: "Defense vs Position", href: "/nba/defense-vs-position", icon: SearchCheck, description: "NBA defensive rankings", group: "NBA" },
  { label: "NFL Matchup", href: "/nfl/matchup", icon: SearchCheck, description: "NFL team matchups", group: "NFL" },
]

/* ─── Recent players from localStorage ─── */

const RECENT_PLAYERS_KEY = "prop-analyzer-recent"

function getRecentPlayers(): PlayerSearchResult[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_PLAYERS_KEY) || "[]")
  } catch {
    return []
  }
}

/* ─── Component ─── */

export function CommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PlayerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [recentPlayers, setRecentPlayers] = useState<PlayerSearchResult[]>([])
  const debounceRef = useRef<NodeJS.Timeout>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Load recent players when opened
  useEffect(() => {
    if (open) {
      setRecentPlayers(getRecentPlayers())
      setQuery("")
      setResults([])
      trackEvent("command_palette_opened")
    }
  }, [open])

  // Debounced player search
  const searchPlayers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearching(true)
    try {
      const res = await fetch(
        `/api/players/search?q=${encodeURIComponent(searchQuery)}&limit=6`,
        { signal: controller.signal }
      )
      const data = await res.json()
      if (!controller.signal.aborted) {
        setResults(data.results ?? [])
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setResults([])
    } finally {
      if (!controller.signal.aborted) {
        setSearching(false)
      }
    }
  }, [])

  const handleValueChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => searchPlayers(value), 150)
    },
    [searchPlayers]
  )

  // Navigate to a page
  const handleNavigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  // Select a player → navigate to /check with player param
  const handleSelectPlayer = useCallback(
    (player: PlayerSearchResult) => {
      setOpen(false)
      trackEvent("command_palette_player_selected", {
        player_name: player.name,
        sport: player.sport,
      })

      if (pathname === "/check") {
        // Already on the analyzer page — emit event to trigger analysis
        commandEvents.emitPlayerSelect(player.id)
      } else {
        router.push(`/check?player=${player.id}`)
      }
    },
    [router, pathname]
  )

  // Filter quick nav items based on query
  const filteredNav =
    query.length > 0
      ? QUICK_NAV.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.group.toLowerCase().includes(query.toLowerCase())
        )
      : []

  // Group filtered nav by their group
  const groupedNav = filteredNav.reduce<Record<string, QuickNav[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  const hasPlayerResults = results.length > 0
  const hasNavResults = filteredNav.length > 0
  const hasRecent = recentPlayers.length > 0 && query.length === 0
  const showEmpty = query.length >= 2 && !searching && !hasPlayerResults && !hasNavResults

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-colors"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search players & pages...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Command dialog */}
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search players, pages, tools..."
          value={query}
          onValueChange={handleValueChange}
        />
        <CommandList className="max-h-[400px]">
          {/* Loading state */}
          {searching && query.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Searching players...
              </div>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <CommandEmpty>
              No players or pages found for &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}

          {/* Player search results */}
          {hasPlayerResults && (
            <CommandGroup heading="Players">
              {results.map((player) => (
                <CommandItem
                  key={player.id}
                  value={`player-${player.id}-${player.name}`}
                  onSelect={() => handleSelectPlayer(player)}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  {player.headshotUrl ? (
                    <img
                      src={player.headshotUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.team.abbrev} · {player.position} · {player.sport.toUpperCase()}
                    </p>
                  </div>
                  {player.hasGameToday && player.todaysOpponent && (
                    <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {player.todaysOpponent}
                    </span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Page navigation results (when searching) */}
          {hasNavResults && (
            <>
              {hasPlayerResults && <CommandSeparator />}
              {Object.entries(groupedNav).map(([group, items]) => (
                <CommandGroup key={group} heading={group}>
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <CommandItem
                        key={item.href}
                        value={`nav-${item.href}-${item.label}`}
                        onSelect={() => {
                          trackEvent("command_palette_navigate", { page: item.href })
                          handleNavigate(item.href)
                        }}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary flex-shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </>
          )}

          {/* Recent players (when empty query) */}
          {hasRecent && (
            <CommandGroup heading="Recent Players">
              {recentPlayers.map((player) => (
                <CommandItem
                  key={`recent-${player.id}`}
                  value={`recent-${player.id}-${player.name}`}
                  onSelect={() => handleSelectPlayer(player)}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                  {player.headshotUrl ? (
                    <img
                      src={player.headshotUrl}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.team.abbrev} · {player.sport.toUpperCase()}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Default quick nav (when empty query, no recent) */}
          {query.length === 0 && !hasRecent && (
            <CommandGroup heading="Quick Navigation">
              {QUICK_NAV.slice(0, 5).map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.href}
                    value={`nav-${item.href}-${item.label}`}
                    onSelect={() => {
                      trackEvent("command_palette_navigate", { page: item.href })
                      handleNavigate(item.href)
                    }}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary flex-shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {/* Footer hint */}
          <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground/60">
            <span>Type a player name to analyze props instantly</span>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">↵</kbd>
              <span>to select</span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px] ml-1">esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </CommandList>
      </CommandDialog>
    </>
  )
}
