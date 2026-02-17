import { COLORS } from "../social-config"

interface HeaderCellProps {
  label: string
  width: number
  align?: "left" | "center" | "right"
}

/**
 * Shared column header cell for all cheat sheet data tables.
 * Extracted from individual sheets to avoid duplication.
 */
export function HeaderCell({ label, width, align = "left" }: HeaderCellProps) {
  return (
    <div
      style={{
        display: "flex",
        width,
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <span
        style={{
          fontFamily: "Inter-Bold",
          fontSize: 12,
          color: COLORS.muted,
          letterSpacing: 1.5,
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </span>
    </div>
  )
}
