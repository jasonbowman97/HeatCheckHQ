"use client"

import { Download } from "lucide-react"
import { useUserTier } from "@/components/user-tier-provider"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface CsvExportProps {
  data: Record<string, unknown>[]
  filename: string
  columns?: { key: string; label: string }[]
}

export function CsvExport({ data, filename, columns }: CsvExportProps) {
  const userTier = useUserTier()
  const pathname = usePathname()
  const isPro = userTier === "pro"

  function handleExport() {
    if (!isPro || data.length === 0) return

    const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0])
    const headers = columns ? columns.map((c) => c.label) : keys

    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        keys.map((key) => {
          const val = row[key]
          const str = val === null || val === undefined ? "" : String(val)
          // Escape commas and quotes
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(",")
      ),
    ]

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isPro) {
    return (
      <Link
        href={`/checkout${pathname ? `?return=${encodeURIComponent(pathname)}` : ""}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
      >
        <Download className="h-3 w-3" />
        Export CSV
        <span className="text-[9px] font-bold text-primary ml-0.5">PRO</span>
      </Link>
    )
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download className="h-3 w-3" />
      Export CSV
    </button>
  )
}
