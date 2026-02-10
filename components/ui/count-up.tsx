"use client"

import { useInView, useSpring } from "framer-motion"
import { useEffect, useRef, useState } from "react"

interface CountUpProps {
  value: number
  duration?: number
  suffix?: string
  className?: string
}

export function CountUp({ value, duration = 2, suffix = "", className = "" }: CountUpProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [displayValue, setDisplayValue] = useState(0)

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  })

  useEffect(() => {
    if (isInView) {
      spring.set(value)
    }

    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest))
    })

    return () => unsubscribe()
  }, [isInView, spring, value])

  return (
    <span ref={ref} className={className}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}
