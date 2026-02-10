"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface FiltersBarProps {
  variant?: "overview" | "detail"
}

export function FiltersBar({ variant = "overview" }: FiltersBarProps) {
  if (variant === "detail") {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Filters</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-primary">Year</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-primary">Last Games</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="All Games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                <SelectItem value="10">Last 10</SelectItem>
                <SelectItem value="30">Last 30</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-primary">Last Months</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-primary">Pitcher Hand</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[120px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="rhp">RHP</SelectItem>
                <SelectItem value="lhp">LHP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-primary">Pitch Type</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px] bg-secondary border-border text-foreground">
                <SelectValue placeholder="All Pitches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pitches</SelectItem>
                <SelectItem value="fastball">Fastball</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
                <SelectItem value="changeup">Changeup</SelectItem>
                <SelectItem value="curveball">Curveball</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-primary">Team</label>
        <Select defaultValue="cle">
          <SelectTrigger className="w-[120px] bg-card border-border text-foreground">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cle">CLE</SelectItem>
            <SelectItem value="nyy">NYY</SelectItem>
            <SelectItem value="bos">BOS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-primary">vs Pitch</label>
        <Select defaultValue="fastball">
          <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
            <SelectValue placeholder="Pitch Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fastball">Four-Seam Fastball</SelectItem>
            <SelectItem value="slider">Slider</SelectItem>
            <SelectItem value="changeup">Changeup</SelectItem>
            <SelectItem value="curveball">Curveball</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-primary">Min. AB</label>
        <Input
          type="number"
          defaultValue="12"
          className="w-[90px] bg-card border-border text-foreground"
        />
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button className="px-3 py-2 text-xs font-medium bg-primary text-primary-foreground">
            RHH
          </button>
          <button className="px-3 py-2 text-xs font-medium bg-card text-muted-foreground hover:text-foreground transition-colors">
            LHH
          </button>
        </div>
      </div>
    </div>
  )
}
