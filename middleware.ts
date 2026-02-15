import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rate limiting store (in-memory, consider Redis for production)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `${ip}-${request.nextUrl.pathname}`
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimit.get(key)

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count }
}

// Clean up stale entries inline during rate limit checks
function cleanupRateLimit() {
  const now = Date.now()
  if (rateLimit.size > 1000) {
    for (const [key, record] of rateLimit.entries()) {
      if (now > record.resetTime) {
        rateLimit.delete(key)
      }
    }
  }
}

export async function middleware(request: NextRequest) {
  // --- Supabase session refresh ---
  // Only refresh auth sessions on pages that need it (auth, account, checkout,
  // protected dashboards). Skip for public pages, API routes, and static assets
  // to avoid 50-200ms latency on every request.
  const pathname = request.nextUrl.pathname
  const needsAuth =
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/nba/defense-vs-position') ||
    pathname.startsWith('/nba/head-to-head') ||
    pathname.startsWith('/nba/trends') ||
    pathname.startsWith('/nba/first-basket') ||
    pathname.startsWith('/nfl/defense-vs-position') ||
    pathname.startsWith('/nfl/trends') ||
    pathname.startsWith('/nfl/matchup') ||
    pathname.startsWith('/mlb/hitting-stats') ||
    pathname.startsWith('/mlb/pitching-stats') ||
    pathname.startsWith('/mlb/hot-hitters') ||
    pathname.startsWith('/mlb/trends')

  let supabaseResponse = NextResponse.next({ request })

  if (needsAuth) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
              request.cookies.set(name, value),
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              supabaseResponse.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    // Refresh session - must call getUser() to keep sessions alive
    await supabase.auth.getUser()
  }

  const response = supabaseResponse

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    cleanupRateLimit()
    const key = getRateLimitKey(request)
    const { allowed, remaining } = checkRateLimit(key)

    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', (Date.now() + RATE_LIMIT_WINDOW).toString())

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }
  }

  // Security Headers -- start from supabaseResponse headers to preserve cookies
  const headers = new Headers(response.headers)

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.espn.com https://statsapi.mlb.com https://*.vercel.app https://vercel.live wss://ws-us3.pusher.com https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com",
    "frame-src 'self' https://vercel.live https://js.stripe.com https://*.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  headers.set('Content-Security-Policy', csp)

  // Strict Transport Security (HSTS)
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy but still useful)
  headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy (formerly Feature Policy)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Remove server header
  headers.delete('X-Powered-By')

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers })
  }

  // Apply all security headers to the supabase response (preserving its cookies)
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
