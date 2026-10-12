import * as THREE from "three";
import { landingPosters, posters } from "@/config/posters";

/**
 * Invitation backdrop: a projector beam with drifting dust and two film strips
 * whose frames show posters. Everything animates on the GPU from a handful of
 * uniforms (4 draw calls, no per-frame allocations or buffer uploads).
 */
export type CinemaScene = {
  setHighlight(on: boolean): void;
  dispose(): void;
};

const POSTERS = [...landingPosters.map((poster) => poster.image), posters.vertigo, posters.dune, posters.arrival];
const CELL = { width: 256, height: 384 };
const STRIP = { length: 64, width: 3, frame: 1.3, rail: 0.42 };
const BEAM = { origin: new THREE.Vector2(1.08, 1.14), target: new THREE.Vector2(0.22, -0.1) };
const DUST_COUNT = 240;

const colorspace = "#include <colorspace_fragment>";

const stripVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uWave;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float t = uTime * 0.12 + uPhase;
    float twist = sin(p.x * 0.09 + t) * 0.55;
    float across = p.y;
    p.y = across * cos(twist) + sin(p.x * 0.07 + t * 0.8) * 1.4 * uWave;
    p.z = across * sin(twist) + sin(p.x * 0.11 + t * 1.1) * 2.6 * uWave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const stripFragment = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uCells;
  uniform float uPosterMix;
  uniform float uFrames;
  uniform float uOffset;
  uniform vec2 uSize;
  uniform float uRail;
  uniform vec3 uBody;
  uniform vec3 uAccent;
  uniform float uImageAlpha;
  uniform float uOpacity;
  varying vec2 vUv;

  float roundedBox(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  void main() {
    float u = vUv.x * uFrames + uOffset;
    float index = floor(u);
    // Strip-local coordinates in world units; u is continuous so its derivative is safe for AA.
    vec2 w = vec2(fract(u) * uSize.x, vUv.y * uSize.y);
    float px = max(fwidth(u) * uSize.x, fwidth(vUv.y) * uSize.y);

    float rail = min(w.y, uSize.y - w.y);
    float pitch = uSize.x * 0.25;
    vec2 hole = vec2(mod(w.x, pitch) - pitch * 0.5, rail - uRail * 0.5);
    float sprocket = smoothstep(-px, px, roundedBox(hole, vec2(0.075, 0.1), 0.035));

    vec2 window = w - uSize * 0.5;
    vec2 windowHalf = vec2(uSize.x * 0.5 - 0.06, uSize.y * 0.5 - uRail);
    float inWindow = 1.0 - smoothstep(-px, px, roundedBox(window, windowHalf, 0.05));
    vec2 imageUv = window / (windowHalf * 2.0) + 0.5;
    float cell = mod(index, uCells);
    vec3 poster = texture2D(uAtlas, vec2((cell + imageUv.x) / uCells, imageUv.y)).rgb;
    vec3 blank = mix(uBody, uAccent, 0.25 + 0.15 * sin(index * 1.7));
    vec3 color = mix(uBody, mix(blank, poster, uPosterMix), inWindow * uImageAlpha);

    float edges = smoothstep(0.0, px, w.y) * smoothstep(0.0, px, uSize.y - w.y);
    float ends = smoothstep(0.0, 0.14, vUv.x) * smoothstep(0.0, 0.14, 1.0 - vUv.x);
    gl_FragColor = vec4(color, uOpacity * sprocket * edges * ends);
    ${colorspace}
  }
`;

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const beamShared = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uOrigin;
  uniform vec2 uTarget;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float spread(float along) { return 0.05 + along * 0.3; }
`;

const beamFragment = /* glsl */ `
  ${beamShared}
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uFlicker;
  varying vec2 vUv;
  void main() {
    vec2 o = uOrigin * vec2(uAspect, 1.0);
    vec2 dir = normalize(uTarget * vec2(uAspect, 1.0) - o);
    vec2 d = vUv * vec2(uAspect, 1.0) - o;
    float along = max(dot(d, dir), 0.0);
    float across = abs(d.x * dir.y - d.y * dir.x);
    float cone = smoothstep(spread(along), spread(along) * 0.2, across);
    float frame = floor(uTime * 24.0);
    float flicker = 1.0 - uFlicker * hash(vec2(frame, 1.7));
    float grain = 1.0 + (hash(gl_FragCoord.xy + frame) - 0.5) * 0.2 * uFlicker / 0.06;
    gl_FragColor = vec4(uColor, cone * exp(-along * 0.6) * flicker * grain * uAlpha);
    ${colorspace}
  }
`;

const dustVertex = /* glsl */ `
  ${beamShared}
  uniform float uPixel;
  attribute vec4 aSeed;
  varying float vAlpha;
  void main() {
    vec2 o = uOrigin * vec2(uAspect, 1.0);
    vec2 t = uTarget * vec2(uAspect, 1.0);
    vec2 dir = normalize(t - o);
    float cycle = fract(aSeed.x + uTime * 0.01 * (0.4 + aSeed.w));
    float along = cycle * length(t - o) * 1.2;
    float side = aSeed.y * 2.0 - 1.0;
    float drift = sin(uTime * 0.35 + aSeed.z * 6.2831) * 0.012;
    vec2 p = o + dir * along + vec2(-dir.y, dir.x) * (side * spread(along) * 0.75 + drift);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed.w) + aSeed.z * 20.0);
    vAlpha = (1.0 - abs(side)) * exp(-along * 0.5) * twinkle
      * smoothstep(0.0, 0.1, cycle) * smoothstep(1.0, 0.85, cycle);
    gl_Position = vec4(p.x / uAspect * 2.0 - 1.0, p.y * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = (1.2 + aSeed.w * 2.4) * uPixel;
  }
`;

const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(uColor, smoothstep(0.5, 0.1, d) * vAlpha * uAlpha);
    ${colorspace}
  }
`;

function readTheme() {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const dark = root.classList.contains("dark");
  const color = (name: string, fallback: string) => {
    const result = new THREE.Color(fallback);
    const value = css.getPropertyValue(name).trim();
    if (/^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(value))
      result.setStyle(`hsl(${value.split(/\s+/).join(", ")})`);
    return result;
  };
  return {
    dark,
    canvas: color("--heroui-background", dark ? "#151714" : "#eff0f2"),
    ink: color("--heroui-foreground", dark ? "#eff0f2" : "#22262b"),
    accent: color("--heroui-primary-500", dark ? "#a8c0d4" : "#496680"),
  };
}

/** Mix in sRGB so tints match how the CSS colors are perceived. */
function mix(from: THREE.Color, to: THREE.Color, amount: number) {
  return from.clone().convertLinearToSRGB().lerp(to.clone().convertLinearToSRGB(), amount).convertSRGBToLinear();
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number) {
  const scale = Math.max(CELL.width / image.naturalWidth, CELL.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, x + (CELL.width - width) / 2, (CELL.height - height) / 2, width, height);
}

/** Same-origin posters only: a cross-origin image would taint the canvas and break the upload. */
function loadPosterAtlas(urls: string[], onReady: () => void) {
  const canvas = document.createElement("canvas");
  canvas.width = CELL.width * urls.length;
  canvas.height = CELL.height;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  let cancelled = false;
  if (context) {
    context.fillStyle = "#1c1c1c";
    context.fillRect(0, 0, canvas.width, canvas.height);
    void Promise.allSettled(
      urls.map(async (url, index) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (!cancelled) drawCover(context, image, index * CELL.width);
      }),
    ).then((results) => {
      if (cancelled || !results.some((result) => result.status === "fulfilled")) return;
      texture.needsUpdate = true;
      onReady();
    });
  }
  return { texture, cancel: () => (cancelled = true) };
}

export function createCinemaScene(mount: HTMLElement): CinemaScene {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  } catch {
    // No WebGL: the page still works, it just has no backdrop.
    return { setHighlight() {}, dispose() {} };
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio());
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 18);

  const shared = {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uOrigin: { value: BEAM.origin },
    uTarget: { value: BEAM.target },
  };

  const quad = new THREE.PlaneGeometry(2, 2);
  const beamMaterial = new THREE.ShaderMaterial({
    vertexShader: beamVertex,
    fragmentShader: beamFragment,
    uniforms: { ...shared, uColor: { value: new THREE.Color() }, uAlpha: { value: 0 }, uFlicker: { value: 0.06 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(quad, beamMaterial);
  beam.frustumCulled = false;
  beam.renderOrder = 0;
  scene.add(beam);

  const seeds = new Float32Array(DUST_COUNT * 4).map(() => Math.random());
  const dustGeometry = new THREE.BufferGeometry();
  // Positions are computed in the shader; this attribute only sets the draw count.
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST_COUNT * 3), 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  const dustMaterial = new THREE.ShaderMaterial({
    vertexShader: dustVertex,
    fragmentShader: dustFragment,
    uniforms: { ...shared, uPixel: { value: 1 }, uColor: { value: new THREE.Color() }, uAlpha: { value: 0 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  dust.renderOrder = 1;
  scene.add(dust);

  const atlas = loadPosterAtlas(POSTERS, () => {
    posterTarget = 1;
    if (reducedMotion.matches) posterMix = 1;
    requestRender();
  });
  const stripGeometry = new THREE.PlaneGeometry(STRIP.length, STRIP.width, 192, 1);
  const stripConfigs = [
    { position: [1.5, -2.6, -9], tilt: 0.2, phase: 2.1, speed: -0.16, wave: 0.8, opacity: 0.5, order: 2 },
    { position: [0, 1.4, -2], tilt: -0.28, phase: 0, speed: 0.22, wave: 1, opacity: 1, order: 3 },
  ] as const;
  const strips = stripConfigs.map((config) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: stripVertex,
      fragmentShader: stripFragment,
      uniforms: {
        uTime: shared.uTime,
        uPhase: { value: config.phase },
        uWave: { value: config.wave },
        uAtlas: { value: atlas.texture },
        uCells: { value: POSTERS.length },
        uPosterMix: { value: 0 },
        uFrames: { value: STRIP.length / STRIP.frame },
        uOffset: { value: Math.random() * POSTERS.length },
        uSize: { value: new THREE.Vector2(STRIP.frame, STRIP.width) },
        uRail: { value: STRIP.rail },
        uBody: { value: new THREE.Color() },
        uAccent: { value: new THREE.Color() },
        uImageAlpha: { value: 1 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(stripGeometry, material);
    mesh.position.fromArray(config.position);
    mesh.rotation.z = config.tilt;
    mesh.renderOrder = config.order;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { mesh, material, config };
  });

  const applyTheme = () => {
    const { dark, canvas, ink, accent } = readTheme();
    const body = mix(canvas, ink, dark ? 0.14 : 0.9);
    beamMaterial.uniforms.uColor.value.copy(dark ? mix(accent, new THREE.Color("#ffe2b0"), 0.35) : accent);
    beamMaterial.userData.alpha = dark ? 0.24 : 0.2;
    dustMaterial.uniforms.uColor.value.copy(dark ? mix(accent, new THREE.Color(1, 1, 1), 0.55) : accent);
    dustMaterial.uniforms.uAlpha.value = dark ? 0.85 : 0.7;
    strips.forEach(({ material, config }) => {
      material.uniforms.uBody.value.copy(body);
      material.uniforms.uAccent.value.copy(accent);
      material.uniforms.uImageAlpha.value = dark ? 0.62 : 0.85;
      material.uniforms.uOpacity.value = config.opacity * (dark ? 1 : 0.9);
    });
    requestRender();
  };

  const resize = () => {
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    shared.uAspect.value = width / height;
    dustMaterial.uniforms.uPixel.value = renderer.getPixelRatio();
    requestRender();
  };

  const pointer = { x: 0, y: 0 };
  const onPointerMove = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  let highlight = 0;
  let highlightTarget = 0;
  let posterMix = 0;
  let posterTarget = 0;
  let last = performance.now();

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const ease = 1 - Math.exp(-dt * 3);
    highlight += (highlightTarget - highlight) * ease;
    posterMix += (posterTarget - posterMix) * ease;
    shared.uTime.value = now / 1000;
    beamMaterial.uniforms.uAlpha.value = beamMaterial.userData.alpha * (1 + highlight * 0.45);
    strips.forEach(({ material, config }) => {
      material.uniforms.uOffset.value += config.speed * (1 + highlight * 1.5) * dt;
      material.uniforms.uPosterMix.value = posterMix;
    });
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * ease;
    camera.position.y += (pointer.y * 0.5 - camera.position.y) * ease;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };

  // Reduced motion: draw a still frame only when something changes, otherwise run the loop.
  function requestRender() {
    if (!reducedMotion.matches) return;
    beamMaterial.uniforms.uAlpha.value = beamMaterial.userData.alpha;
    strips.forEach(({ material }) => (material.uniforms.uPosterMix.value = posterMix));
    renderer.render(scene, camera);
  }
  const syncMotion = () => {
    beamMaterial.uniforms.uFlicker.value = reducedMotion.matches ? 0 : 0.06;
    last = performance.now();
    renderer.setAnimationLoop(reducedMotion.matches ? null : frame);
    requestRender();
  };

  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  reducedMotion.addEventListener("change", syncMotion);
  applyTheme();
  resize();
  syncMotion();

  return {
    setHighlight(on) {
      highlightTarget = on ? 1 : 0;
    },
    dispose() {
      renderer.setAnimationLoop(null);
      atlas.cancel();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      reducedMotion.removeEventListener("change", syncMotion);
      [quad, dustGeometry, stripGeometry].forEach((geometry) => geometry.dispose());
      [beamMaterial, dustMaterial, ...strips.map(({ material }) => material)].forEach((material) => material.dispose());
      atlas.texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
