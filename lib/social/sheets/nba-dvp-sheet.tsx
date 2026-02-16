import { COLORS, SHEET } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import { rankColor, rankLabel } from "../shared/color-utils"
import type { DvpRow } from "../card-types"

interface NbaDvpSheetProps {
  rows: DvpRow[]
  date: string
  logos: Map<string, string>
}

/** NBA Defense vs Position cheat sheet — TheProfessor305-style dense data table */
export function NbaDvpSheet({ rows, date, logos }: NbaDvpSheetProps) {
  return (
    <SheetLayout title="🏀  NBA DVP CHEAT SHEET" date={date}>
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
        <HeaderCell width={180} text="DEFENSE" />
        <HeaderCell width={80} text="VS" />
        <HeaderCell width={80} text="POS" />
        <HeaderCell width={140} text="STAT" />
        <HeaderCell width={130} text="AVG ALLOWED" />
        <HeaderCell width={130} text="RANK" />
        <HeaderCell width={260} text="PLAYER TO TARGET" />
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const colors = rankColor(row.rank)
        return (
          <div
            key={`${row.teamAbbr}-${row.position}-${row.statCategory}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              background: i % 2 === 0 ? COLORS.card : "transparent",
              borderRadius: 6,
            }}
          >
            {/* Defense team (logo + abbr) */}
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
                  fontSize: 16,
                  color: COLORS.foreground,
                }}
              >
                {row.teamAbbr}
              </span>
            </div>

            {/* vs opponent */}
            <div style={{ display: "flex", alignItems: "center", width: 80, gap: 6 }}>
              <span style={{ fontSize: 12, color: COLORS.muted }}>vs</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logos.get(row.opponentLogo) || row.opponentLogo}
                width={20}
                height={20}
                alt=""
                style={{ borderRadius: 3 }}
              />
            </div>

            {/* Position */}
            <div style={{ display: "flex", width: 80 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 14,
                  color: COLORS.primary,
                  background: COLORS.primaryMuted,
                  padding: "2px 10px",
                  borderRadius: 4,
                }}
              >
                {row.position}
              </span>
            </div>

            {/* Stat category */}
            <div style={{ display: "flex", width: 140 }}>
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 14,
                  color: COLORS.muted,
                }}
              >
                {row.statCategory.toUpperCase()}
              </span>
            </div>

            {/* Avg allowed */}
            <div style={{ display: "flex", width: 130 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 20,
                  color: COLORS.foreground,
                }}
              >
                {row.avgAllowed.toFixed(1)}
              </span>
            </div>

            {/* Rank badge */}
            <div style={{ display: "flex", width: 130 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 13,
                  color: colors.text,
                  background: colors.bg,
                  padding: "4px 12px",
                  borderRadius: 6,
                  letterSpacing: 0.5,
                }}
              >
                {rankLabel(row.rank)}
              </span>
            </div>

            {/* Player to target */}
            <div style={{ display: "flex", width: 260 }}>
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 15,
                  color: COLORS.foreground,
                }}
              >
                {row.playerName || "—"}
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
