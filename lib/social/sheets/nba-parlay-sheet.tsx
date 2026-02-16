import { COLORS } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import { hitRateColor } from "../shared/color-utils"
import type { ParlayRow } from "../card-types"

interface NbaParlaySheetProps {
  rows: ParlayRow[]
  date: string
  logos: Map<string, string>
}

/** NBA Parlay Pieces cheat sheet — player props with hit rates and trends */
export function NbaParlaySheet({ rows, date, logos }: NbaParlaySheetProps) {
  return (
    <SheetLayout title={"🏀  NBA PARLAY PIECES"} date={date}>
      {/* Column headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          marginBottom: 4,
          borderRadius: 8,
          background: COLORS.primaryMuted,
        }}
      >
        <HeaderCell width={200} text="PLAYER" />
        <HeaderCell width={160} text="PROP" />
        <HeaderCell width={100} text="LINE" />
        <HeaderCell width={120} text="HIT RATE" />
        <HeaderCell width={200} text="LAST 10" />
        <HeaderCell width={120} text="TREND" />
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const colors = hitRateColor(row.hitPct)
        return (
          <div
            key={`${row.playerName}-${row.prop}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              background: i % 2 === 0 ? COLORS.card : "transparent",
              borderRadius: 6,
            }}
          >
            {/* Player (logo + name) */}
            <div style={{ display: "flex", alignItems: "center", width: 200, gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logos.get(row.teamLogo) || row.teamLogo}
                width={24}
                height={24}
                alt=""
                style={{ borderRadius: 4 }}
              />
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 15,
                  color: COLORS.foreground,
                }}
              >
                {row.playerName}
              </span>
            </div>

            {/* Prop */}
            <div style={{ display: "flex", width: 160 }}>
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 14,
                  color: COLORS.muted,
                }}
              >
                {row.prop.toUpperCase()}
              </span>
            </div>

            {/* Line */}
            <div style={{ display: "flex", width: 100 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 18,
                  color: COLORS.foreground,
                }}
              >
                {row.line}
              </span>
            </div>

            {/* Hit rate badge */}
            <div style={{ display: "flex", width: 120 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 14,
                  color: colors.text,
                  background: colors.bg,
                  padding: "4px 12px",
                  borderRadius: 6,
                }}
              >
                {row.hitRate}
              </span>
            </div>

            {/* Last 10 games dots */}
            <div style={{ display: "flex", width: 200, gap: 4, alignItems: "center" }}>
              {row.recentGames.slice(0, 10).map((hit, j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: hit ? COLORS.green : COLORS.red,
                    opacity: hit ? 1 : 0.5,
                  }}
                />
              ))}
            </div>

            {/* Trend */}
            <div style={{ display: "flex", width: 120 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 14,
                  color: row.trend === "hot" ? COLORS.green : COLORS.red,
                }}
              >
                {row.trend === "hot" ? "🔥 HOT" : "🧊 COLD"}
              </span>
            </div>
          </div>
        )
      })}
    </SheetLayout>
  )
}

function HeaderCell({ width, text }: { width: number; text: string }) {
  return (
    <div style={{ display: "flex", width }}>
      <span
        style={{
          fontFamily: "Inter-Bold",
          fontSize: 12,
          color: COLORS.primary,
          letterSpacing: 1.5,
        }}
      >
        {text.toUpperCase()}
      </span>
    </div>
  )
}
