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
        background: `linear-gradient(180deg, ${COLORS.background} 0%, ${COLORS.backgroundAlt} 100%)`,
        fontFamily: "Inter-Regular",
        color: COLORS.foreground,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle dot pattern overlay */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle, ${COLORS.border} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          opacity: 0.3,
        }}
      />

      {/* Subtle glow behind title */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -100,
          left: "50%",
          width: 600,
          height: 300,
          borderRadius: 9999,
          background: `radial-gradient(circle, rgba(45, 212, 168, 0.08), transparent)`,
          transform: "translateX(-50%)",
        }}
      />

      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${SHEET.padding}px ${SHEET.padding}px 0`,
          height: SHEET.headerHeight,
          position: "relative",
          zIndex: 1,
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
              textTransform: "uppercase" as const,
            }}
          >
            {BRAND.url}
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
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontFamily: "Inter-Bold",
            fontSize: 36,
            color: COLORS.foreground,
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            textAlign: "center" as const,
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: `0 ${SHEET.padding}px`,
          position: "relative",
          zIndex: 1,
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
          position: "relative",
          zIndex: 1,
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
      style={{ flexShrink: 0 }}
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
