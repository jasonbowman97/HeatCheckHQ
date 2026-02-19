"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Download,
  Image as ImageIcon,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Logo } from "@/components/logo"

/* ── Types ── */

interface Tweet {
  type: string
  text: string
  reply: string
  timeSlot: "morning" | "midday" | "pregame" | "engagement" | "educational"
  priority: number
}

interface TweetsResponse {
  generated: string
  date: string
  gamesCount: number
  hasGames: boolean
  categories: {
    morning: Tweet[]
    midday: Tweet[]
    pregame: Tweet[]
    engagement: Tweet[]
    educational: Tweet[]
  }
  count: number
  tweets: Tweet[]
}

interface GeneratedSheet {
  type: string
  imageUrl: string
  tweet: string
  reply: string
  altText: string
  hashtags: string[]
  dataAvailable: boolean
}

interface GenerateResponse {
  date: string
  generatedAt: string
  sheets: GeneratedSheet[]
  unavailable: string[]
}

type Category = keyof TweetsResponse["categories"]

const CATEGORIES: { key: Category; label: string; time: string }[] = [
  { key: "morning", label: "Morning", time: "9-11 AM" },
  { key: "midday", label: "Midday", time: "12-2 PM" },
  { key: "pregame", label: "Pre-Game", time: "4-6 PM" },
  { key: "engagement", label: "Engagement", time: "Anytime" },
  { key: "educational", label: "Educational", time: "1-2x/wk" },
]

const SHEET_LABELS: Record<string, { label: string; emoji: string }> = {
  nba_dvp: { label: "NBA DVP", emoji: "🏀" },
  nba_parlay: { label: "NBA Parlay", emoji: "🏀" },
  nba_pts_streaks: { label: "PTS Streaks", emoji: "🏀" },
  nba_reb_streaks: { label: "REB Streaks", emoji: "🏀" },
  nba_ast_streaks: { label: "AST Streaks", emoji: "🏀" },
  mlb_nrfi: { label: "MLB NRFI", emoji: "⚾" },
  mlb_strikeout: { label: "MLB Strikeouts", emoji: "⚾" },
  daily_recap: { label: "Daily Recap", emoji: "🔥" },
}

/* ── localStorage helpers ── */

function getStorageKey(date: string): string {
  return `hchq-social-posted-${date}`
}

function getPostedSet(date: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(getStorageKey(date))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function savePostedSet(date: string, posted: Set<string>) {
  try {
    localStorage.setItem(getStorageKey(date), JSON.stringify([...posted]))
  } catch {
    // localStorage may be unavailable
  }
}

/* ── Page ── */

export default function AdminSocialPage() {
  const [data, setData] = useState<TweetsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Category>("morning")
  const [posted, setPosted] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  // Cheat sheet state
  const [viewMode, setViewMode] = useState<"tweets" | "sheets">("sheets")
  const [sheets, setSheets] = useState<GeneratedSheet[]>([])
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [generatingCopy, setGeneratingCopy] = useState(false)

  const loadTweets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/social/tweets")
      if (!res.ok) throw new Error(`${res.status}`)
      const json: TweetsResponse = await res.json()
      setData(json)
      setPosted(getPostedSet(json.date))

      // Auto-select first tab that has tweets
      const firstWithTweets = CATEGORIES.find(
        (c) => (json.categories[c.key]?.length ?? 0) > 0
      )
      if (firstWithTweets) setActiveTab(firstWithTweets.key)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const generateSheets = useCallback(async () => {
    setGeneratingCopy(true)
    setSheetsError(null)
    try {
      const res = await fetch("/api/social/generate", { method: "POST" })
      if (!res.ok) throw new Error(`${res.status}`)
      const json: GenerateResponse = await res.json()
      setSheets(json.sheets)
    } catch (e) {
      setSheetsError(String(e))
    } finally {
      setGeneratingCopy(false)
    }
  }, [])

  // Load sheet previews (images only, no Claude copy yet)
  const loadSheetPreviews = useCallback(async () => {
    setSheetsLoading(true)
    setSheetsError(null)
    try {
      // Just build preview URLs for each sheet type
      const sheetTypes = ["nba_dvp", "nba_parlay", "nba_pts_streaks", "nba_reb_streaks", "nba_ast_streaks", "mlb_nrfi", "mlb_strikeout", "daily_recap"]
      const previews: GeneratedSheet[] = sheetTypes.map((type) => ({
        type,
        imageUrl: `/api/social/sheets/${type}`,
        tweet: "",
        reply: "",
        altText: "",
        hashtags: [],
        dataAvailable: true,
      }))
      setSheets(previews)
    } catch (e) {
      setSheetsError(String(e))
    } finally {
      setSheetsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTweets()
    loadSheetPreviews()
  }, [loadTweets, loadSheetPreviews])

  function tweetKey(tweet: Tweet, idx: number): string {
    return `${tweet.timeSlot}-${tweet.type}-${idx}`
  }

  function togglePosted(key: string) {
    if (!data) return
    setPosted((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      savePostedSet(data.date, next)
      return next
    })
  }

  function toggleReply(key: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // fallback: do nothing
    }
  }

  async function copyAllUnposted() {
    if (!data) return
    const tweets = data.categories[activeTab] ?? []
    const unposted = tweets
      .map((t, i) => ({ t, key: tweetKey(t, i) }))
      .filter(({ key }) => !posted.has(key))
      .map(({ t }) => `${t.text}\n\n---REPLY---\n${t.reply}`)
      .join("\n\n========\n\n")

    if (unposted) {
      await copyText(unposted, `all-${activeTab}`)
    }
  }

  async function downloadImage(imageUrl: string, filename: string) {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Download failed:", e)
    }
  }

  const activeTweets = data?.categories[activeTab] ?? []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Logo className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Social Content Engine</h1>
            <p className="text-sm text-muted-foreground">
              {data
                ? `${data.date} — ${data.count} tweets generated${data.hasGames ? ` (${data.gamesCount} games)` : " (off day)"}`
                : "Loading..."}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={generateSheets}
              disabled={generatingCopy}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {generatingCopy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {generatingCopy ? "Generating..." : "Generate with AI"}
            </button>
            <button
              onClick={loadTweets}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 mb-6">
          <button
            onClick={() => setViewMode("sheets")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              viewMode === "sheets"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Cheat Sheets
          </button>
          <button
            onClick={() => setViewMode("tweets")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
              viewMode === "tweets"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Template Tweets
          </button>
        </div>

        {/* Error */}
        {(error || sheetsError) && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
            {error ? `Failed to load tweets: ${error}` : `Failed to load sheets: ${sheetsError}`}
          </div>
        )}

        {/* Loading */}
        {loading && !data && viewMode === "tweets" && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* ── CHEAT SHEETS VIEW ── */}
        {viewMode === "sheets" && (
          <div className="flex flex-col gap-6">
            {sheetsLoading && (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {sheets.map((sheet) => {
              const meta = SHEET_LABELS[sheet.type] || {
                label: sheet.type,
                emoji: "📊",
              }

              return (
                <div
                  key={sheet.type}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Sheet header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.emoji}</span>
                      <span className="text-sm font-bold text-foreground">
                        {meta.label.toUpperCase()} CHEAT SHEET
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          downloadImage(
                            sheet.imageUrl,
                            `${sheet.type}-${new Date().toISOString().slice(0, 10)}.png`
                          )
                        }
                        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download PNG
                      </button>
                    </div>
                  </div>

                  {/* Sheet image preview */}
                  <div className="p-4 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sheet.imageUrl}
                      alt={sheet.altText || `${meta.label} cheat sheet`}
                      className="w-full rounded-lg border border-border/50"
                      loading="lazy"
                    />
                  </div>

                  {/* AI-generated copy (if available) */}
                  {sheet.tweet && (
                    <div className="border-t border-border">
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-bold text-primary">
                            AI-GENERATED COPY
                          </span>
                          <button
                            onClick={() =>
                              copyText(sheet.tweet, `sheet-tweet-${sheet.type}`)
                            }
                            className="ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                          >
                            {copiedKey === `sheet-tweet-${sheet.type}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed mb-3">
                          {sheet.tweet}
                        </pre>

                        {/* Reply */}
                        {sheet.reply && (
                          <div className="rounded-lg bg-secondary/30 p-3 mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                REPLY TWEET
                              </span>
                              <button
                                onClick={() =>
                                  copyText(sheet.reply, `sheet-reply-${sheet.type}`)
                                }
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copiedKey === `sheet-reply-${sheet.type}` ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground leading-relaxed">
                              {sheet.reply}
                            </pre>
                          </div>
                        )}

                        {/* Hashtags */}
                        {sheet.hashtags.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {sheet.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {sheets.length === 0 && !sheetsLoading && (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground">
                  No cheat sheets loaded
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click &quot;Generate with AI&quot; to create today&apos;s sheets with Claude-powered copy.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TEMPLATE TWEETS VIEW ── */}
        {viewMode === "tweets" && data && (
          <>
            {/* Category tabs */}
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1 mb-6 overflow-x-auto">
              {CATEGORIES.map((cat) => {
                const count = data.categories[cat.key]?.length ?? 0
                const postedCount = (data.categories[cat.key] ?? []).filter(
                  (t, i) => posted.has(tweetKey(t, i))
                ).length

                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveTab(cat.key)}
                    className={`flex-1 min-w-0 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                      activeTab === cat.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <div>{cat.label}</div>
                    <div className={`text-[10px] font-normal mt-0.5 ${activeTab === cat.key ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {count > 0 ? (
                        postedCount === count ? "All posted" : `${count - postedCount} of ${count} ready`
                      ) : (
                        "No tweets"
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Tab header with copy all */}
            {activeTweets.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">
                  Best posting time: <span className="font-semibold text-foreground">
                    {CATEGORIES.find((c) => c.key === activeTab)?.time}
                  </span>
                </p>
                <button
                  onClick={copyAllUnposted}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {copiedKey === `all-${activeTab}` ? (
                    <><Check className="h-3.5 w-3.5" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy all unposted</>
                  )}
                </button>
              </div>
            )}

            {/* Tweet cards */}
            {activeTweets.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground">No tweets in this category</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.hasGames
                    ? "This category didn't generate content for today's slate."
                    : "Off day — check Engagement and Educational tabs."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeTweets.map((tweet, idx) => {
                  const key = tweetKey(tweet, idx)
                  const isPosted = posted.has(key)
                  const isReplyExpanded = expandedReplies.has(key)

                  return (
                    <div
                      key={key}
                      className={`rounded-xl border bg-card overflow-hidden transition-opacity ${
                        isPosted ? "border-emerald-500/20 opacity-60" : "border-border"
                      }`}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/80">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            tweet.type === "streak_poll"
                              ? "text-violet-400 bg-violet-400/10"
                              : "text-muted-foreground bg-secondary"
                          }`}>
                            {tweet.type === "streak_poll" ? "Poll" : tweet.type.replace(/_/g, " ")}
                          </span>
                          {isPosted && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                              Posted
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyText(tweet.text, `tweet-${key}`)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                            title="Copy tweet"
                          >
                            {copiedKey === `tweet-${key}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            Copy
                          </button>
                          <button
                            onClick={() => togglePosted(key)}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                              isPosted
                                ? "text-emerald-400 hover:bg-emerald-400/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {isPosted ? "Posted" : "Mark posted"}
                          </button>
                        </div>
                      </div>

                      {/* Tweet body */}
                      <div className="px-4 py-3">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                          {tweet.text}
                        </pre>
                      </div>

                      {/* Reply section */}
                      <div className="border-t border-border">
                        <button
                          onClick={() => toggleReply(key)}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="font-medium">Reply tweet (with link)</span>
                          <div className="flex items-center gap-1.5">
                            {isReplyExpanded && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyText(tweet.reply, `reply-${key}`)
                                }}
                                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium hover:bg-secondary transition-colors"
                              >
                                {copiedKey === `reply-${key}` ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                            {isReplyExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </button>
                        {isReplyExpanded && (
                          <div className="px-4 pb-3">
                            <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground leading-relaxed bg-secondary/30 rounded-lg p-3">
                              {tweet.reply}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
