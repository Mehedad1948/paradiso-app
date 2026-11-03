import * as THREE from "three";
import { onLandingRevealed } from "./landing-ready";

/**
 * Halftone wordmark made of wet ink. Every letter is printed as a dot screen
 * whose dot sizes trace that letter's poster. The pointer is a loupe that
 * bulges the letterforms and swells the dots into the full-colour poster; its
 * motion drags the ink along, and wet ink wobbles and melts into neighbouring
 * letters before it sets again. A click sends a ripple through the word, and
 * on arrival each letter is stamped onto the page in turn.
 */
export type WordmarkLetter = { image: string; position: string };

export type WordmarkScene = {
  pulseAt(clientX: number, clientY: number): void;
  dispose(): void;
};

const TRAIL_SIZE = 256;
const POSTER_ZOOM = 1.15;
const POSTER_Y = 0.45;
const MAX_DRAG = 24;
// Each letter lands over STAMP_DURATION, STAMP_STAGGER after the previous
// one; the colour sweep follows once the word is down.
const STAMP_DURATION = 900;
const STAMP_STAGGER = 90;
const INTRO_PULSE_DELAY = 1500;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Ping-pong pass. r: how wet the ink is; gb: the drag (CSS px) left by the
// pointer, which relaxes faster than the colour so the shapes spring back.
const trailFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform vec2 uVelocity;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uDecay;
  uniform float uDragDecay;
  uniform vec2 uTexel;
  varying vec2 vUv;

  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec4 prev = texture2D(uPrev, vUv);
    vec4 spread = (
      texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)) +
      texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)) +
      texture2D(uPrev, vUv + vec2(0.0, uTexel.y)) +
      texture2D(uPrev, vUv - vec2(0.0, uTexel.y))
    ) * 0.25;
    vec4 relaxed = mix(prev, spread, 0.25);

    vec2 aspect = vec2(uAspect, 1.0);
    float d = segmentDistance(vUv * aspect, uPrevMouse * aspect, uMouse * aspect);
    float paint = uStrength * (1.0 - smoothstep(uRadius * 0.3, uRadius, d));

    float wet = max(relaxed.r * uDecay, paint);
    vec2 drag = mix(relaxed.gb * uDragDecay, uVelocity, paint * 0.35);

    gl_FragColor = vec4(min(wet, 1.0), drag, 1.0);
  }
`;

const halftoneFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMask;
  uniform sampler2D uGoo;
  uniform sampler2D uArt;
  uniform sampler2D uTrail;
  uniform sampler2D uIds;
  uniform vec2 uLetterCenter[LETTERS];
  uniform vec4 uLetterMotion[LETTERS];
  uniform float uLetterIn[LETTERS];
  uniform vec2 uRes;
  uniform float uCell;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uHover;
  uniform float uLens;
  uniform vec2 uPulseOrigin;
  uniform float uPulseAge;
  varying vec2 vUv;

  // A 45 degree screen angle, the classic angle for the black plate.
  const mat2 SCREEN = mat2(0.7071, 0.7071, -0.7071, 0.7071);
  const mat2 SCREEN_INV = mat2(0.7071, -0.7071, 0.7071, 0.7071);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    // All maths runs in CSS pixels (origin bottom-left) so the effect keeps
    // its scale whatever the device pixel ratio.
    vec2 screen = vUv * uRes;
    vec4 trail = texture2D(uTrail, vUv);

    // Entrance: each letter is stamped onto the page with its own offset,
    // scale and turn. Map this pixel back into the layout of whichever letter
    // lands on it, topmost first.
    int letter = -1;
    vec2 px = screen;
    for (int i = LETTERS - 1; i >= 0; i--) {
      vec4 motion = uLetterMotion[i];
      vec2 center = uLetterCenter[i];
      float s = sin(-motion.w);
      float c = cos(-motion.w);
      vec2 q = center + mat2(c, s, -s, c) * (screen - center - motion.xy) / motion.z;
      vec4 ids = texture2D(uIds, q / uRes);
      if (ids.a > 0.5 && abs(ids.r * 255.0 - float(i + 1)) < 0.5) {
        letter = i;
        px = q;
        break;
      }
    }
    if (letter < 0) {
      gl_FragColor = vec4(0.0);
      return;
    }
    float landed = uLetterIn[letter];

    float pulse = 0.0;
    float ripple = 0.0;
    vec2 toPulse = px - uPulseOrigin;
    if (uPulseAge > 0.0) {
      float front = uPulseAge * max(uRes.x, uRes.y) * 0.95;
      float x = length(toPulse) - front;
      float width = uCell * 10.0;
      float fade = 1.0 - smoothstep(1.1, 2.2, uPulseAge);
      float band = x > 0.0 ? exp(-x * x / (width * width)) : exp(x / (width * 2.5));
      pulse = band * fade;
      ripple = sin(x / width * 3.1416) * exp(-x * x / (width * width * 3.0)) * fade;
    }

    // Freshly stamped ink is still wet and sets as the letter lands.
    float settling = 1.0 - smoothstep(0.3, 1.0, landed);
    // Ink melts only right under the pointer and sets again as it moves on,
    // long before the colour fades.
    float near = uHover * (1.0 - smoothstep(0.0, uLens * 0.7, length(px - uPointer)));
    float melt = clamp(max(near * near, max(pulse * 0.6, settling)), 0.0, 1.0);

    // Fluid warp: the pointer drags the ink, wet ink wobbles, pulses ripple.
    vec2 wobble = vec2(
      noise(px * 0.016 + vec2(uTime * 0.7, 0.0)),
      noise(px * 0.016 + vec2(13.7, uTime * 0.7))
    ) - 0.5;
    vec2 wpx = px - trail.gb;
    wpx += wobble * melt * uCell * 1.6;
    wpx -= (length(toPulse) > 0.0 ? normalize(toPulse) : vec2(0.0)) * ripple * uCell * 1.4;

    // Loupe: bulge the letterforms and magnify the dot screen under it.
    vec2 toPointer = wpx - uPointer;
    float d = length(toPointer);
    float lens = uHover * (1.0 - smoothstep(0.0, uLens, d));
    lens = lens * lens * (3.0 - 2.0 * lens);
    vec2 gpx = uPointer + toPointer * (1.0 - 0.12 * lens);
    vec2 spx = uPointer + toPointer * (1.0 - 0.4 * lens);

    // Wet ink is drawn from a blurred copy of the letters with a lowered
    // threshold, so it swells, rounds off and bridges into its neighbours.
    vec4 mask = texture2D(uMask, gpx / uRes);
    vec4 goo = texture2D(uGoo, gpx / uRes);
    float threshold = mix(0.5, 0.42, melt);
    float gooShape = smoothstep(threshold - 0.04, threshold + 0.04, goo.a);
    float shape = max(mask.a, gooShape * smoothstep(0.0, 0.25, melt));
    if (shape < 0.003) {
      gl_FragColor = vec4(0.0);
      return;
    }
    vec3 inkColor = mix(goo.rgb, mask.rgb, step(0.02, mask.a));

    vec2 g = SCREEN * spx / uCell;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 cellUv = SCREEN_INV * ((id + 0.5) * uCell) / uRes;
    vec3 cellArt = texture2D(uArt, cellUv).rgb;
    float h = hash(id);

    // Each dot flips at its own threshold so the colour front sparkles.
    float reveal = clamp(max(trail.r, pulse), 0.0, 1.0);
    float v = smoothstep(h * 0.35, h * 0.35 + 0.6, reveal);

    // The dot screen prints in, dot by dot, while the letter lands.
    float appear = clamp(landed * 1.6 - h * 0.6, 0.0, 1.0);
    appear = 1.0 - pow(1.0 - appear, 3.0);

    // Dots stand for ink: dark ink grows with shadows, light ink with highlights.
    float tone = mix(1.0 - luma(cellArt), luma(cellArt), step(0.5, luma(inkColor)));
    float radius = mix(mix(0.3, 0.62, tone), 0.78, v) * appear;
    float dist = length(f);
    float aa = length(fwidth(g)) * 0.75;
    float ink = 1.0 - smoothstep(radius - aa, radius + aa, dist);

    // Chromatic fringe on the rim of the loupe.
    float rim = lens * (1.0 - lens) * 4.0;
    vec2 dir = d > 0.0 ? toPointer / d : vec2(0.0);
    vec2 shift = dir * rim * 5.0 / uRes;
    vec2 suv = spx / uRes;
    vec3 art = vec3(
      texture2D(uArt, suv + shift).r,
      texture2D(uArt, suv).g,
      texture2D(uArt, suv - shift).b
    );

    // Dots carry their cell's flat colour; once merged they show the poster.
    vec3 dotColor = mix(cellArt, art, smoothstep(0.55, 1.0, v));
    dotColor = clamp(mix(vec3(luma(dotColor)), dotColor, 1.25), 0.0, 1.0);
    vec3 color = mix(inkColor, dotColor, smoothstep(0.0, 0.35, v));
    color += (hash(px + fract(uTime) * 91.0) - 0.5) * 0.07 * v;

    float alpha = ink * shape;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

// Canvas ignores `img.decode()` and decodes again, synchronously, on first
// draw. A bitmap made from the raw bytes is decoded off the main thread and
// draws as a plain blit.
async function loadImage(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Failed to load ${src}`);
  return createImageBitmap(await response.blob());
}

type Pause = () => Promise<void>;
const OVERTAKEN = Symbol("overtaken");

// Hands the main thread back between paint steps so the first paint is a run
// of short tasks rather than one long one.
const yieldToMain: Pause = () => {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return scheduler?.yield
    ? scheduler.yield()
    : new Promise((resolve) => setTimeout(resolve, 0));
};

function canvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return ctx;
}

type Glyph = {
  text: string;
  font: string;
  color: string;
  fontSize: number;
  // The glyph's untransformed box and its button's CSS transform, both in
  // container pixels, so canvas painting matches tilted letters exactly.
  box: DOMRect;
  cell: DOMRect;
  transform: DOMMatrix;
};

function measureGlyph(glyph: HTMLElement): Glyph {
  const button = glyph.parentElement as HTMLElement;
  const buttonStyle = getComputedStyle(button);
  const style = getComputedStyle(glyph);
  const cell = new DOMRect(
    button.offsetLeft,
    button.offsetTop,
    button.offsetWidth,
    button.offsetHeight,
  );
  const [originX, originY] = buttonStyle.transformOrigin.split(" ").map(parseFloat);
  const transform = new DOMMatrix()
    .translate(cell.x + originX, cell.y + originY)
    .multiply(new DOMMatrix(buttonStyle.transform === "none" ? undefined : buttonStyle.transform))
    .translate(-(cell.x + originX), -(cell.y + originY));

  return {
    text: glyph.textContent ?? "",
    font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    color: style.color,
    fontSize: parseFloat(style.fontSize),
    box: new DOMRect(
      cell.x + glyph.offsetLeft,
      cell.y + glyph.offsetTop,
      glyph.offsetWidth,
      glyph.offsetHeight,
    ),
    cell,
    transform,
  };
}

function fillGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph, stroke = 0) {
  ctx.font = glyph.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const metrics = ctx.measureText(glyph.text);
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  const x = glyph.box.x + glyph.box.width / 2;
  const y = glyph.box.y + (glyph.box.height - (ascent + descent)) / 2 + ascent;
  ctx.fillText(glyph.text, x, y);
  if (stroke) {
    ctx.lineWidth = stroke;
    ctx.lineJoin = "round";
    ctx.strokeText(glyph.text, x, y);
  }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  rect: DOMRect,
  originX: number,
  originY: number,
) {
  const scale = Math.max(rect.width / img.width, rect.height / img.height) * POSTER_ZOOM;
  const width = img.width * scale;
  const height = img.height * scale;
  ctx.drawImage(
    img,
    rect.x + (rect.width - width) * originX,
    rect.y + (rect.height - height) * originY,
    width,
    height,
  );
}

export async function createWordmarkScene(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  letters: WordmarkLetter[],
  signal: AbortSignal,
): Promise<WordmarkScene> {
  const glyphElements = Array.from(
    container.querySelectorAll<HTMLElement>("[data-letter-glyph]"),
  );
  const [images] = await Promise.all([
    Promise.all(letters.map((letter) => loadImage(letter.image))),
    document.fonts.ready,
  ]);
  // A canvas has a single WebGL context. If the caller gave up while assets
  // loaded (React runs effects twice in development), stop before a second
  // renderer can share that context with the one that replaces it.
  if (signal.aborted) images.forEach((image) => image.close());
  signal.throwIfAborted();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);

  const targetOptions = {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  };
  let read = new THREE.WebGLRenderTarget(TRAIL_SIZE, TRAIL_SIZE, targetOptions);
  let write = new THREE.WebGLRenderTarget(TRAIL_SIZE, TRAIL_SIZE, targetOptions);
  for (const target of [read, write]) {
    renderer.setRenderTarget(target);
    renderer.clear();
  }
  renderer.setRenderTarget(null);

  const trailMaterial = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: trailFragment,
    uniforms: {
      uPrev: { value: read.texture },
      uMouse: { value: new THREE.Vector2(-1, -1) },
      uPrevMouse: { value: new THREE.Vector2(-1, -1) },
      uVelocity: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uRadius: { value: 0.24 },
      uStrength: { value: 0 },
      uDecay: { value: 0.985 },
      uDragDecay: { value: 0.95 },
      uTexel: { value: new THREE.Vector2(1 / TRAIL_SIZE, 1 / TRAIL_SIZE) },
    },
  });
  const trailScene = new THREE.Scene();
  trailScene.add(new THREE.Mesh(geometry, trailMaterial));

  const maskCanvas = document.createElement("canvas");
  const gooCanvas = document.createElement("canvas");
  const artCanvas = document.createElement("canvas");
  const idCanvas = document.createElement("canvas");
  const scratchCanvas = document.createElement("canvas");
  const layers = [maskCanvas, gooCanvas, artCanvas, idCanvas];
  const createTextures = () => {
    const created = layers.map(canvasTexture);
    // Letter ids must never blend between neighbours.
    created[3].minFilter = created[3].magFilter = THREE.NearestFilter;
    return created;
  };
  let textures = createTextures();

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: halftoneFragment,
    defines: { LETTERS: letters.length },
    uniforms: {
      uMask: { value: textures[0] },
      uGoo: { value: textures[1] },
      uArt: { value: textures[2] },
      uIds: { value: textures[3] },
      uTrail: { value: read.texture },
      uLetterCenter: { value: letters.map(() => new THREE.Vector2()) },
      uLetterMotion: { value: letters.map(() => new THREE.Vector4(0, 0, 1, 0)) },
      uLetterIn: { value: letters.map(() => 0) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uCell: { value: 7 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(-1e4, -1e4) },
      uHover: { value: 0 },
      uLens: { value: 100 },
      uPulseOrigin: { value: new THREE.Vector2() },
      uPulseAge: { value: -1 },
    },
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));

  // The canvas bleeds past the container so tilted, bulging and incoming
  // letters are never clipped; `bleed` offsets layout into canvas space.
  let size = { width: 1, height: 1, dpr: 1, bleed: 0 };
  const toCanvas = (glyph: Glyph) =>
    new DOMMatrix().scale(size.dpr).translate(size.bleed, size.bleed).multiply(glyph.transform);

  // Letters are painted from the live DOM glyphs, so the canvas inherits the
  // real layout, fonts, tilt and theme colours (including the accent "I").
  const paintInk = async (glyphs: Glyph[], pause?: Pause) => {
    const mask = context(maskCanvas);
    mask.setTransform(1, 0, 0, 1, 0, 0);
    mask.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    for (const glyph of glyphs) {
      mask.setTransform(toCanvas(glyph));
      mask.fillStyle = glyph.color;
      fillGlyph(mask, glyph);
    }
    if (pause) await pause();

    const goo = context(gooCanvas);
    goo.setTransform(1, 0, 0, 1, 0, 0);
    goo.clearRect(0, 0, gooCanvas.width, gooCanvas.height);
    goo.filter = `blur(${Math.round(size.height * 0.022 * size.dpr)}px)`;
    goo.drawImage(maskCanvas, 0, 0);
    goo.filter = "none";

    textures[0].needsUpdate = true;
    textures[1].needsUpdate = true;
  };

  // A glyph's footprint in canvas pixels: its box and cell, padded for the
  // fattening stroke and italic overhang, then tilted and clamped.
  const canvasBounds = (glyph: Glyph) => {
    const { box, cell } = glyph;
    const pad = glyph.fontSize * 0.5;
    const left = Math.min(box.left, cell.left) - pad;
    const top = Math.min(box.top, cell.top) - pad;
    const right = Math.max(box.right, cell.right) + pad;
    const bottom = Math.max(box.bottom, cell.bottom) + pad;
    const matrix = toCanvas(glyph);
    const corners = [
      [left, top],
      [right, top],
      [left, bottom],
      [right, bottom],
    ].map(([x, y]) => matrix.transformPoint(new DOMPoint(x, y)));
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    const x = Math.max(0, Math.floor(Math.min(...xs)));
    const y = Math.max(0, Math.floor(Math.min(...ys)));
    return {
      x,
      y,
      width: Math.max(0, Math.min(scratchCanvas.width, Math.ceil(Math.max(...xs))) - x),
      height: Math.max(0, Math.min(scratchCanvas.height, Math.ceil(Math.max(...ys))) - y),
    };
  };

  // Each poster is cut to a fattened copy of its own letter, so overlapping
  // letters keep their own film and melted ink still has art beneath it.
  // `source-in` is unbounded (it touches the whole canvas), so every letter is
  // clipped to its own footprint and only that region is copied across.
  const paintArt = async (glyphs: Glyph[], pause?: Pause) => {
    const art = context(artCanvas);
    const scratch = context(scratchCanvas);
    art.setTransform(1, 0, 0, 1, 0, 0);
    art.clearRect(0, 0, artCanvas.width, artCanvas.height);
    for (let index = 0; index < glyphs.length; index++) {
      const glyph = glyphs[index];
      if (pause) await pause();
      const { x, y, width, height } = canvasBounds(glyph);
      if (!width || !height) continue;
      scratch.save();
      scratch.setTransform(1, 0, 0, 1, 0, 0);
      scratch.globalCompositeOperation = "source-over";
      scratch.clearRect(x, y, width, height);
      scratch.beginPath();
      scratch.rect(x, y, width, height);
      scratch.clip();
      scratch.setTransform(toCanvas(glyph));
      scratch.fillStyle = scratch.strokeStyle = "#000";
      fillGlyph(scratch, glyph, glyph.fontSize * 0.5);
      scratch.globalCompositeOperation = "source-in";
      drawCover(scratch, images[index], glyph.cell, parseFloat(letters[index].position) / 100, POSTER_Y);
      scratch.restore();
      art.drawImage(scratchCanvas, x, y, width, height, x, y, width, height);
    }
    textures[2].needsUpdate = true;
  };

  // Which letter owns each pixel (red = index + 1). Fattened shapes go down
  // first and the true glyphs on top, so every letter keeps its own ink.
  const paintIds = (glyphs: Glyph[]) => {
    const ids = context(idCanvas);
    ids.setTransform(1, 0, 0, 1, 0, 0);
    ids.clearRect(0, 0, idCanvas.width, idCanvas.height);
    for (const stroke of [0.5, 0]) {
      glyphs.forEach((glyph, index) => {
        ids.setTransform(toCanvas(glyph));
        ids.fillStyle = ids.strokeStyle = `rgb(${index + 1}, 0, 0)`;
        fillGlyph(ids, glyph, glyph.fontSize * stroke);
      });
    }
    textures[3].needsUpdate = true;

    const centers = material.uniforms.uLetterCenter.value as THREE.Vector2[];
    glyphs.forEach((glyph, index) => {
      const { box } = glyph;
      const point = glyph.transform.transformPoint(
        new DOMPoint(box.x + box.width / 2, box.y + box.height / 2),
      );
      centers[index].set(point.x + size.bleed, size.height - (point.y + size.bleed));
    });
  };

  const startTime = performance.now();
  const pointer = new THREE.Vector2(-1, -1);
  const follow = new THREE.Vector2(-1, -1);
  const velocity = new THREE.Vector2();
  const introLength = STAMP_STAGGER * (letters.length - 1) + STAMP_DURATION;
  let entranceStart: number | null = null;
  let hovering = false;
  let hover = 0;
  let pulseStart = -1e7;
  let lastActive = startTime;
  let lastTime = startTime;
  let visible = false;
  let painted = false;
  let frame = 0;

  // A stamp: each letter drops in oversized and turned, presses slightly
  // past its mark and settles, while its dots print in.
  const placeLetters = (now: number) => {
    const elapsed = entranceStart === null ? 0 : now - entranceStart;
    const motion = material.uniforms.uLetterMotion.value as THREE.Vector4[];
    const landed = material.uniforms.uLetterIn.value as number[];
    letters.forEach((_, index) => {
      const t = Math.min(Math.max((elapsed - index * STAMP_STAGGER) / STAMP_DURATION, 0), 1);
      const overshoot = 1.7;
      const eased = 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2;
      const rest = 1 - eased;
      const turn = index % 2 ? 0.22 : -0.22;
      motion[index].set(0, rest * size.height * 0.05, 1 + rest * 0.5, rest * turn);
      landed[index] = t;
    });
  };

  const render = (now: number) => {
    const dt = Math.min((now - lastTime) / 1000, 1 / 20);
    lastTime = now;
    hover += ((hovering ? 1 : 0) - hover) * Math.min(1, dt * 8);

    const prev = trailMaterial.uniforms.uPrevMouse.value as THREE.Vector2;
    prev.copy(follow);
    follow.lerp(pointer, Math.min(1, dt * 16));
    // Drag is how far the pointer carried the ink this frame, in CSS px.
    velocity.set((follow.x - prev.x) * size.width, (follow.y - prev.y) * size.height);
    velocity.multiplyScalar(hovering ? 2 : 0).clampLength(0, MAX_DRAG);
    trailMaterial.uniforms.uMouse.value.copy(follow);
    trailMaterial.uniforms.uVelocity.value.copy(velocity);
    trailMaterial.uniforms.uStrength.value = hovering ? 1 : 0;
    trailMaterial.uniforms.uDecay.value = Math.pow(0.985, dt * 60);
    trailMaterial.uniforms.uDragDecay.value = Math.pow(0.95, dt * 60);
    trailMaterial.uniforms.uPrev.value = read.texture;

    renderer.setRenderTarget(write);
    renderer.render(trailScene, camera);
    renderer.setRenderTarget(null);
    [read, write] = [write, read];

    placeLetters(now);
    const uniforms = material.uniforms;
    uniforms.uTrail.value = read.texture;
    uniforms.uTime.value = (now - startTime) / 1000;
    uniforms.uHover.value = hover;
    uniforms.uPointer.value.set(follow.x * size.width, follow.y * size.height);
    uniforms.uPulseAge.value = (now - pulseStart) / 1000;
    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    frame = 0;
    render(now);
    if (hovering) lastActive = now;
    // Rest once the entrance, pulse and wet ink have settled so the GPU idles.
    const busy =
      hovering ||
      hover > 0.01 ||
      now - lastActive < 3500 ||
      now - pulseStart < 2400 ||
      (entranceStart !== null && now - entranceStart < introLength);
    if (visible && busy) frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    lastActive = performance.now();
    if (!frame && visible && painted) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  // With `pause`, every step yields first and the paint gives up once a
  // newer one (a resize mid-way) or disposal has overtaken it. Without it the
  // paint finishes within the current task.
  let paintGeneration = 0;
  const repaint = async (pause?: Pause) => {
    const generation = ++paintGeneration;
    const step =
      pause &&
      (async () => {
        await pause();
        if (generation !== paintGeneration || signal.aborted) throw OVERTAKEN;
      });
    try {
      const glyphs = glyphElements.map(measureGlyph);
      await paintInk(glyphs, step);
      await paintArt(glyphs, step);
      await step?.();
      paintIds(glyphs);
      render(performance.now());
    } catch (error) {
      if (error !== OVERTAKEN) throw error;
    }
  };
  const repaintNow = () => void repaint();

  // The observer's first callback repeats the initial resize; skip it, since
  // a repaint rebuilds every layer and texture.
  let measured = "";
  const resize = async (pause?: Pause) => {
    const { clientWidth, clientHeight } = container;
    if (!clientWidth || !clientHeight) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const key = `${clientWidth}x${clientHeight}@${dpr}`;
    if (key === measured) return;
    measured = key;
    const bleed = Math.round(Math.min(clientHeight * 0.12, 72));
    const width = clientWidth + bleed * 2;
    const height = clientHeight + bleed * 2;
    size = { width, height, dpr, bleed };
    Object.assign(canvas.style, {
      left: `${-bleed}px`,
      top: `${-bleed}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);

    // Canvas textures are allocated once per size, so swap them on resize.
    for (const target of [...layers, scratchCanvas]) {
      target.width = Math.round(width * dpr);
      target.height = Math.round(height * dpr);
    }
    textures.forEach((texture) => texture.dispose());
    textures = createTextures();

    const uniforms = material.uniforms;
    uniforms.uMask.value = textures[0];
    uniforms.uGoo.value = textures[1];
    uniforms.uArt.value = textures[2];
    uniforms.uIds.value = textures[3];
    uniforms.uRes.value.set(width, height);
    uniforms.uCell.value = Math.min(Math.max(clientWidth / 120, 4.5), 9);
    uniforms.uLens.value = clientHeight * 0.24;
    trailMaterial.uniforms.uAspect.value = width / height;
    await repaint(pause);
  };

  const toUv = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      (event.clientX - rect.left) / rect.width,
      1 - (event.clientY - rect.top) / rect.height,
    );
  };

  const onMove = (event: PointerEvent) => {
    toUv(event);
    if (!hovering) {
      follow.copy(pointer);
      hovering = true;
    }
    wake();
  };
  const onLeave = () => {
    hovering = false;
    lastActive = performance.now();
  };
  const onDown = (event: PointerEvent) => {
    pulseAt(event.clientX, event.clientY);
  };

  function pulseAt(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    material.uniforms.uPulseOrigin.value.set(clientX - rect.left, rect.bottom - clientY);
    pulseStart = performance.now();
    wake();
  }

  const resizeObserver = new ResizeObserver(() => void resize());
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });
  intersectionObserver.observe(container);

  // The stamps start once the loading screen has lifted and the wordmark is
  // on screen, so the entrance is never played behind the curtain.
  const beginEntrance = () => {
    if (entranceStart !== null) return;
    entranceStart = performance.now();
    pulseStart = entranceStart + INTRO_PULSE_DELAY;
    // The colour sweep enters from the wordmark's left edge.
    material.uniforms.uPulseOrigin.value.set(size.bleed, size.height * 0.5);
    wake();
  };

  // Theme switches and late font swaps change only how the letters paint.
  // The loading screen also toggles `overflow` on <html>; that is not a theme
  // change, so only repaint when the theme's own markers move.
  const themeKey = () => {
    const root = document.documentElement;
    return `${root.className}|${root.dataset.theme ?? ""}|${root.style.colorScheme}`;
  };
  let theme = themeKey();
  const themeObserver = new MutationObserver(() => {
    const next = themeKey();
    if (next === theme) return;
    theme = next;
    repaintNow();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  document.fonts.addEventListener("loadingdone", repaintNow);

  container.addEventListener("pointerenter", onMove);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);
  container.addEventListener("pointercancel", onLeave);
  container.addEventListener("pointerdown", onDown);

  // The first paint is the heavy one; it runs in short slices so the page
  // stays responsive, and the scene only starts drawing once it is complete.
  await resize(yieldToMain);
  painted = true;
  wake();
  const stopWaitingForReveal = onLandingRevealed(beginEntrance);

  return {
    pulseAt,
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      stopWaitingForReveal();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.fonts.removeEventListener("loadingdone", repaintNow);
      container.removeEventListener("pointerenter", onMove);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointercancel", onLeave);
      container.removeEventListener("pointerdown", onDown);
      read.dispose();
      write.dispose();
      textures.forEach((texture) => texture.dispose());
      trailMaterial.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      images.forEach((image) => image.close());
    },
  };
}
