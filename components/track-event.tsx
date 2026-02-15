"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

interface TrackEventProps {
  event: string
  params?: Record<string, string | number | boolean>
}

export function TrackEvent({ event, params }: TrackEventProps) {
  useEffect(() => {
    trackEvent(event, params)
  }, [event, params])

  return null
}
