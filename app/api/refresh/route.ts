import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  const cronSecret = request.headers.get("authorization")?.replace("Bearer ", "")

  // Allow access via query param OR Vercel cron's CRON_SECRET header
  const isAuthorized =
    (process.env.REFRESH_SECRET && secret === process.env.REFRESH_SECRET) ||
    (process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET)

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Revalidate all API routes
    const apiPaths = [
      "/api/mlb/batting",
      "/api/mlb/pitching",
      "/api/mlb/schedule",
      "/api/mlb/trends",
      "/api/nba/schedule",
      "/api/nba/h2h",
      "/api/nba/trends",
      "/api/nba/defense-vs-position",
      "/api/nfl/schedule",
      "/api/nfl/matchup",
      "/api/nfl/trends",
      "/api/hot-hitters",
      "/api/nba/first-basket-pbp",
      "/api/nba/first-3min",
      "/api/nba/second-half-pbp",
    ]

    // Revalidate dashboard pages with server-side data
    const pagePaths = [
      "/mlb/trends",
      "/nba/trends",
      "/nfl/trends",
    ]

    for (const path of [...apiPaths, ...pagePaths]) {
      revalidatePath(path)
    }

    return NextResponse.json({
      success: true,
      revalidated: apiPaths.length + pagePaths.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[Refresh] Error:", err)
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 })
  }
}
