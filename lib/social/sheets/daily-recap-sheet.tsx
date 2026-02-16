import { COLORS, SHEET } from "../social-config"
import { SheetLayout } from "../shared/sheet-layout"
import type { RecapSection } from "../card-types"

interface DailyRecapSheetProps {
  sections: RecapSection[]
  date: string
  logos: Map<string, string>
}

/** Daily recap / multi-sport briefing — 2x2 grid of spotlight picks */
export function DailyRecapSheet({ sections, date, logos }: DailyRecapSheetProps) {
  // Pad to 4 sections max
  const items = sections.slice(0, 4)

  return (
    <SheetLayout
      title={"🔥  TODAY'S HEAT CHECK"}
      date={date}
      width={SHEET.compactWidth}
      height={SHEET.compactWidth} // square 1200x1200 for 2x2 grid
    >
      {/* 2x2 Grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          flex: 1,
          padding: "8px 0",
        }}
      >
        {items.map((section, i) => (
          <div
            key={`${section.title}-${i}`}
            style={{
              display: "flex",
              flexDirection: "column",
              width: 536, // (1200 - 80 padding - 16 gap) / 2
              background: COLORS.card,
              borderRadius: 12,
              padding: 24,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 20 }}>{section.icon}</span>
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 14,
                  color: COLORS.primary,
                  letterSpacing: 1.5,
                }}
              >
                {section.title.toUpperCase()}
              </span>
            </div>

            {/* Player + team logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logos.get(section.teamLogo) || section.teamLogo}
                width={32}
                height={32}
                alt=""
                style={{ borderRadius: 6 }}
              />
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 22,
                  color: COLORS.foreground,
                }}
              >
                {section.playerName}
              </span>
            </div>

            {/* Key stat */}
            <div
              style={{
                display: "flex",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 36,
                  color: COLORS.primary,
                }}
              >
                {section.stat}
              </span>
            </div>

            {/* Detail text */}
            <div style={{ display: "flex", flex: 1 }}>
              <span
                style={{
                  fontFamily: "Inter-Regular",
                  fontSize: 14,
                  color: COLORS.muted,
                  lineHeight: 1.4,
                }}
              >
                {section.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SheetLayout>
  )
}
