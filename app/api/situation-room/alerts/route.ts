// ============================================================
// api/situation-room/alerts/route.ts — SSE stream for live updates
// ============================================================
// Server-Sent Events endpoint that pushes real-time alerts:
// injury updates, line movements, weather changes, convergence shifts.
// Clients subscribe by sport and receive periodic updates.

import { NextRequest } from 'next/server'
import type { Sport } from '@/types/shared'
import type { PropAlert } from '@/types/innovation-playbook'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sport = (searchParams.get('sport') ?? 'nba') as Sport

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ sport, timestamp: new Date().toISOString() })}\n\n`)
      )

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30_000)

      // Poll for alerts every 60 seconds
      // In production, this would listen to a real-time feed (Supabase Realtime, Redis Pub/Sub, etc.)
      const pollInterval = setInterval(async () => {
        try {
          const alerts = await pollForAlerts(sport)
          if (alerts.length > 0) {
            const data = JSON.stringify({ alerts, timestamp: new Date().toISOString() })
            controller.enqueue(encoder.encode(`event: alerts\ndata: ${data}\n\n`))
          }
        } catch {
          // Swallow polling errors — don't kill the stream
        }
      }, 60_000)

      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clearInterval(pollInterval)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

/**
 * Poll for new alerts. In production, this would check a database or
 * message queue for new updates since the last poll. For now, returns
 * empty — alerts will come from the initial GET endpoint and real-time
 * sources will be wired up when data feeds are available.
 */
async function pollForAlerts(_sport: Sport): Promise<PropAlert[]> {
  // TODO: Wire to real-time data sources:
  // - Supabase Realtime for line movements
  // - ESPN injury feed for injury updates
  // - Weather API delta for weather changes
  return []
}
