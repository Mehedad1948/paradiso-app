import {
  AVATAR_OUTPUT_SIZE,
  UNREADABLE,
  UNSAVED,
  paintAvatar,
  type Adjustments,
  type Area,
  type AvatarRenderRequest,
  type AvatarRenderResponse,
} from "./avatar-image";

// Kept apart from avatar-image.ts: the worker imports that module, and a module that spawns
// its own worker would make the bundler pull the worker into itself.

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(UNREADABLE));
    image.src = src;
  });
}

async function renderOnMainThread(src: string, crop: Area, rotation: number, adjustments: Adjustments, size: number) {
  const image = await loadImage(src);
  const { canvas } = paintAvatar(image, crop, rotation, adjustments, size, (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    return context ? { canvas, context } : null;
  });
  return new Promise<Blob | null>((resolve) => (canvas as HTMLCanvasElement).toBlob(resolve, "image/jpeg", 0.92));
}

const canUseWorker = () =>
  typeof Worker !== "undefined" &&
  typeof OffscreenCanvas !== "undefined" &&
  typeof createImageBitmap !== "undefined";

/** Resolves with the encoded JPEG, or rejects so the caller can fall back to the main thread. */
function renderInWorker(request: AvatarRenderRequest) {
  return new Promise<Blob>((resolve, reject) => {
    const worker = new Worker(new URL("./avatar-render.worker.ts", import.meta.url), { type: "module" });
    const done = () => worker.terminate();
    worker.onmessage = ({ data }: MessageEvent<AvatarRenderResponse>) => {
      done();
      if (data.ok) resolve(data.blob);
      else reject(new Error(data.message));
    };
    worker.onerror = (event) => {
      event.preventDefault();
      done();
      reject(new Error(event.message || "Worker failed"));
    };
    worker.postMessage(request);
  });
}

/** Crops, rotates, adjusts and encodes a square JPEG, off the main thread where supported. */
export async function renderAvatar(
  src: string,
  crop: Area,
  rotation: number,
  adjustments: Adjustments,
  size = AVATAR_OUTPUT_SIZE,
): Promise<File> {
  let blob: Blob | null = null;
  if (canUseWorker()) {
    try {
      const image = await fetch(src).then((response) => response.blob());
      blob = await renderInWorker({ image, crop, rotation, adjustments, size });
    } catch {
      blob = null; // Any worker-side gap (codec, OffscreenCanvas 2D, options) → main thread.
    }
  }
  blob ??= await renderOnMainThread(src, crop, rotation, adjustments, size);
  if (!blob) throw new Error(UNSAVED);
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
