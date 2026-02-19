import { COLORS, SHEET, BRAND, LOGO_PATHS, SOCIAL } from "../social-config"
import type { Sport } from "../social-config"
import { GradientHeader } from "./gradient-header"

interface SheetLayoutProps {
  title: string
  date: string
  children: React.ReactNode
  sport?: Sport
  subtitle?: string
  width?: number
  height?: number
}

/**
 * Shared wrapper for all cheat sheet graphics.
 * Premium teal gradient header + content area + branded footer.
 */
export function SheetLayout({
  title,
  date,
  children,
  sport = "multi",
  subtitle,
  width = SHEET.width,
  height = SHEET.height,
}: SheetLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        backgroundColor: COLORS.background,
        fontFamily: "Inter-Regular",
        color: COLORS.foreground,
        overflow: "hidden",
      }}
    >
      {/* Premium gradient header */}
      <GradientHeader
        title={title}
        date={date}
        sport={sport}
        subtitle={subtitle}
      />

      {/* Content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: `12px ${SHEET.padding}px 0`,
        }}
      >
        {children}
      </div>

      {/* Premium footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${SHEET.padding}px`,
          height: SHEET.footerHeight,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        {/* Left: logo + URL */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrandLogo size={20} />
          <span
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: 13,
              color: COLORS.muted,
              letterSpacing: 0.5,
            }}
          >
            {BRAND.url}
          </span>
        </div>

        {/* Center: CTA */}
        <span
          style={{
            fontFamily: "Inter-Bold",
            fontSize: 12,
            color: COLORS.primary,
            letterSpacing: 1.5,
            opacity: 0.8,
          }}
        >
          {SOCIAL.cta}
        </span>

        {/* Right: social handle */}
        <span
          style={{
            fontFamily: "Inter-SemiBold",
            fontSize: 13,
            color: COLORS.muted,
            letterSpacing: 0.5,
          }}
        >
          {SOCIAL.handle}
        </span>
      </div>
    </div>
  )
}

/** Inline SVG logo for Satori (no className, uses direct fill) */
function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect
        x="3"
        y="17"
        width="4"
        height="5"
        rx="1"
        fill={COLORS.primary}
        opacity={LOGO_PATHS.bar1.opacity}
      />
      <rect
        x="10"
        y="13"
        width="4"
        height="9"
        rx="1"
        fill={COLORS.primary}
        opacity={LOGO_PATHS.bar2.opacity}
      />
      <rect
        x="17"
        y="10"
        width="4"
        height="12"
        rx="1"
        fill={COLORS.primary}
        opacity={LOGO_PATHS.bar3.opacity}
      />
      <path d={LOGO_PATHS.flameOuter} fill={COLORS.primary} />
      <path
        d={LOGO_PATHS.flameInner}
        fill={COLORS.background}
        opacity={0.85}
      />
    </svg>
  )
}
