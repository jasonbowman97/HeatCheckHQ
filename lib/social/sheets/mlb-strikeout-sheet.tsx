import { COLORS } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import type { StrikeoutRow } from "../card-types"

interface MlbStrikeoutSheetProps {
  rows: StrikeoutRow[]
  date: string
  logos: Map<string, string>
}

/** MLB Strikeout prop sheet — pitcher K lines vs opponent K% */
export function MlbStrikeoutSheet({ rows, date, logos }: MlbStrikeoutSheetProps) {
  return (
    <SheetLayout title={"⚾  STRIKEOUT SHEET"} date={date}>
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
        <HeaderCell width={180} text="PITCHER" />
        <HeaderCell width={120} text="VS" />
        <HeaderCell width={100} text="K LINE" />
        <HeaderCell width={110} text="K/GAME" />
        <HeaderCell width={110} text="OPP K%" />
        <HeaderCell width={110} text="L3 AVG" />
        <HeaderCell width={120} text="VERDICT" />
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const kDiff = row.kPerGame - row.kLine
        const verdictColor =
          row.trend === "over" ? COLORS.green
            : row.trend === "under" ? COLORS.red
              : COLORS.amber
        const verdictBg =
          row.trend === "over" ? COLORS.greenBg
            : row.trend === "under" ? COLORS.redBg
              : COLORS.amberBg
        const verdictText =
          row.trend === "over" ? "OVER"
            : row.trend === "under" ? "UNDER"
              : "PUSH"

        return (
          <div
            key={`${row.pitcher}-${row.opponent}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              background: i % 2 === 0 ? COLORS.card : "transparent",
              borderRadius: 6,
            }}
          >
            {/* Pitcher (logo + name) */}
            <div style={{ display: "flex", alignItems: "center", width: 180, gap: 8 }}>
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
                {row.pitcher}
              </span>
            </div>

            {/* vs opponent */}
            <div style={{ display: "flex", alignItems: "center", width: 120, gap: 6 }}>
              <span style={{ fontSize: 12, color: COLORS.muted }}>vs</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logos.get(row.opponentLogo) || row.opponentLogo}
                width={20}
                height={20}
                alt=""
                style={{ borderRadius: 3 }}
              />
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 14,
                  color: COLORS.muted,
                }}
              >
                {row.opponent}
              </span>
            </div>

            {/* K Line */}
            <div style={{ display: "flex", width: 100 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 18,
                  color: COLORS.foreground,
                }}
              >
                {row.kLine.toFixed(1)}
              </span>
            </div>

            {/* K/Game */}
            <div style={{ display: "flex", width: 110 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 18,
                  color: kDiff > 0.5 ? COLORS.green : kDiff < -0.5 ? COLORS.red : COLORS.foreground,
                }}
              >
                {row.kPerGame.toFixed(1)}
              </span>
            </div>

            {/* Opp K% */}
            <div style={{ display: "flex", width: 110 }}>
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 15,
                  color: row.oppKPct >= 25 ? COLORS.green : row.oppKPct <= 20 ? COLORS.red : COLORS.foreground,
                }}
              >
                {row.oppKPct.toFixed(1)}%
              </span>
            </div>

            {/* L3 Avg */}
            <div style={{ display: "flex", width: 110 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 16,
                  color: row.l3Avg > row.kLine ? COLORS.green : COLORS.red,
                }}
              >
                {row.l3Avg.toFixed(1)}
              </span>
            </div>

            {/* Verdict badge */}
            <div style={{ display: "flex", width: 120 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 13,
                  color: verdictColor,
                  background: verdictBg,
                  padding: "4px 14px",
                  borderRadius: 6,
                  letterSpacing: 0.5,
                }}
              >
                {verdictText}
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
