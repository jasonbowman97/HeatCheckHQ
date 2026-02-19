import { COLORS, GRADIENT, SHEET, SOCIAL, SPORT_ACCENT, LOGO_PATHS } from "../social-config"
import type { Sport } from "../social-config"

interface GradientHeaderProps {
  title: string
  date: string
  sport: Sport
  subtitle?: string
}

/**
 * Premium teal gradient header for all cheat sheet graphics.
 *
 * Satori can't render CSS linear-gradient, so we simulate it with
 * layered divs at different opacities. The gradient is always teal
 * (brand identity) with a thin sport-accent stripe at the bottom.
 */
export function GradientHeader({ title, date, sport, subtitle }: GradientHeaderProps) {
  const accentColor = SPORT_ACCENT[sport]

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: SHEET.headerHeight,
      }}
    >
      {/* Gradient area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Layer 1: dark base (full width) */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: GRADIENT.base,
          }}
        />

        {/* Layer 2: mid-teal glow (right side) */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: "25%",
            right: 0,
            bottom: 0,
            backgroundColor: GRADIENT.mid,
            opacity: 0.55,
          }}
        />

        {/* Layer 3: bright teal (far right) */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: "55%",
            right: 0,
            bottom: 0,
            backgroundColor: GRADIENT.bright,
            opacity: 0.35,
          }}
        />

        {/* Content layer */}
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
          {/* Top row: brand + date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              paddingBottom: 4,
            }}
          >
            {/* Logo + Brand URL */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BrandLogo size={28} />
              <span
                style={{
                  fontFamily: "Inter-Bold",
                  fontSize: 16,
                  color: COLORS.primary,
                  letterSpacing: 1.5,
                }}
              >
                {SOCIAL.url}
              </span>
            </div>

            {/* Date */}
            <span
              style={{
                fontFamily: "Inter-SemiBold",
                fontSize: 14,
                color: "rgba(227, 232, 239, 0.7)",
                letterSpacing: 1,
              }}
            >
              {date}
            </span>
          </div>

          {/* Center: Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 2,
            }}
          >
            <span
              style={{
                fontFamily: "Inter-Bold",
                fontSize: 38,
                color: "#ffffff",
                letterSpacing: 2,
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {title}
            </span>
            {subtitle && (
              <span
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 14,
                  color: "rgba(227, 232, 239, 0.6)",
                  letterSpacing: 1,
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sport accent stripe */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: SHEET.accentStripeHeight,
          backgroundColor: accentColor,
        }}
      />
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
      <path d={LOGO_PATHS.flameInner} fill={GRADIENT.base} opacity={0.85} />
    </svg>
  )
}
