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

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export type Surface = { canvas: HTMLCanvasElement | OffscreenCanvas; context: Context2D };
type MakeSurface = (width: number, height: number) => Surface | null;
type Source = CanvasImageSource & { width: number; height: number };

export type AvatarRenderRequest = {
  image: Blob;
  crop: Area;
  rotation: number;
  adjustments: Adjustments;
  size: number;
};
export type AvatarRenderResponse = { ok: true; blob: Blob } | { ok: false; message: string };

export const UNSUPPORTED = "Image editing isn't supported in this browser.";
export const UNREADABLE = "This image could not be read. Try another file.";
export const UNSAVED = "The edited image could not be saved. Please try again.";

/**
 * Crops (in rotated-image pixels, as the cropper reports them) and adjusts onto a square canvas.
 * Shared by the worker (OffscreenCanvas) and the main-thread fallback (DOM canvas).
 */
export function paintAvatar(
  image: Source,
  crop: Area,
  rotation: number,
  adjustments: Adjustments,
  size: number,
  makeSurface: MakeSurface,
): Surface {
  let source: Source = image;
  if (rotation % 360 !== 0) {
    const radians = (rotation * Math.PI) / 180;
    const width = Math.abs(Math.cos(radians)) * image.width + Math.abs(Math.sin(radians)) * image.height;
    const height = Math.abs(Math.sin(radians)) * image.width + Math.abs(Math.cos(radians)) * image.height;
    const rotated = makeSurface(Math.round(width), Math.round(height));
    if (!rotated) throw new Error(UNSUPPORTED);
    rotated.context.translate(width / 2, height / 2);
    rotated.context.rotate(radians);
    rotated.context.drawImage(image, -image.width / 2, -image.height / 2);
    source = rotated.canvas;
  }

  const output = makeSurface(size, size);
  if (!output) throw new Error(UNSUPPORTED);
  const { context } = output;
  context.fillStyle = "#fff"; // JPEG has no transparency.
  context.fillRect(0, 0, size, size);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size);
  adjustPixels(pixels.data, adjustments);
  context.putImageData(pixels, 0, 0);
  return output;
}

/** Worker side: decode, paint and encode entirely off the main thread. */
export async function renderAvatarOffscreen({
  image,
  crop,
  rotation,
  adjustments,
  size,
}: AvatarRenderRequest): Promise<Blob> {
  // An unknown imageOrientation value throws, which sends older engines to the fallback.
  const bitmap = await createImageBitmap(image, { imageOrientation: "from-image" });
  try {
    const { canvas } = paintAvatar(bitmap, crop, rotation, adjustments, size, (width, height) => {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");
      return context ? { canvas, context } : null;
    });
    return await (canvas as OffscreenCanvas).convertToBlob({ type: "image/jpeg", quality: 0.92 });
  } finally {
    bitmap.close();
  }
}
