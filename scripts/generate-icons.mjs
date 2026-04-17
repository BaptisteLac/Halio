/**
 * Génère les icônes PWA pour PêcheBoard.
 * Utilise sharp (dépendance transitive de Next.js).
 * Usage : node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');

await mkdir(outDir, { recursive: true });

// SVG de base : fond slate-950 (#0f172a), hameçon stylisé
function makeSvg(size, padding = 0) {
  const inner = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = inner * 0.38;
  // Cercle décoratif + onde + hameçon emoji rendu en SVG text
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#0f172a"/>
  <!-- Cercle accent cyan -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#22d3ee" stroke-width="${size * 0.03}" opacity="0.3"/>
  <!-- Texte emoji -->
  <text x="${cx}" y="${cy + inner * 0.13}" font-size="${inner * 0.52}" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">🎣</text>
  <!-- Nom -->
  <text x="${cx}" y="${size - padding - inner * 0.08}" font-size="${inner * 0.1}" text-anchor="middle" fill="#22d3ee" font-family="system-ui, sans-serif" font-weight="600" letter-spacing="1">HALIO</text>
</svg>`;
}

async function generate(filename, size, padding = 0) {
  const svg = Buffer.from(makeSvg(size, padding));
  await sharp(svg)
    .png()
    .toFile(path.join(outDir, filename));
  console.log(`✓ ${filename} (${size}x${size})`);
}

// Icônes standard
await generate('icon-192.png', 192);
await generate('icon-512.png', 512);

// Icône maskable : padding 20% (safe zone Android)
await generate('icon-maskable-512.png', 512, Math.round(512 * 0.1));

// Apple touch icon (dans public/, pas icons/)
const appleDir = path.join(__dirname, '..', 'public');
const svgApple = Buffer.from(makeSvg(180));
await sharp(svgApple).png().toFile(path.join(appleDir, 'apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png (180x180)');

console.log('\nIcones générées dans public/icons/ et public/');
