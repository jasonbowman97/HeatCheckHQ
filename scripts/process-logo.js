const sharp = require("sharp")
const path = require("path")

const SOURCE = path.resolve("C:\\Users\\jason\\OneDrive\\HeatCheckHQ Logo.png")
const PUBLIC = path.resolve("public")

async function generate() {
  // Read source image metadata
  const meta = await sharp(SOURCE).metadata()
  console.log(`Source: ${meta.width}x${meta.height}, ${meta.format}`)

  // 1. logo.png — 512x512, logo centered on dark background
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 15, g: 23, b: 32, alpha: 255 } }
  })
    .composite([{
      input: await sharp(SOURCE).resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
      gravity: "centre"
    }])
    .png()
    .toFile(path.join(PUBLIC, "logo.png"))
  console.log("Generated: logo.png (512x512)")

  // 2. apple-touch-icon.png — 180x180
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: { r: 15, g: 23, b: 32, alpha: 255 } }
  })
    .composite([{
      input: await sharp(SOURCE).resize(150, 150, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
      gravity: "centre"
    }])
    .png()
    .toFile(path.join(PUBLIC, "apple-touch-icon.png"))
  console.log("Generated: apple-touch-icon.png (180x180)")

  // 3. favicon.ico — 32x32
  await sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 15, g: 23, b: 32, alpha: 255 } }
  })
    .composite([{
      input: await sharp(SOURCE).resize(28, 28, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
      gravity: "centre"
    }])
    .png()
    .toFile(path.join(PUBLIC, "favicon.ico"))
  console.log("Generated: favicon.ico (32x32)")

  // 4. og-image.png — 1200x630, logo + branding on dark background
  // First create the base with logo
  const ogBase = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 15, g: 23, b: 32, alpha: 255 } }
  })
    .composite([{
      input: await sharp(SOURCE).resize(280, 280, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
      top: 60,
      left: 460
    }])
    .png()
    .toBuffer()

  // Add text overlay via SVG
  const textOverlay = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="40" width="1120" height="550" rx="24" stroke="#2bb5a0" stroke-width="1" fill="none" opacity="0.2"/>
      <text x="600" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#2bb5a0" text-anchor="middle" font-weight="600">Sports Analytics Platform</text>
      <rect x="400" y="450" width="80" height="32" rx="16" stroke="#2bb5a0" stroke-width="1.5" fill="none" opacity="0.4"/>
      <text x="440" y="472" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#2bb5a0" text-anchor="middle">MLB</text>
      <rect x="510" y="450" width="80" height="32" rx="16" stroke="#2bb5a0" stroke-width="1.5" fill="none" opacity="0.4"/>
      <text x="550" y="472" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#2bb5a0" text-anchor="middle">NBA</text>
      <rect x="620" y="450" width="80" height="32" rx="16" stroke="#2bb5a0" stroke-width="1.5" fill="none" opacity="0.4"/>
      <text x="660" y="472" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#2bb5a0" text-anchor="middle">NFL</text>
      <text x="600" y="545" font-family="system-ui, sans-serif" font-size="16" fill="#666" text-anchor="middle">Real-time stats, trends, streaks, and matchup analysis</text>
    </svg>
  `)

  await sharp(ogBase)
    .composite([{ input: textOverlay, gravity: "centre" }])
    .png()
    .toFile(path.join(PUBLIC, "og-image.png"))
  console.log("Generated: og-image.png (1200x630)")

  console.log("\nDone! All assets generated from your logo.")
}

generate().catch(console.error)
