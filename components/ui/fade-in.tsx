"use client"

import { motion, useInView } from "framer-motion"
import { useRef, ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  fullWidth?: boolean
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  fullWidth = false,
  className = "",
}: FadeInProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const directions = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { y: 0, x: 24 },
    right: { y: 0, x: -24 },
    none: { y: 0, x: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...directions[direction],
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              x: 0,
            }
          : {
              opacity: 0,
              ...directions[direction],
            }
      }
      transition={{
        duration: 0.4,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={fullWidth ? "w-full" : className}
    >
      {children}
    </motion.div>
  )
}
