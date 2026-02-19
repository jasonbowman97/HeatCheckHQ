import { COLORS } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import { HeaderCell } from "../shared/header-cell"
import type { StrikeoutRow } from "../card-types"

interface MlbStrikeoutSheetProps {
  rows: StrikeoutRow[]
  date: string
  logos: Map<string, string>
}

/** MLB Strikeout prop sheet — pitcher K lines vs opponent K% */
export function MlbStrikeoutSheet({ rows, date, logos }: MlbStrikeoutSheetProps) {
  return (
    <SheetLayout title="⚾  STRIKEOUT SHEET" date={date} sport="mlb">
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
        <HeaderCell width={180} label="PITCHER" />
        <HeaderCell width={120} label="VS" />
        <HeaderCell width={100} label="K LINE" />
        <HeaderCell width={110} label="K/GAME" />
        <HeaderCell width={110} label="OPP K%" />
        <HeaderCell width={110} label="L3 AVG" />
        <HeaderCell width={120} label="VERDICT" />
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
                width={36}
                height={36}
                alt=""
                style={{ borderRadius: 6 }}
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
                width={24}
                height={24}
                alt=""
                style={{ borderRadius: 4 }}
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

            {/* K/Game with delta */}
            <div style={{ display: "flex", width: 110, alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 18,
                  color: kDiff > 0.5 ? COLORS.green : kDiff < -0.5 ? COLORS.red : COLORS.foreground,
                }}
              >
                {row.kPerGame.toFixed(1)}
              </span>
              {Math.abs(kDiff) >= 0.3 && (
                <span
                  style={{
                    fontFamily: "Inter-SemiBold",
                    fontSize: 12,
                    color: kDiff > 0 ? COLORS.green : COLORS.red,
                  }}
                >
                  {kDiff > 0 ? "+" : ""}{kDiff.toFixed(1)}
                </span>
              )}
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

            {/* Verdict badge — larger */}
            <div style={{ display: "flex", width: 120 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 14,
                  color: verdictColor,
                  background: verdictBg,
                  padding: "6px 16px",
                  borderRadius: 8,
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
