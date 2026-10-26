// Regenerates the PWA icon set from public/Paradiso.svg: the light glyph on a dark tile.
// Android builds the install splash from the manifest icons + background_color, so every
// icon uses the same dark tile as BACKGROUND (keep it in sync with app/manifest.ts).
// Usage: node scripts/generate-pwa-icons.mjs
import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "public/Paradiso.svg";
const OUT = "public/icons";
const BACKGROUND = "#171815";
const GLYPH = "#f0f1f3";

const svg = await readFile(SOURCE, "utf8");
const [, , vbW, vbH] = svg.match(/viewBox="([\d.\s-]+)"/)[1].split(/\s+/).map(Number);
const pathData = svg.match(/<path d="([^"]+)"/)[1];

// Glyph width as a fraction of the tile, and the corner radius for non-maskable icons.
const GLYPH_FRACTION = { any: 0.62, maskable: 0.5 };
const RADIUS = 0.22;

const tile = (size, kind) => {
  const w = size * GLYPH_FRACTION[kind];
  const h = (w * vbH) / vbW;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  // Rounded corners are transparent, so they vanish against the splash background.
  // Maskable and Apple icons stay full-bleed; the platform applies its own mask.
  const rx = kind === "any" ? size * RADIUS : 0;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" rx="${rx}" fill="${BACKGROUND}"/>` +
      `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${vbW} ${vbH}">` +
      `<path fill="${GLYPH}" d="${pathData}"/></svg></svg>`,
  );
};

const write = (size, kind, file) =>
  sharp(tile(size, kind), { density: 300 }).resize(size, size).png().toFile(`${OUT}/${file}`);

await mkdir(OUT, { recursive: true });

for (const size of [48, 72, 96, 144, 192, 256, 384, 512]) {
  await write(size, "any", `icon-${size}.png`);
}
for (const size of [192, 512]) {
  await write(size, "maskable", `maskable-${size}.png`);
}
await write(180, "maskable", "apple-touch-icon.png");

console.log(`PWA icons written to ${OUT}/`);
