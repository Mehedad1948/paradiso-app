export type Area = { x: number; y: number; width: number; height: number };
/** Each adjustment runs from -100 to 100; 0 leaves the image untouched. */
export type Adjustments = { brightness: number; contrast: number; saturation: number };

export const NEUTRAL: Adjustments = { brightness: 0, contrast: 0, saturation: 0 };
export const AVATAR_OUTPUT_SIZE = 512;

/** Adjustment slider values as CSS filter amounts (1 = unchanged). */
export function filterAmounts({ brightness, contrast, saturation }: Adjustments) {
  return {
    brightness: 1 + brightness / 200,
    contrast: 1 + contrast / 200,
    saturation: 1 + saturation / 100,
  };
}

export function cssFilter(adjustments: Adjustments) {
  const { brightness, contrast, saturation } = filterAmounts(adjustments);
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
}

const clamp = (value: number) => (value < 0 ? 0 : value > 255 ? 255 : value);

/**
 * Applies the same maths as the CSS filter preview, in the same order, directly to RGBA pixels.
 * `ctx.filter` would be shorter but Safari ignores it, so the saved file could differ from the preview.
 */
export function adjustPixels(data: Uint8ClampedArray, adjustments: Adjustments) {
  const { brightness: b, contrast: c, saturation: s } = filterAmounts(adjustments);
  if (b === 1 && c === 1 && s === 1) return data;
  for (let i = 0; i < data.length; i += 4) {
    let r = clamp(data[i] * b);
    let g = clamp(data[i + 1] * b);
    let bl = clamp(data[i + 2] * b);
    r = clamp((r - 127.5) * c + 127.5);
    g = clamp((g - 127.5) * c + 127.5);
    bl = clamp((bl - 127.5) * c + 127.5);
    data[i] = (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * bl;
    data[i + 1] = (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * bl;
    data[i + 2] = (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * bl;
  }
  return data;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be read. Try another file."));
    image.src = src;
  });
}

/** Crops (in rotated-image pixels, as the cropper reports them), adjusts and encodes a square JPEG. */
export async function renderAvatar(
  src: string,
  crop: Area,
  rotation: number,
  adjustments: Adjustments,
  size = AVATAR_OUTPUT_SIZE,
): Promise<File> {
  const image = await loadImage(src);
  const radians = (rotation * Math.PI) / 180;
  const width = Math.abs(Math.cos(radians)) * image.width + Math.abs(Math.sin(radians)) * image.height;
  const height = Math.abs(Math.sin(radians)) * image.width + Math.abs(Math.cos(radians)) * image.height;

  const rotated = document.createElement("canvas");
  rotated.width = Math.round(width);
  rotated.height = Math.round(height);
  const source = rotated.getContext("2d");
  if (!source) throw new Error("Image editing isn't supported in this browser.");
  source.translate(width / 2, height / 2);
  source.rotate(radians);
  source.drawImage(image, -image.width / 2, -image.height / 2);

  const output = document.createElement("canvas");
  output.width = size;
  output.height = size;
  const context = output.getContext("2d");
  if (!context) throw new Error("Image editing isn't supported in this browser.");
  context.fillStyle = "#fff"; // JPEG has no transparency.
  context.fillRect(0, 0, size, size);
  context.imageSmoothingQuality = "high";
  context.drawImage(rotated, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size);
  adjustPixels(pixels.data, adjustments);
  context.putImageData(pixels, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    output.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("The edited image could not be saved. Please try again.");
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
