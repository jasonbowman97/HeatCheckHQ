"use client"

import { useRef, useState, useCallback } from "react"
import { Camera, Download, Copy, Share2, Check, Loader2 } from "lucide-react"

interface ShareCaptureProps {
  children: React.ReactNode
  /** Label shown on the share image watermark */
  label?: string
}

/**
 * Wraps any graphical section and adds a small capture button.
 * On click, uses html2canvas to capture the content into a 16:9
 * canvas with HeatCheckHQ branding and dark background.
 */
export function ShareCapture({ children, label }: ShareCaptureProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState(false)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCapture = useCallback(async () => {
    if (!contentRef.current || capturing) return

    setCapturing(true)
    setCapturedUrl(null)

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default

      // Capture the content
      const sourceCanvas = await html2canvas(contentRef.current, {
        backgroundColor: "#0a0a0b", // matches dark theme bg
        scale: 2, // high-res
        useCORS: true,
        logging: false,
      })

      // Create 16:9 output canvas
      const outputWidth = 1920
      const outputHeight = 1080
      const outputCanvas = document.createElement("canvas")
      outputCanvas.width = outputWidth
      outputCanvas.height = outputHeight
      const ctx = outputCanvas.getContext("2d")!

      // Dark background
      ctx.fillStyle = "#0a0a0b"
      ctx.fillRect(0, 0, outputWidth, outputHeight)

      // Calculate scaling to fit content centered with padding
      const padding = 60
      const availW = outputWidth - padding * 2
      const availH = outputHeight - padding * 2 - 40 // reserve space for watermark

      const scale = Math.min(
        availW / sourceCanvas.width,
        availH / sourceCanvas.height,
        1 // don't upscale
      )

      const drawW = sourceCanvas.width * scale
      const drawH = sourceCanvas.height * scale
      const drawX = (outputWidth - drawW) / 2
      const drawY = (outputHeight - 40 - drawH) / 2

      ctx.drawImage(sourceCanvas, drawX, drawY, drawW, drawH)

      // Watermark
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
      ctx.font = "bold 14px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "right"
      ctx.fillText("heatcheckhq.io", outputWidth - padding, outputHeight - 20)

      // Optional label
      if (label) {
        ctx.textAlign = "left"
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)"
        ctx.font = "13px system-ui, -apple-system, sans-serif"
        ctx.fillText(label, padding, outputHeight - 20)
      }

      const dataUrl = outputCanvas.toDataURL("image/png")
      setCapturedUrl(dataUrl)
    } catch (err) {
      console.error("Screenshot capture failed:", err)
    } finally {
      setCapturing(false)
    }
  }, [capturing, label])

  const handleDownload = useCallback(() => {
    if (!capturedUrl) return
    const link = document.createElement("a")
    link.download = `heatcheckhq-${Date.now()}.png`
    link.href = capturedUrl
    link.click()
  }, [capturedUrl])

  const handleCopy = useCallback(async () => {
    if (!capturedUrl) return
    try {
      const res = await fetch(capturedUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: download instead
      handleDownload()
    }
  }, [capturedUrl, handleDownload])

  const handleShare = useCallback(async () => {
    if (!capturedUrl) return
    try {
      const res = await fetch(capturedUrl)
      const blob = await res.blob()
      const file = new File([blob], "heatcheckhq.png", { type: "image/png" })

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: "HeatCheck HQ",
          text: label || "Check this out on HeatCheck HQ",
        })
      } else {
        handleCopy()
      }
    } catch {
      handleCopy()
    }
  }, [capturedUrl, label, handleCopy])

  const handleClose = useCallback(() => {
    setCapturedUrl(null)
  }, [])

  return (
    <div className="relative group/capture">
      {/* Content to capture */}
      <div ref={contentRef}>
        {children}
      </div>

      {/* Capture button - appears on hover */}
      <button
        onClick={handleCapture}
        disabled={capturing}
        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-background/80 backdrop-blur border border-border/60 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-background/95 transition-all opacity-0 group-hover/capture:opacity-100 focus:opacity-100 shadow-sm"
        title="Capture as 16:9 image"
      >
        {capturing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Camera className="h-3 w-3" />
        )}
        {capturing ? "Capturing..." : "Share"}
      </button>

      {/* Captured image overlay */}
      {capturedUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col gap-4 max-w-3xl w-full mx-4">
            {/* Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedUrl}
              alt="Captured screenshot"
              className="w-full rounded-lg border border-border shadow-2xl"
            />

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                onClick={handleClose}
                className="ml-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
