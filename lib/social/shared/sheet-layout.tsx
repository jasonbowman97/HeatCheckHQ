import { COLORS, SHEET, BRAND, LOGO_PATHS } from "../social-config"

interface SheetLayoutProps {
  title: string
  date: string
  children: React.ReactNode
  width?: number
  height?: number
}

/** Shared wrapper for all cheat sheet graphics — dark bg, header, footer, logo watermark */
export function SheetLayout({
  title,
  date,
  children,
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${SHEET.padding}px ${SHEET.padding}px 0`,
          height: SHEET.headerHeight,
        }}
      >
        {/* Logo + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandLogo size={32} />
          <span
            style={{
              fontFamily: "Inter-Bold",
              fontSize: 18,
              color: COLORS.primary,
              letterSpacing: 1,
            }}
          >
            {BRAND.url.toUpperCase()}
          </span>
        </div>

        {/* Date */}
        <span
          style={{
            fontFamily: "Inter-SemiBold",
            fontSize: 16,
            color: COLORS.muted,
            letterSpacing: 1,
          }}
        >
          {date}
        </span>
      </div>

      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `16px ${SHEET.padding}px`,
        }}
      >
        <span
          style={{
            fontFamily: "Inter-Bold",
            fontSize: 36,
            color: COLORS.foreground,
            letterSpacing: 2,
          }}
        >
          {title}
        </span>
      </div>

      {/* Accent line */}
      <div
        style={{
          display: "flex",
          height: 2,
          marginLeft: SHEET.padding,
          marginRight: SHEET.padding,
          backgroundColor: COLORS.primary,
          opacity: 0.3,
          marginBottom: 12,
        }}
      />

      {/* Content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: `0 ${SHEET.padding}px`,
        }}
      >
        {children}
      </div>

      {/* Footer bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${SHEET.padding}px ${SHEET.padding / 2}px`,
          height: SHEET.footerHeight,
        }}
      >
        <span
          style={{
            fontFamily: "Inter-Regular",
            fontSize: 14,
            color: COLORS.muted,
          }}
        >
          {BRAND.url} — Free sports analytics
        </span>
        <BrandLogo size={20} />
      </div>
    </div>
  )
}

/** Inline SVG logo for Satori (no className, uses direct fill) */
function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
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
