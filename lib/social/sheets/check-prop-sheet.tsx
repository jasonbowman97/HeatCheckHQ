// ============================================================
// lib/social/sheets/check-prop-sheet.tsx — Satori share card for Prop Analyzer
// ============================================================
// 1200x675 (16:9) image showing verdict, heat ring summary,
// convergence score, and key stats for sharing on social.

import { COLORS, GRADIENT, SHEET, BRAND, SOCIAL, LOGO_PATHS } from "../social-config"

export interface CheckPropShareData {
  playerName: string
  teamAbbrev: string
  statLabel: string
  line: number
  verdictLabel: string
  verdictDirection: "over" | "under" | "toss-up"
  convergenceScore: number
  confidence: number
  hitRateL10: number
  avgMarginL10: number
  seasonAvg: number
  heatRingHitRate: number
  heatRingStreak: number
  sport: string
  opponentAbbrev: string
  isHome: boolean
}

export function CheckPropSheet({ data }: { data: CheckPropShareData }) {
  const {
    playerName, teamAbbrev, statLabel, line,
    verdictLabel, verdictDirection, convergenceScore, confidence,
    hitRateL10, avgMarginL10, seasonAvg,
    heatRingHitRate, heatRingStreak, sport,
    opponentAbbrev, isHome,
  } = data

  const verdictColor =
    verdictDirection === "over" ? COLORS.green :
    verdictDirection === "under" ? COLORS.red :
    COLORS.amber

  const streakText = heatRingStreak > 0
    ? `${heatRingStreak} straight over`
    : heatRingStreak < 0
    ? `${Math.abs(heatRingStreak)} straight under`
    : "No streak"

  const matchupText = isHome ? `vs ${opponentAbbrev}` : `@ ${opponentAbbrev}`

  const sportAccent =
    sport === "nba" ? "#F97316" :
    sport === "mlb" ? "#3B82F6" :
    "#10B981"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 675,
        backgroundColor: COLORS.background,
        fontFamily: "Inter-Regular",
        color: COLORS.foreground,
        overflow: "hidden",
      }}
    >
      {/* Header gradient band */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: 100,
          position: "relative",
        }}
      >
        {/* Gradient layers (Satori-compatible) */}
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: GRADIENT.base }} />
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: GRADIENT.mid, opacity: 0.6 }} />
        <div style={{ display: "flex", position: "absolute", top: 0, right: 0, width: "50%", bottom: 0, backgroundColor: GRADIENT.bright, opacity: 0.3 }} />

        {/* Header content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            height: 96,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Player + matchup */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "Inter-Bold", fontSize: 32, color: "#fff" }}>
              {playerName}
            </span>
            <span style={{ fontFamily: "Inter-SemiBold", fontSize: 16, color: "rgba(255,255,255,0.7)" }}>
              {teamAbbrev} {matchupText} &middot; {statLabel} {line}
            </span>
          </div>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg viewBox="0 0 24 24" width={28} height={28}>
              <rect x="3" y="17" width="4" height="5" rx="1" fill="#fff" opacity={0.4} />
              <rect x="10" y="13" width="4" height="9" rx="1" fill="#fff" opacity={0.65} />
              <rect x="17" y="10" width="4" height="12" rx="1" fill="#fff" opacity={0.9} />
              <path d={LOGO_PATHS.flameOuter} fill="#fff" />
              <path d={LOGO_PATHS.flameInner} fill={GRADIENT.base} opacity={0.85} />
            </svg>
            <span style={{ fontFamily: "Inter-Bold", fontSize: 18, color: "rgba(255,255,255,0.9)" }}>
              {BRAND.name}
            </span>
          </div>
        </div>

        {/* Sport accent stripe */}
        <div style={{ display: "flex", height: 4, backgroundColor: sportAccent }} />
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          padding: "32px 40px",
          gap: 32,
        }}
      >
        {/* Left: Verdict */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 380,
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: "32px 24px",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <span
            style={{
              fontFamily: "Inter-Bold",
              fontSize: 42,
              color: verdictColor,
              letterSpacing: 2,
            }}
          >
            {verdictLabel}
          </span>

          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 16 }}>
            <span style={{ fontFamily: "Inter-Bold", fontSize: 72, color: verdictColor }}>
              {convergenceScore}
            </span>
            <span style={{ fontFamily: "Inter-SemiBold", fontSize: 24, color: COLORS.muted }}>
              /9
            </span>
          </div>
          <span style={{ fontFamily: "Inter-SemiBold", fontSize: 14, color: COLORS.muted, marginTop: 8, letterSpacing: 1 }}>
            CONVERGENCE SCORE
          </span>

          <div style={{ display: "flex", marginTop: 24, gap: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div
                key={i}
                style={{
                  width: 36,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i <= convergenceScore ? verdictColor : COLORS.border,
                }}
              />
            ))}
          </div>

          <span style={{ fontFamily: "Inter-SemiBold", fontSize: 14, color: COLORS.muted, marginTop: 16 }}>
            {confidence}% confidence
          </span>
        </div>

        {/* Right: Stats grid */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 16,
          }}
        >
          {/* Row 1 */}
          <div style={{ display: "flex", gap: 16, flex: 1 }}>
            <StatBox
              label="L10 Hit Rate"
              value={`${Math.round(hitRateL10 * 100)}%`}
              color={hitRateL10 >= 0.6 ? COLORS.green : hitRateL10 <= 0.4 ? COLORS.red : COLORS.amber}
            />
            <StatBox
              label="L10 Avg Margin"
              value={`${avgMarginL10 > 0 ? "+" : ""}${avgMarginL10.toFixed(1)}`}
              color={avgMarginL10 > 0 ? COLORS.green : avgMarginL10 < 0 ? COLORS.red : COLORS.muted}
            />
          </div>

          {/* Row 2 */}
          <div style={{ display: "flex", gap: 16, flex: 1 }}>
            <StatBox
              label="Season Average"
              value={seasonAvg.toFixed(1)}
              color={seasonAvg > line ? COLORS.green : COLORS.red}
            />
            <StatBox
              label="Heat Ring"
              value={`${Math.round(heatRingHitRate * 100)}%`}
              sublabel={streakText}
              color={heatRingHitRate >= 0.6 ? COLORS.green : heatRingHitRate <= 0.4 ? COLORS.red : COLORS.amber}
            />
          </div>

          {/* Row 3 */}
          <div style={{ display: "flex", gap: 16, flex: 1 }}>
            <StatBox
              label={statLabel}
              value={`${line}`}
              sublabel="Prop Line"
              color={COLORS.primary}
            />
            <StatBox
              label="Check your prop"
              value="FREE"
              sublabel={`${BRAND.url}/check`}
              color={COLORS.primary}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: 52,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <span style={{ fontFamily: "Inter-SemiBold", fontSize: 12, color: COLORS.muted }}>
          {BRAND.url}
        </span>
        <span style={{ fontFamily: "Inter-Bold", fontSize: 11, color: COLORS.primary, letterSpacing: 1.5, opacity: 0.8 }}>
          {SOCIAL.cta}
        </span>
        <span style={{ fontFamily: "Inter-SemiBold", fontSize: 12, color: COLORS.muted }}>
          {SOCIAL.handle}
        </span>
      </div>
    </div>
  )
}

function StatBox({
  label, value, sublabel, color,
}: {
  label: string
  value: string
  sublabel?: string
  color: string
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        padding: "16px 12px",
      }}
    >
      <span style={{ fontFamily: "Inter-Bold", fontSize: 36, color }}>
        {value}
      </span>
      <span style={{ fontFamily: "Inter-SemiBold", fontSize: 12, color: COLORS.muted, marginTop: 4, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </span>
      {sublabel && (
        <span style={{ fontFamily: "Inter-Regular", fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
