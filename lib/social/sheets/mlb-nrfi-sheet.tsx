import { COLORS } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import { nrfiColor, streakColor } from "../shared/color-utils"
import type { NrfiRow } from "../card-types"

interface MlbNrfiSheetProps {
  rows: NrfiRow[]
  date: string
  logos: Map<string, string>
}

/** MLB NRFI cheat sheet — two-sided matchup table with pitcher NRFI rates */
export function MlbNrfiSheet({ rows, date, logos }: MlbNrfiSheetProps) {
  return (
    <SheetLayout title={"⚾  NRFI CHEAT SHEET"} date={date}>
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
        <HeaderCell width={140} text="AWAY" />
        <HeaderCell width={140} text="PITCHER" />
        <HeaderCell width={60} text="NRFI%" />
        <HeaderCell width={70} text="STREAK" />
        <HeaderCell width={80} text="COMBINED" />
        <HeaderCell width={70} text="STREAK" />
        <HeaderCell width={60} text="NRFI%" />
        <HeaderCell width={140} text="PITCHER" />
        <HeaderCell width={140} text="HOME" />
      </div>

      {/* Data rows */}
      {rows.map((row, i) => {
        const awayColors = nrfiColor(row.awayNrfiPct)
        const homeColors = nrfiColor(row.homeNrfiPct)
        const combinedColors = nrfiColor(row.combinedPct)

        return (
          <div
            key={`${row.awayTeam}-${row.homeTeam}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              background: i % 2 === 0 ? COLORS.card : "transparent",
              borderRadius: 6,
            }}
          >
            {/* Away team */}
            <div style={{ display: "flex", alignItems: "center", width: 140, gap: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logos.get(row.awayLogo) || row.awayLogo}
                width={22}
                height={22}
                alt=""
                style={{ borderRadius: 3 }}
              />
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 15,
                  color: COLORS.foreground,
                }}
              >
                {row.awayTeam}
              </span>
            </div>

            {/* Away pitcher + hand */}
            <div style={{ display: "flex", alignItems: "center", width: 140, gap: 4 }}>
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 13,
                  color: COLORS.foreground,
                }}
              >
                {row.awayPitcher || "TBD"}
              </span>
              {row.awayHand && (
                <span
                  style={{
                    fontFamily: "Inter-Bold",
                    fontSize: 11,
                    color: COLORS.primary,
                    background: COLORS.primaryMuted,
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  {row.awayHand}
                </span>
              )}
            </div>

            {/* Away NRFI% */}
            <div style={{ display: "flex", width: 60 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 15,
                  color: awayColors.text,
                }}
              >
                {row.awayNrfiPct > 0 ? `${row.awayNrfiPct.toFixed(0)}%` : "—"}
              </span>
            </div>

            {/* Away streak */}
            <div style={{ display: "flex", width: 70 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 13,
                  color: streakColor(row.awayStreak),
                }}
              >
                {row.awayStreak > 0
                  ? `${row.awayStreak}W`
                  : row.awayStreak < 0
                    ? `${Math.abs(row.awayStreak)}L`
                    : "—"}
              </span>
            </div>

            {/* Combined NRFI% (center highlight) */}
            <div style={{ display: "flex", width: 80, justifyContent: "center" }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 16,
                  color: combinedColors.text,
                  background: combinedColors.bg,
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                {row.combinedPct > 0 ? `${row.combinedPct.toFixed(0)}%` : "—"}
              </span>
            </div>

            {/* Home streak */}
            <div style={{ display: "flex", width: 70 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 13,
                  color: streakColor(row.homeStreak),
                }}
              >
                {row.homeStreak > 0
                  ? `${row.homeStreak}W`
                  : row.homeStreak < 0
                    ? `${Math.abs(row.homeStreak)}L`
                    : "—"}
              </span>
            </div>

            {/* Home NRFI% */}
            <div style={{ display: "flex", width: 60 }}>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 15,
                  color: homeColors.text,
                }}
              >
                {row.homeNrfiPct > 0 ? `${row.homeNrfiPct.toFixed(0)}%` : "—"}
              </span>
            </div>

            {/* Home pitcher + hand */}
            <div style={{ display: "flex", alignItems: "center", width: 140, gap: 4 }}>
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 13,
                  color: COLORS.foreground,
                }}
              >
                {row.homePitcher || "TBD"}
              </span>
              {row.homeHand && (
                <span
                  style={{
                    fontFamily: "Inter-Bold",
                    fontSize: 11,
                    color: COLORS.primary,
                    background: COLORS.primaryMuted,
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  {row.homeHand}
                </span>
              )}
            </div>

            {/* Home team */}
            <div style={{ display: "flex", alignItems: "center", width: 140, gap: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logos.get(row.homeLogo) || row.homeLogo}
                width={22}
                height={22}
                alt=""
                style={{ borderRadius: 3 }}
              />
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 15,
                  color: COLORS.foreground,
                }}
              >
                {row.homeTeam}
              </span>
            </div>
          </div>
        )
      })}

      {/* Venue info footer */}
      {rows.length > 0 && (
        <div
          style={{
            display: "flex",
            marginTop: 12,
            padding: "8px 16px",
            borderRadius: 6,
            background: COLORS.primaryMuted,
          }}
        >
          <span
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 12,
              color: COLORS.muted,
            }}
          >
            {"NRFI = No Run First Inning  •  Combined % = (Away NRFI% + Home NRFI%) / 2  •  Streak: W = consecutive NRFI, L = consecutive RFI"}
          </span>
        </div>
      )}
    </SheetLayout>
  )
}

function HeaderCell({ width, text }: { width: number; text: string }) {
  return (
    <div style={{ display: "flex", width }}>
      <span
        style={{
          fontFamily: "Inter-Bold",
          fontSize: 11,
          color: COLORS.primary,
          letterSpacing: 1,
        }}
      >
        {text.toUpperCase()}
      </span>
    </div>
  )
}
