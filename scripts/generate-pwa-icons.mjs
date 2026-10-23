// Regenerates the PWA icon set from public/app-icon.png.
// Usage: node scripts/generate-pwa-icons.mjs
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "public/app-icon.png";
const OUT = "public/icons";
// The artwork's inner card colour, used to bleed full-square icons to the edges.
const CARD = "#fdfdfd";

await mkdir(OUT, { recursive: true });

// "any" purpose: the artwork as drawn, rounded corners and border included.
for (const size of [48, 72, 96, 144, 192, 256, 384, 512]) {
  await sharp(SOURCE).resize(size, size).png().toFile(`${OUT}/icon-${size}.png`);
}

// Maskable / Apple: the platform applies its own shape, so drop the drawn border and
// pad the monogram into the 80% safe zone on a flat, opaque square.
const { width } = await sharp(SOURCE).metadata();
const inset = Math.round(width * 0.15);
const inner = width - inset * 2;
const pad = Math.round(inner * 0.16);
const fullBleed = await sharp(SOURCE)
  .extract({ left: inset, top: inset, width: inner, height: inner })
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: CARD })
  .flatten({ background: CARD })
  .png()
  .toBuffer();

for (const size of [192, 512]) {
  await sharp(fullBleed).resize(size, size).png().toFile(`${OUT}/maskable-${size}.png`);
}
await sharp(fullBleed).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);

console.log(`PWA icons written to ${OUT}/`);
