import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const publicDir = join(import.meta.dirname, '..', 'public');

// Concept D SVG with hardcoded brand colors (not Tailwind classes)
const logoSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect x="3" y="17" width="4" height="5" rx="1" fill="#2dd4a8" opacity="0.4"/>
  <rect x="10" y="13" width="4" height="9" rx="1" fill="#2dd4a8" opacity="0.65"/>
  <rect x="17" y="10" width="4" height="12" rx="1" fill="#2dd4a8" opacity="0.9"/>
  <path d="M19 10c0 0-2.8-3.5-2.8-6.3c0-1.5 0.8-2.7 1.5-3.3c0.3 1.1 1.1 2 1.9 2.7c0.8 0.8 1.5 1.7 1.5 3c0 2-1.2 3.9-2.1 3.9z" fill="#2dd4a8"/>
  <path d="M19 10c0 0-1.2-1.5-1.2-2.8c0-0.7 0.35-1.2 0.6-1.5c0.13 0.5 0.5 0.9 0.85 1.2c0.35 0.35 0.65 0.8 0.65 1.5c0 0.9-0.5 1.6-0.9 1.6z" fill="#0d1117" opacity="0.85"/>
</svg>`;

// Full avatar with background (for logo.png and social media)
const avatarSvg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="400" height="400" fill="#0d1117"/>
  <rect x="20" y="20" width="360" height="360" rx="40" fill="#151b23"/>
  <g transform="translate(200, 215) scale(13) translate(-12, -14)">
    <rect x="3" y="17" width="4" height="5" rx="1" fill="#2dd4a8" opacity="0.4"/>
    <rect x="10" y="13" width="4" height="9" rx="1" fill="#2dd4a8" opacity="0.65"/>
    <rect x="17" y="10" width="4" height="12" rx="1" fill="#2dd4a8" opacity="0.9"/>
    <path d="M19 10c0 0-2.8-3.5-2.8-6.3c0-1.5 0.8-2.7 1.5-3.3c0.3 1.1 1.1 2 1.9 2.7c0.8 0.8 1.5 1.7 1.5 3c0 2-1.2 3.9-2.1 3.9z" fill="#2dd4a8"/>
    <path d="M19 10c0 0-1.2-1.5-1.2-2.8c0-0.7 0.35-1.2 0.6-1.5c0.13 0.5 0.5 0.9 0.85 1.2c0.35 0.35 0.65 0.8 0.65 1.5c0 0.9-0.5 1.6-0.9 1.6z" fill="#0d1117" opacity="0.85"/>
  </g>
</svg>`;

const svgBuf = Buffer.from(logoSvg);
const avatarBuf = Buffer.from(avatarSvg);

// Generate icon-only PNGs (transparent bg, for favicon/apple-touch)
async function generate() {
  // logo.png — 512x512 with background
  await sharp(avatarBuf).resize(512, 512).png().toFile(join(publicDir, 'logo.png'));
  console.log('✓ logo.png (512x512)');

  // apple-touch-icon.png — 180x180 with background
  await sharp(avatarBuf).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180)');

  // icon-192.png — 192x192 with background
  await sharp(avatarBuf).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
  console.log('✓ icon-192.png (192x192)');

  // favicon.ico — 32x32 from icon-only SVG (transparent)
  const favicon32 = await sharp(svgBuf).resize(32, 32).png().toBuffer();
  await sharp(favicon32).toFile(join(publicDir, 'favicon.ico'));
  console.log('✓ favicon.ico (32x32)');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
