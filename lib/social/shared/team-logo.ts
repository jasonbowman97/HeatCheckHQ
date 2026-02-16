/**
 * Fetch ESPN team logos and convert to base64 data URIs for Satori embedding.
 * Logos are cached in-memory for the lifetime of the serverless function.
 */

const logoCache = new Map<string, string>()

/**
 * Get a team logo as a base64 data URI, suitable for use in <img> inside Satori JSX.
 * Falls back to a transparent 1x1 pixel if fetch fails.
 */
export async function getTeamLogoBase64(logoUrl: string): Promise<string> {
  if (!logoUrl) return FALLBACK_LOGO
  if (logoCache.has(logoUrl)) return logoCache.get(logoUrl)!

  try {
    const res = await fetch(logoUrl, {
      next: { revalidate: 86400 }, // cache logos for 24h
    })
    if (!res.ok) return FALLBACK_LOGO

    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const contentType = res.headers.get("content-type") || "image/png"
    const dataUri = `data:${contentType};base64,${base64}`

    logoCache.set(logoUrl, dataUri)
    return dataUri
  } catch {
    return FALLBACK_LOGO
  }
}

/**
 * Batch-fetch multiple team logos in parallel.
 * Returns a Map of logoUrl → base64 data URI.
 */
export async function getTeamLogos(
  logoUrls: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(logoUrls.filter(Boolean))]
  const entries = await Promise.all(
    unique.map(async (url) => [url, await getTeamLogoBase64(url)] as const)
  )
  return new Map(entries)
}

/** Transparent 1x1 PNG fallback */
const FALLBACK_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
