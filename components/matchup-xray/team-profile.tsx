// ============================================================
// components/matchup-xray/team-profile.tsx — Team ratings card
// ============================================================
// Shows offensive/defensive ratings, pace, recent form,
// and strengths/weaknesses for one team.

"use client"

import { TrendingUp, TrendingDown, Minus, Shield, Swords } from "lucide-react"
import type { TeamMatchupProfile } from "@/types/innovation-playbook"

interface TeamProfileProps {
  profile: TeamMatchupProfile
  teamName: string
  teamLogo: string
  side: 'home' | 'away'
}

export function TeamProfile({ profile, teamName, teamLogo, side }: TeamProfileProps) {
  const formIcon = profile.recentForm === 'hot' ? (
    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
  ) : profile.recentForm === 'cold' ? (
    <TrendingDown className="h-3.5 w-3.5 text-red-400" />
  ) : (
    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  )

  const formColor = profile.recentForm === 'hot' ? 'text-emerald-400' :
    profile.recentForm === 'cold' ? 'text-red-400' : 'text-muted-foreground'

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={`px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-3`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogo} alt={teamName} className="h-8 w-8 object-contain" />
        <div>
          <p className="text-sm font-bold text-foreground">{teamName}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase">{side}</span>
            <span className="text-[10px] text-muted-foreground">{profile.recentRecord}</span>
            <span className={`text-[10px] font-semibold ${formColor} flex items-center gap-0.5`}>
              {formIcon}
              {profile.recentForm.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Ratings */}
        <div className="grid grid-cols-2 gap-3">
          <RatingStat
            icon={<Swords className="h-3.5 w-3.5 text-amber-400" />}
            label="Offensive Rtg"
            value={profile.offensiveRating}
            benchmark={110}
          />
          <RatingStat
            icon={<Shield className="h-3.5 w-3.5 text-blue-400" />}
            label="Defensive Rtg"
            value={profile.defensiveRating}
            benchmark={110}
            invertColor
          />
        </div>

        {/* Pace */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pace</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, (profile.pace / 110) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground w-10 text-right">{profile.pace}</span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        {profile.strengthsVsOpponent.length > 0 && (
          <div>
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Strengths</p>
            <div className="flex flex-wrap gap-1">
              {profile.strengthsVsOpponent.map((s, i) => (
                <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.weaknessesVsOpponent.length > 0 && (
          <div>
            <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Weaknesses</p>
            <div className="flex flex-wrap gap-1">
              {profile.weaknessesVsOpponent.map((w, i) => (
                <span key={i} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RatingStat({
  icon,
  label,
  value,
  benchmark,
  invertColor = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  benchmark: number
  invertColor?: boolean
}) {
  const isGood = invertColor ? value < benchmark : value > benchmark
  const color = isGood ? 'text-emerald-400' : 'text-foreground'

  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value.toFixed(1)}</p>
    </div>
  )
}
