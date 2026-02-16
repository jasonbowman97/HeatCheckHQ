import { COLORS } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import { hitRateColor } from "../shared/color-utils"
import type { StreakSheetRow } from "../card-types"

interface NbaStreakSheetProps {
  rows: StreakSheetRow[]
  date: string
  logos: Map<string, string>
  title: string       // e.g., "🏀  POINTS STREAK WATCH"
  threshold: number   // e.g., 25
}

/** NBA Streak Watch cheat sheet — players consistently hitting a stat threshold */
export function NbaStreakSheet({ rows, date, logos, title, threshold }: NbaStreakSheetProps) {
  return (
    <SheetLayout title={title} date={date}>
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
        <HeaderCell width={180} text="PLAYER" />
        <HeaderCell width={460} text="LAST 10 GAMES" />
        <HeaderCell width={100} text="HIT RATE" />
        <HeaderCell width={100} text="AVG" />
        <HeaderCell width={100} text="SZN AVG" />
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const colors = hitRateColor(row.hitCount / row.windowSize)
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
                width={24}
                height={24}
                alt=""
                style={{ borderRadius: 4 }}
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

            {/* Last 10 games — stat value boxes */}
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
                      width: 42,
                      height: 36,
                      borderRadius: 6,
                      background: hit ? COLORS.greenBg : COLORS.redBg,
                      border: `1px solid ${hit ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
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

            {/* Hit rate badge */}
            <div style={{ display: "flex", width: 100 }}>
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
                {row.hitCount}/{row.windowSize}
              </span>
            </div>

            {/* Window avg */}
            <div style={{ display: "flex", width: 100 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 16,
                  color: COLORS.foreground,
                }}
              >
                {row.windowAvg.toFixed(1)}
              </span>
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
        {text}
      </span>
    </div>
  )
}
