import * as THREE from "three";

/**
 * Landing backdrop: strips of 35 mm negative thread across the screen from
 * edge to edge. Each strip runs along a waving 3D path that twists and swings
 * through slow loops, and the film keeps moving along it. Frames hold posters
 * as true negatives (bright scenes print dense), with punched perforations,
 * edge print, a key-code barcode, grain and the odd emulsion scratch.
 *
 * Paths are evaluated on the CPU each frame so the film can be laid out by
 * true arc length: frames keep their proportions even through a loop.
 */
export type FilmNegativesScene = { dispose(): void };

const FOV = 35;
const CAMERA_Z = 12;
const SEGMENTS = 480;
const ATLAS_CELLS = 4;
const ATLAS_CELL_SIZE = 256;
const EDGE_FRAMES = 16;
const EDGE_CELL = { width: 128, height: 32 };
const MAX_DPR = 1.5;

type Wave = [amplitude: number, frequency: number, speed: number, phase: number];

type Strip = {
  // Film width in world units; the film's own pattern is measured in widths.
  width: number;
  z: number;
  // Vertical placement and rise across the screen, in half-heights.
  y: number;
  slope: number;
  waves: Wave[];
  depth: Wave;
  twist: Wave;
  loop?: { radius: number; span: number; center: number; drift: number; up: 1 | -1 };
  // Film speed along the path in widths per second; reversed strips enter
  // from the right.
  speed: number;
  reverse?: boolean;
  opacity: number;
  seed: number;
};

const STRIPS: Strip[] = [
  {
    width: 1.05,
    z: 2.5,
    y: 0.38,
    slope: -0.55,
    waves: [
      [0.16, 0.6, 0.23, 0],
      [0.05, 1.7, -0.31, 1.3],
    ],
    depth: [0.8, 0.5, 0.17, 0],
    twist: [1.1, 0.8, 0.21, 0.4],
    loop: { radius: 0.9, span: 0.085, center: 0.68, drift: 0.07, up: 1 },
    speed: 0.5,
    opacity: 1,
    seed: 1,
  },
  {
    width: 0.78,
    z: 0,
    y: -0.42,
    slope: 0.5,
    waves: [
      [0.14, 0.9, -0.19, 2],
      [0.05, 2.3, 0.27, 0.5],
    ],
    depth: [1.2, 0.7, 0.13, 1],
    twist: [1.5, 1.1, -0.17, 2.1],
    loop: { radius: 0.7, span: 0.07, center: 0.3, drift: 0.09, up: -1 },
    speed: 0.42,
    reverse: true,
    opacity: 0.9,
    seed: 2,
  },
  {
    width: 0.62,
    z: -4,
    y: 0.72,
    slope: -0.25,
    waves: [
      [0.11, 1.2, 0.15, 4],
      [0.04, 2.8, -0.22, 1],
    ],
    depth: [1.5, 0.4, 0.11, 2],
    twist: [2.2, 0.6, 0.12, 0],
    speed: 0.32,
    opacity: 0.75,
    seed: 3,
  },
  {
    width: 0.56,
    z: -7,
    y: -0.78,
    slope: 0.32,
    waves: [[0.18, 0.7, -0.12, 5]],
    depth: [1.2, 0.6, 0.1, 3],
    twist: [0.9, 1.4, 0.18, 3],
    loop: { radius: 0.85, span: 0.06, center: 0.56, drift: 0.11, up: -1 },
    speed: 0.28,
    reverse: true,
    opacity: 0.6,
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
  uniform sampler2D uPosters;
  uniform sampler2D uEdge;
  uniform vec3 uInk;
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

    // The picture: a negative, so bright scenes print dense. Consecutive
    // frames of a shot repeat with a slight camera drift.
    float frame = floor(a / PITCH);
    vec2 picture = vec2(mod(a, PITCH) - PITCH * 0.5, v - 0.5);
    vec2 pictureHalf = vec2(PICTURE * 0.5, 0.5 - RAIL);
    float inPicture = 1.0 - smoothstep(-aa, aa, roundedBox(picture, pictureHalf, 0.018));
    float shot = floor(frame / 3.0);
    float cell = mod(floor(hash(vec2(shot, uSeed)) * 97.0), ${ATLAS_CELLS * ATLAS_CELLS}.0);
    vec2 imageUv = picture / (pictureHalf * 2.0) + 0.5;
    imageUv = (imageUv - 0.5) * 0.9 + 0.5 + vec2(mod(frame, 3.0) * 0.015 - 0.015, 0.0);
    vec2 atlasUv = (vec2(mod(cell, ${ATLAS_CELLS}.0), floor(cell / ${ATLAS_CELLS}.0)) + imageUv) / ${ATLAS_CELLS}.0;
    float scene = luma(texture2D(uPosters, atlasUv).rgb);
    density = mix(density, 0.16 + scene * 0.72, inPicture);

    // Edge print on one rail, key-code barcode on the other.
    float band = smoothstep(0.103, 0.103 + aa, rail) * (1.0 - smoothstep(0.158 - aa, 0.158, rail));
    if (v > 0.5) {
      vec2 edgeUv = vec2(fract(a / (PITCH * ${EDGE_FRAMES}.0)), (rail - 0.103) / 0.055);
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

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return ctx;
}

function texture(canvas: HTMLCanvasElement) {
  const created = new THREE.CanvasTexture(canvas);
  created.generateMipmaps = true;
  created.minFilter = THREE.LinearMipmapLinearFilter;
  created.anisotropy = 4;
  return created;
}

// Square, centre-cropped poster cells, one per frame subject.
function posterAtlas(images: HTMLImageElement[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ATLAS_CELLS * ATLAS_CELL_SIZE;
  const ctx = context(canvas);
  images.slice(0, ATLAS_CELLS * ATLAS_CELLS).forEach((img, index) => {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) * 0.4,
      side,
      side,
      (index % ATLAS_CELLS) * ATLAS_CELL_SIZE,
      Math.floor(index / ATLAS_CELLS) * ATLAS_CELL_SIZE,
      ATLAS_CELL_SIZE,
      ATLAS_CELL_SIZE,
    );
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

function smootherstep(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function readInk(element: HTMLElement) {
  const [r, g, b] = getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number) ?? [34, 37, 42];
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

export async function createFilmNegativesScene(
  canvas: HTMLCanvasElement,
  posterSources: string[],
): Promise<FilmNegativesScene> {
  const images = await Promise.all(posterSources.map(loadImage));
  const themeSource = canvas.parentElement ?? document.body;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);

  const posters = posterAtlas(images);
  const edge = edgePrint(getComputedStyle(document.body).getPropertyValue("--font-mono") || "monospace");
  const ink = { value: readInk(themeSource) };
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
        uPosters: { value: posters },
        uEdge: { value: edge },
        uInk: ink,
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
  const forward = new THREE.Vector3(0, 0, 1);

  const curl = new Float32Array(SEGMENTS + 1);

  const layOut = (ribbon: (typeof ribbons)[number], time: number) => {
    const { strip, path, positions, normals, along } = ribbon;
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (CAMERA_Z - strip.z);
    const halfWidth = halfHeight * camera.aspect;
    const direction = strip.reverse ? -1 : 1;
    const span = 1.25 * halfWidth;

    for (let i = 0; i <= SEGMENTS; i++) {
      const s = i / SEGMENTS;
      let x = direction * (s * 2 - 1) * span;
      let y = strip.y + strip.slope * (s - 0.5);
      for (const [amplitude, frequency, speed, phase] of strip.waves) {
        y += amplitude * Math.sin(Math.PI * 2 * frequency * s + speed * time + phase);
      }
      y *= halfHeight;
      const [depthAmp, depthFreq, depthSpeed, depthPhase] = strip.depth;
      let z = strip.z + depthAmp * Math.sin(Math.PI * 2 * depthFreq * s + depthSpeed * time + depthPhase);

      // A loop-the-loop: the path doubles back over itself with an eased
      // angle, so it leaves and rejoins the line without a kink. The film
      // rolls onto its edge through the loop, curling like a ribbon instead
      // of lying flat as a disc.
      curl[i] = 0;
      if (strip.loop) {
        const { radius, span: loopSpan, center, drift, up } = strip.loop;
        const middle = center + drift * Math.sin(time * 0.06 + strip.seed);
        const u = (s - (middle - loopSpan)) / (loopSpan * 2);
        if (u > 0 && u < 1) {
          const angle = Math.PI * 2 * smootherstep(u);
          x += direction * radius * Math.sin(angle);
          y += up * radius * (1 - Math.cos(angle));
          z += radius * 0.9 * Math.sin(angle / 2);
          curl[i] = Math.sin(Math.PI * u) ** 2;
        }
      }
      path[i * 3] = x;
      path[i * 3 + 1] = y;
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

      // Width lies in the screen plane, then twists about the tangent.
      const s = i / SEGMENTS;
      const wave = twistAmp * Math.sin(Math.PI * 2 * twistFreq * s + twistSpeed * time + twistPhase);
      const twist = THREE.MathUtils.lerp(wave, Math.PI * 0.42, curl[i]);
      side.crossVectors(tangent, forward).normalize();
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
    camera.position.set(look.x * 0.45, look.y * 0.3 - scrollEased * 0.0022, CAMERA_Z);
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
      posters.dispose();
      edge.dispose();
      renderer.dispose();
    },
  };
}
