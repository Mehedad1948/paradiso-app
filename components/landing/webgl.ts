let hardware: boolean | undefined;

/**
 * Whether WebGL 2 runs on a GPU. Software rendering (no GPU, blocklisted
 * drivers, headless browsers) counts as no: the landing scenes would keep the
 * CPU busy every frame, so they keep their CSS versions instead. Checked
 * before the scenes are imported, so three.js and their images are skipped.
 */
export function hasHardwareWebGL() {
  if (hardware !== undefined) return hardware;
  const gl = document
    .createElement("canvas")
    .getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  hardware = !!gl;
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return hardware;
}
