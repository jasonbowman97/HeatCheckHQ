import { COLORS, GLOW } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import { HeaderCell } from "../shared/header-cell"
import { hitRateColor, fireLevel } from "../shared/color-utils"
import type { StreakSheetRow } from "../card-types"

interface NbaStreakSheetProps {
  rows: StreakSheetRow[]
  date: string
  logos: Map<string, string>
  title: string
  threshold: number
}

/** NBA Streak Watch cheat sheet — players consistently hitting a stat threshold */
export function NbaStreakSheet({ rows, date, logos, title, threshold }: NbaStreakSheetProps) {
  return (
    <SheetLayout title={title} date={date} sport="nba">
      {/* Column headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          marginBottom: 4,
          borderRadius: 8,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <HeaderCell width={180} label="PLAYER" />
        <HeaderCell width={460} label="LAST 10 GAMES" />
        <HeaderCell width={100} label="HIT RATE" />
        <HeaderCell width={100} label="AVG" />
        <HeaderCell width={100} label="SZN AVG" />
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const hitPct = row.hitCount / row.windowSize
        const colors = hitRateColor(hitPct)
        const fire = fireLevel(hitPct)
        const avgDiff = row.windowAvg - row.seasonAvg

        return (
          <div
            key={`${row.playerName}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              background: i % 2 === 0 ? COLORS.card : "transparent",
              borderRadius: 6,
            }}
          >
            {/* Player (logo + name + opponent) */}
            <div style={{ display: "flex", alignItems: "center", width: 180, gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logos.get(row.teamLogo) || row.teamLogo}
                width={36}
                height={36}
                alt=""
                style={{ borderRadius: 6 }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontFamily: "Inter-Bold",
                    fontSize: 14,
                    color: COLORS.foreground,
                  }}
                >
                  {row.playerName}
                </span>
                {row.opponent && (
                  <span
                    style={{
                      fontFamily: "Inter-Regular",
                      fontSize: 11,
                      color: COLORS.muted,
                    }}
                  >
                    vs {row.opponent}
                  </span>
                )}
              </div>
            </div>

            {/* Last 10 games — stat value boxes (larger) */}
            <div style={{ display: "flex", width: 460, gap: 4, alignItems: "center" }}>
              {row.gameStats.slice(0, 10).map((stat, j) => {
                const hit = stat >= threshold
                return (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 46,
                      height: 38,
                      borderRadius: 6,
                      background: hit ? COLORS.greenBg : COLORS.redBg,
                      border: `1px solid ${hit ? GLOW.teal : "rgba(239, 68, 68, 0.2)"}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Inter-Bold",
                        fontSize: 14,
                        color: hit ? COLORS.green : COLORS.red,
                      }}
                    >
                      {stat}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Hit rate badge with fire */}
            <div style={{ display: "flex", width: 100 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 13,
                  color: colors.text,
                  background: colors.bg,
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                {fire}{fire ? " " : ""}{row.hitCount}/{row.windowSize}
              </span>
            </div>

            {/* Window avg with arrow comparison */}
            <div style={{ display: "flex", width: 100, alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 16,
                  color: COLORS.foreground,
                }}
              >
                {row.windowAvg.toFixed(1)}
              </span>
              {Math.abs(avgDiff) >= 1 && (
                <span
                  style={{
                    fontFamily: "Inter-SemiBold",
                    fontSize: 12,
                    color: avgDiff > 0 ? COLORS.green : COLORS.red,
                  }}
                >
                  {avgDiff > 0 ? "↑" : "↓"}
                </span>
              )}
            </div>

            {/* Season avg */}
            <div style={{ display: "flex", width: 100 }}>
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 14,
                  color: COLORS.muted,
                }}
              >
                {row.seasonAvg.toFixed(1)}
              </span>
            </div>
          </div>
        )
      })}
    </SheetLayout>
  )
}
