import sharp from 'sharp';
import { join } from 'path';

const publicDir = join(import.meta.dirname, '..', 'public');

// 1200x630 OG image as SVG — matches the Twitter header style
const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="40%">
      <stop offset="0%" stop-color="#2dd4a8" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#2dd4a8" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0d1117"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Logo: ascending bars + flame, positioned center-left -->
  <g transform="translate(360, 275) scale(7) translate(-12, -14)">
    <!-- Bar 1 -->
    <rect x="3" y="17" width="4" height="5" rx="1" fill="#2dd4a8" opacity="0.4"/>
    <!-- Bar 2 -->
    <rect x="10" y="13" width="4" height="9" rx="1" fill="#2dd4a8" opacity="0.65"/>
    <!-- Bar 3 -->
    <rect x="17" y="10" width="4" height="12" rx="1" fill="#2dd4a8" opacity="0.9"/>
    <!-- Flame outer -->
    <path d="M19 10c0 0-2.8-3.5-2.8-6.3c0-1.5 0.8-2.7 1.5-3.3c0.3 1.1 1.1 2 1.9 2.7c0.8 0.8 1.5 1.7 1.5 3c0 2-1.2 3.9-2.1 3.9z" fill="#2dd4a8"/>
    <!-- Flame inner -->
    <path d="M19 10c0 0-1.2-1.5-1.2-2.8c0-0.7 0.35-1.2 0.6-1.5c0.13 0.5 0.5 0.9 0.85 1.2c0.35 0.35 0.65 0.8 0.65 1.5c0 0.9-0.5 1.6-0.9 1.6z" fill="#0d1117" opacity="0.85"/>
  </g>

  <!-- Brand name -->
  <text x="490" y="265" fill="#ffffff" font-family="Segoe UI, -apple-system, sans-serif" font-weight="bold" font-size="56">HeatCheck HQ</text>

  <!-- Tagline -->
  <text x="490" y="315" fill="#2dd4a8" font-family="Segoe UI, -apple-system, sans-serif" font-weight="500" font-size="24">Your daily heat checks for every play</text>

  <!-- Description -->
  <text x="490" y="360" fill="rgba(255,255,255,0.5)" font-family="Segoe UI, -apple-system, sans-serif" font-size="18">Free sports betting analytics — heatmaps, streaks &amp; matchup tools</text>

  <!-- Sport badges -->
  <g transform="translate(490, 395)">
    <!-- MLB -->
    <rect x="0" y="0" width="65" height="28" rx="6" fill="rgba(45,212,168,0.12)" stroke="rgba(45,212,168,0.25)" stroke-width="1"/>
    <text x="32.5" y="19" fill="#2dd4a8" font-family="Segoe UI, -apple-system, sans-serif" font-weight="bold" font-size="14" text-anchor="middle">MLB</text>
    <!-- NBA -->
    <rect x="80" y="0" width="65" height="28" rx="6" fill="rgba(45,212,168,0.12)" stroke="rgba(45,212,168,0.25)" stroke-width="1"/>
    <text x="112.5" y="19" fill="#2dd4a8" font-family="Segoe UI, -apple-system, sans-serif" font-weight="bold" font-size="14" text-anchor="middle">NBA</text>
    <!-- NFL -->
    <rect x="160" y="0" width="65" height="28" rx="6" fill="rgba(45,212,168,0.12)" stroke="rgba(45,212,168,0.25)" stroke-width="1"/>
    <text x="192.5" y="19" fill="#2dd4a8" font-family="Segoe UI, -apple-system, sans-serif" font-weight="bold" font-size="14" text-anchor="middle">NFL</text>
  </g>

  <!-- URL -->
  <text x="1160" y="600" fill="rgba(255,255,255,0.3)" font-family="Segoe UI, -apple-system, sans-serif" font-size="16" text-anchor="end">heatcheckhq.io</text>
</svg>`;

async function generate() {
  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(join(publicDir, 'og-image.png'));
  console.log('✓ og-image.png (1200x630)');
}

generate().catch(console.error);
