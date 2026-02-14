import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'fs';

// Convert to 32x32 PNG for favicon
await sharp('public/favicon.jpg')
  .resize(32, 32)
  .png()
  .toFile('public/favicon-32.png');

// Convert to 180x180 PNG for apple-touch-icon
await sharp('public/apple-touch-icon.jpg')
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');

// Create ICO from the 32x32 PNG
const png32 = readFileSync('public/favicon-32.png');

// ICO file format: header + directory entry + PNG data
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);     // Reserved
header.writeUInt16LE(1, 2);     // ICO type
header.writeUInt16LE(1, 4);     // Number of images

const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(32, 0);     // Width
dirEntry.writeUInt8(32, 1);     // Height
dirEntry.writeUInt8(0, 2);      // Color palette
dirEntry.writeUInt8(0, 3);      // Reserved
dirEntry.writeUInt16LE(1, 4);   // Color planes
dirEntry.writeUInt16LE(32, 6);  // Bits per pixel
dirEntry.writeUInt32LE(png32.length, 8);  // Size of image data
dirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16)

const ico = Buffer.concat([header, dirEntry, png32]);
writeFileSync('public/favicon.ico', ico);

console.log('Favicon and apple-touch-icon generated successfully');
