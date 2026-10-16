import * as THREE from "three";

/**
 * Landing backdrop: strips of 35 mm film thread across the screen from edge
 * to edge, rolling through slow waves while the film runs along them. Each
 * strip carries one still, repeated frame after frame as a real shot is, with
 * punched perforations, edge print, a key-code barcode, grain and the odd
 * emulsion scratch.
 *
 * The strips bend the way real film does: freely across their face (the
 * depth waves), only very gently within their own plane, and with a slow
 * natural twist. A camera a little above the strips turns the depth waves
 * into soft S-curves on screen. Paths are evaluated on the CPU each frame so
 * the film is laid out by true arc length and frames keep their proportions.
 */
export type FilmNegativesScene = { dispose(): void };

const FOV = 35;
const CAMERA = new THREE.Vector3(0, 2.2, 12);
const SEGMENTS = 360;
// One atlas cell per still, shaped like the 35 mm picture area.
const FRAME_CELL = { width: 288, height: 404 };
const EDGE_FRAMES = 16;
const EDGE_CELL = { width: 128, height: 32 };
const MAX_DPR = 1.5;

type Wave = [amplitude: number, frequency: number, speed: number, phase: number];

type Strip = {
  // Film width in world units; the film's own pattern is measured in widths.
  width: number;
  z: number;
  // Vertical placement and rise across the screen, in half-heights. These
  // in-plane curves stay long and shallow, as film barely bends edgewise.
  y: number;
  slope: number;
  waves: Wave[];
  // Bending across the face, in world units: the main motion.
  depth: Wave[];
  twist: Wave;
  // Film speed along the path in widths per second; reversed strips enter
  // from the right.
  speed: number;
  reverse?: boolean;
  opacity: number;
  seed: number;
};

const STRIPS: Strip[] = [
  {
    width: 1.2,
    z: 1.5,
    y: 0.4,
    slope: -0.5,
    waves: [[0.08, 0.55, 0.16, 0]],
    depth: [
      [2.2, 0.85, 0.22, 0],
      [0.5, 1.9, -0.3, 1.2],
    ],
    twist: [0.35, 0.4, 0.1, 0],
    speed: 0.45,
    opacity: 1,
    seed: 1,
  },
  {
    width: 0.9,
    z: -1.5,
    y: -0.42,
    slope: 0.45,
    waves: [[0.07, 0.7, -0.13, 2]],
    depth: [
      [2.6, 1.05, -0.18, 1],
      [0.4, 2.3, 0.26, 0.4],
    ],
    twist: [0.45, 0.5, -0.08, 2],
    speed: 0.38,
    reverse: true,
    opacity: 0.95,
    seed: 2,
  },
  {
    width: 0.75,
    z: -5,
    y: 0.82,
    slope: -0.2,
    waves: [[0.06, 0.9, 0.1, 4]],
    depth: [[3, 0.8, 0.14, 2]],
    twist: [0.3, 0.35, 0.07, 1],
    speed: 0.3,
    opacity: 0.8,
    seed: 3,
  },
  {
    width: 0.7,
    z: -8,
    y: -0.86,
    slope: 0.3,
    waves: [[0.08, 0.6, -0.09, 5]],
    depth: [[3.2, 1, -0.12, 3]],
    twist: [0.4, 0.45, 0.09, 3],
    speed: 0.26,
    reverse: true,
    opacity: 0.7,
    seed: 4,
  },
];

const vertex = /* glsl */ `
  attribute float aAlong;
  attribute float aAcross;
  varying vec2 vFilm;
  varying float vFacing;
  varying float vDepth;

  void main() {
    vFilm = vec2(aAlong, aAcross);
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vFacing = abs(dot(n, normalize(-view.xyz)));
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uFrames;
  uniform float uFrameIndex;
  uniform float uFrameCount;
  uniform sampler2D uEdge;
  uniform vec3 uInk;
  uniform float uInkIsLight;
  uniform float uOpacity;
  uniform float uFlow;
  uniform float uSeed;
  varying vec2 vFilm;
  varying float vFacing;
  varying float vDepth;

  // 35 mm, 4-perf, in film widths: frame pitch, picture size and rails.
  const float PITCH = 0.56;
  const float PICTURE = 0.47;
  const float RAIL = 0.17;
  const float PERF_PITCH = PITCH / 4.0;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(vec2(i, uSeed)), hash(vec2(i + 1.0, uSeed)), f * f * (3.0 - 2.0 * f));
  }

  float roundedBox(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    float a = vFilm.x - uFlow;
    float v = vFilm.y;
    float aa = max(fwidth(a), fwidth(v)) * 0.8;
    float rail = min(v, 1.0 - v);

    // Unexposed film base: a thin, even density.
    float density = 0.13;

    // The picture: consecutive frames of a shot repeat with a slight
    // camera drift.
    float frame = floor(a / PITCH);
    vec2 picture = vec2(mod(a, PITCH) - PITCH * 0.5, v - 0.5);
    vec2 pictureHalf = vec2(PICTURE * 0.5, 0.5 - RAIL);
    float inPicture = 1.0 - smoothstep(-aa, aa, roundedBox(picture, pictureHalf, 0.018));
    vec2 imageUv = picture / (pictureHalf * 2.0) + 0.5;
    imageUv = (imageUv - 0.5) * 0.9 + 0.5 + vec2(mod(frame, 3.0) * 0.015 - 0.015, 0.0);
    imageUv = clamp(imageUv, 0.0, 1.0);
    vec2 atlasUv = vec2((uFrameIndex + imageUv.x) / uFrameCount, imageUv.y);
    // Picture density follows the ink, so frames read as photographs on
    // either theme: dark ink prints the shadows, light ink the highlights.
    float scene = texture2D(uFrames, atlasUv).r;
    float tone = mix(1.0 - scene, scene, uInkIsLight);
    // Each frame is exposed a touch differently, as on real stock.
    tone *= 1.0 + (hash(vec2(frame, uSeed)) - 0.5) * 0.08;
    density = mix(density, 0.08 + tone * 0.86, inPicture);

    // Edge print on one rail, key-code barcode on the other.
    float band = smoothstep(0.103, 0.103 + aa, rail) * (1.0 - smoothstep(0.158 - aa, 0.158, rail));
    if (v > 0.5) {
      // Canvas textures are flipped vertically, so read the band bottom-up.
      vec2 edgeUv = vec2(fract(a / (PITCH * ${EDGE_FRAMES}.0)), 1.0 - (rail - 0.103) / 0.055);
      density += texture2D(uEdge, edgeUv).a * band * 0.55;
    } else {
      float inFrame = mod(a, PITCH) / PITCH;
      float bars = step(0.5, hash(vec2(floor(a * 95.0), frame)));
      density += bars * band * step(0.08, inFrame) * step(inFrame, 0.42) * 0.45;
    }

    // Grain lives in the emulsion, so it travels with the film.
    density += (hash(floor(vec2(a, v) * 260.0)) - 0.5) * 0.07;

    // A long emulsion scratch that comes and goes along the strip.
    float scratchAt = 0.24 + 0.52 * hash(vec2(uSeed, 7.0));
    float scratch = 1.0 - smoothstep(0.0, aa * 1.5, abs(v - scratchAt));
    density -= scratch * smoothstep(0.55, 0.8, noise(a * 0.35)) * density * 0.8;

    // Perforations are punched clean through.
    vec2 perf = vec2(mod(a, PERF_PITCH) - PERF_PITCH * 0.5, rail - 0.07);
    float hole = 1.0 - smoothstep(-aa, aa, roundedBox(perf, vec2(0.036, 0.026), 0.011));
    density *= 1.0 - hole;

    // Turning edge-on, the film thins out and catches a little light.
    float edges = smoothstep(0.0, aa, v) * smoothstep(0.0, aa, 1.0 - v);
    float shade = mix(0.45, 1.0, vFacing);
    float sheen = pow(1.0 - vFacing, 3.0);
    float fog = 1.0 - smoothstep(9.0, 24.0, vDepth) * 0.55;
    float alpha = clamp(density, 0.0, 1.0) * edges * shade * fog * uOpacity;
    vec3 color = mix(uInk, vec3(1.0), sheen * 0.45);

    gl_FragColor = vec4(color, alpha);
  }
`;

function loadImage(src: string) {
  const img = new window.Image();
  img.decoding = "async";
  img.src = src;
  return img.decode().then(() => img);
}

function context(canvas: HTMLCanvasElement, willReadFrequently = false) {
  const ctx = canvas.getContext("2d", { willReadFrequently });
  if (!ctx) throw new Error("2D canvas unavailable");
  return ctx;
}

// No mipmaps: frames never get small enough to need them, and mip levels
// would bleed neighbouring atlas cells into each other.
function texture(canvas: HTMLCanvasElement) {
  const created = new THREE.CanvasTexture(canvas);
  created.generateMipmaps = false;
  created.minFilter = THREE.LinearFilter;
  return created;
}

// Greyscale cells cropped to the picture's shape, one per still. Each still
// is auto-levelled so dark or flat ones still print a full tonal range.
function frameAtlas(images: HTMLImageElement[]) {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_CELL.width * images.length;
  canvas.height = FRAME_CELL.height;
  const ctx = context(canvas, true);
  const aspect = FRAME_CELL.width / FRAME_CELL.height;
  images.forEach((img, index) => {
    const x = index * FRAME_CELL.width;
    const cropWidth = Math.min(img.naturalWidth, img.naturalHeight * aspect);
    const cropHeight = cropWidth / aspect;
    ctx.drawImage(
      img,
      (img.naturalWidth - cropWidth) / 2,
      (img.naturalHeight - cropHeight) * 0.35,
      cropWidth,
      cropHeight,
      x,
      0,
      FRAME_CELL.width,
      FRAME_CELL.height,
    );

    const cell = ctx.getImageData(x, 0, FRAME_CELL.width, FRAME_CELL.height);
    const { data } = cell;
    const levels = new Float32Array(data.length / 4);
    for (let i = 0; i < levels.length; i++) {
      levels[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    }
    const sorted = Float32Array.from(levels).sort();
    const low = sorted[Math.floor(sorted.length * 0.02)];
    const high = Math.max(sorted[Math.floor(sorted.length * 0.98)], low + 1);
    for (let i = 0; i < levels.length; i++) {
      const value = Math.min(Math.max((levels[i] - low) / (high - low), 0), 1) * 255;
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = value;
    }
    ctx.putImageData(cell, x, 0);
  });
  return texture(canvas);
}

// Latent edge print: a stock code every fourth frame, numbers between.
function edgePrint(font: string) {
  const canvas = document.createElement("canvas");
  canvas.width = EDGE_FRAMES * EDGE_CELL.width;
  canvas.height = EDGE_CELL.height;
  const ctx = context(canvas);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.font = `600 22px ${font}`;
  for (let frame = 0; frame < EDGE_FRAMES; frame++) {
    const x = frame * EDGE_CELL.width + 8;
    const y = EDGE_CELL.height / 2;
    if (frame % 4 === 0) ctx.fillText("PARADISO 5222", x, y);
    else if (frame % 4 !== 1) ctx.fillText(`▸${frame + 1}   ${frame + 1}A`, x, y);
  }
  return texture(canvas);
}

function isLight(color: THREE.Vector3) {
  return 0.299 * color.x + 0.587 * color.y + 0.114 * color.z > 0.5 ? 1 : 0;
}

function readInk(element: HTMLElement) {
  const [r, g, b] = getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number) ?? [34, 37, 42];
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

export async function createFilmNegativesScene(
  canvas: HTMLCanvasElement,
  frameSources: string[],
  signal: AbortSignal,
): Promise<FilmNegativesScene> {
  const images = await Promise.all(frameSources.map(loadImage));
  // A canvas has a single WebGL context. If the caller gave up while assets
  // loaded (React runs effects twice in development), stop before a second
  // renderer can share that context with the one that replaces it.
  signal.throwIfAborted();
  const themeSource = canvas.parentElement ?? document.body;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.copy(CAMERA);

  const frames = frameAtlas(images);
  const edge = edgePrint(getComputedStyle(document.body).getPropertyValue("--font-mono") || "monospace");
  const ink = { value: readInk(themeSource) };
  const inkIsLight = { value: isLight(ink.value) };
  const scene = new THREE.Scene();

  // Each strip is a ribbon of SEGMENTS quads whose vertices are rewritten
  // every frame from its path.
  const ribbons = STRIPS.map((strip, index) => {
    const points = SEGMENTS + 1;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points * 2 * 3);
    const normals = new Float32Array(points * 2 * 3);
    const along = new Float32Array(points * 2);
    const across = new Float32Array(points * 2);
    const indices: number[] = [];
    for (let i = 0; i < points; i++) {
      across[i * 2] = 0;
      across[i * 2 + 1] = 1;
      if (i < SEGMENTS) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const attribute = (array: Float32Array, size: number) => {
      const created = new THREE.BufferAttribute(array, size);
      created.setUsage(THREE.DynamicDrawUsage);
      return created;
    };
    geometry.setAttribute("position", attribute(positions, 3));
    geometry.setAttribute("normal", attribute(normals, 3));
    geometry.setAttribute("aAlong", attribute(along, 1));
    geometry.setAttribute("aAcross", new THREE.BufferAttribute(across, 1));
    geometry.setIndex(indices);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        // Strips take turns with the stills.
        uFrames: { value: frames },
        uFrameIndex: { value: index % images.length },
        uFrameCount: { value: images.length },
        uEdge: { value: edge },
        uInk: ink,
        uInkIsLight: inkIsLight,
        uOpacity: { value: strip.opacity },
        uFlow: { value: 0 },
        uSeed: { value: strip.seed },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Vertices move every frame, so a cached bounding sphere would be stale.
    mesh.frustumCulled = false;
    // Far strips first so the transparent layers blend back to front.
    mesh.renderOrder = index;
    scene.add(mesh);

    return {
      strip,
      mesh,
      geometry,
      material,
      positions,
      normals,
      along,
      path: new Float32Array(points * 3),
      flow: 0,
    };
  });
  ribbons.sort((a, b) => a.strip.z - b.strip.z).forEach((ribbon, order) => {
    ribbon.mesh.renderOrder = order;
  });

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const lift = new THREE.Vector3();
  const width = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const layOut = (ribbon: (typeof ribbons)[number], time: number) => {
    const { strip, path, positions, normals, along } = ribbon;
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (CAMERA.z - strip.z);
    const halfWidth = halfHeight * camera.aspect;
    const direction = strip.reverse ? -1 : 1;
    const span = 1.25 * halfWidth;

    for (let i = 0; i <= SEGMENTS; i++) {
      const s = i / SEGMENTS;
      let y = strip.y + strip.slope * (s - 0.5);
      for (const [amplitude, frequency, speed, phase] of strip.waves) {
        y += amplitude * Math.sin(Math.PI * 2 * frequency * s + speed * time + phase);
      }
      let z = strip.z;
      for (const [amplitude, frequency, speed, phase] of strip.depth) {
        z += amplitude * Math.sin(Math.PI * 2 * frequency * s + speed * time + phase);
      }
      path[i * 3] = direction * (s * 2 - 1) * span;
      path[i * 3 + 1] = y * halfHeight;
      path[i * 3 + 2] = z;
    }

    let length = 0;
    const [twistAmp, twistFreq, twistSpeed, twistPhase] = strip.twist;
    for (let i = 0; i <= SEGMENTS; i++) {
      const prev = Math.max(i - 1, 0);
      const next = Math.min(i + 1, SEGMENTS);
      point.fromArray(path, i * 3);
      tangent.fromArray(path, next * 3).sub(lift.fromArray(path, prev * 3)).normalize();
      if (i > 0) length += point.distanceTo(lift.fromArray(path, (i - 1) * 3));

      // The film's width stays as upright as the path allows, so it bends
      // across its face through the depth waves, then twists slowly about
      // the tangent as a loose strip would.
      const s = i / SEGMENTS;
      const twist = twistAmp * Math.sin(Math.PI * 2 * twistFreq * s + twistSpeed * time + twistPhase);
      side.copy(up).addScaledVector(tangent, -tangent.dot(up)).normalize();
      lift.crossVectors(tangent, side).normalize();
      width.copy(side).multiplyScalar(Math.cos(twist)).addScaledVector(lift, Math.sin(twist));
      normal.crossVectors(tangent, width).normalize();
      width.multiplyScalar(strip.width / 2);

      const a = i * 6;
      positions[a] = point.x - width.x;
      positions[a + 1] = point.y - width.y;
      positions[a + 2] = point.z - width.z;
      positions[a + 3] = point.x + width.x;
      positions[a + 4] = point.y + width.y;
      positions[a + 5] = point.z + width.z;
      normal.toArray(normals, a);
      normal.toArray(normals, a + 3);
      along[i * 2] = along[i * 2 + 1] = length / strip.width;
    }

    const { attributes } = ribbon.geometry;
    attributes.position.needsUpdate = true;
    attributes.normal.needsUpdate = true;
    attributes.aAlong.needsUpdate = true;
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startTime = performance.now();
  const pointer = new THREE.Vector2();
  const look = new THREE.Vector2();
  let scroll = window.scrollY;
  let scrollEased = scroll;
  let rush = 0;
  let lastTime = startTime;
  let frame = 0;

  const render = (now: number) => {
    const dt = Math.min((now - lastTime) / 1000, 1 / 20);
    lastTime = now;
    const time = reducedMotion ? 40 : (now - startTime) / 1000;

    // Scrolling drifts the camera for depth parallax and briefly speeds the
    // film up; the pointer tilts the view a touch.
    const scrolled = window.scrollY;
    rush = Math.min(rush * Math.pow(0.04, dt) + Math.abs(scrolled - scroll) * 0.004, 3);
    scroll = scrolled;
    scrollEased += (scroll - scrollEased) * Math.min(1, dt * 6);
    look.lerp(pointer, Math.min(1, dt * 2));
    camera.position.set(
      CAMERA.x + look.x * 0.45,
      CAMERA.y + look.y * 0.3 - scrollEased * 0.0022,
      CAMERA.z,
    );
    camera.lookAt(0, -scrollEased * 0.0016, 0);

    for (const ribbon of ribbons) {
      ribbon.flow += ribbon.strip.speed * (1 + rush) * dt;
      ribbon.material.uniforms.uFlow.value = reducedMotion ? 0 : ribbon.flow;
      layOut(ribbon, time);
    }
    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    render(now);
    frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    const { innerWidth, innerHeight } = window;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    if (reducedMotion) render(performance.now());
  };

  const onPointer = (event: PointerEvent) => {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      1 - (event.clientY / window.innerHeight) * 2,
    );
  };

  const themeObserver = new MutationObserver(() => {
    ink.value = readInk(themeSource);
    inkIsLight.value = isLight(ink.value);
    if (reducedMotion) render(performance.now());
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });

  window.addEventListener("resize", resize);
  if (!reducedMotion) {
    window.addEventListener("pointermove", onPointer, { passive: true });
    frame = requestAnimationFrame(tick);
  }
  resize();
  render(performance.now());

  return {
    dispose() {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      for (const ribbon of ribbons) {
        ribbon.geometry.dispose();
        ribbon.material.dispose();
      }
      frames.dispose();
      edge.dispose();
      renderer.dispose();
    },
  };
}
