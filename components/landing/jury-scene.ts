import * as THREE from "three";

const TRAIL_SIZE = 512;
// Matches `object-[center_40%]`; GL uv has its origin at the bottom.
const OBJECT_POSITION = new THREE.Vector2(0.5, 0.6);

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Ping-pong pass: the pointer paints into a field that slowly spreads and fades.
const trailFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uDecay;
  uniform vec2 uTexel;
  varying vec2 vUv;

  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    float center = texture2D(uPrev, vUv).r;
    float spread = (
      texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r +
      texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r +
      texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r +
      texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r
    ) * 0.25;
    float value = mix(center, spread, 0.2) * uDecay;

    vec2 aspect = vec2(uAspect, 1.0);
    float d = segmentDistance(vUv * aspect, uPrevMouse * aspect, uMouse * aspect);
    value = max(value, uStrength * (1.0 - smoothstep(uRadius * 0.4, uRadius, d)));

    gl_FragColor = vec4(min(value, 1.0), 0.0, 0.0, 1.0);
  }
`;

const revealFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uTop;
  uniform sampler2D uBottom;
  uniform sampler2D uTrail;
  uniform vec4 uTopCover;
  uniform vec4 uBottomCover;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

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

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  vec2 cover(vec2 uv, vec4 c) {
    return uv * c.xy + c.zw;
  }

  float trail(vec2 uv) {
    return texture2D(uTrail, uv).r;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * vec2(uAspect, 1.0);

    // Warp the trail lookup so the reveal edge moves like liquid, not a circle.
    float n = fbm(p * 3.0 + vec2(uTime * 0.15, -uTime * 0.1));
    vec2 warp = (vec2(fbm(p * 4.0 + n + uTime * 0.1), fbm(p * 4.0 - n - uTime * 0.1)) - 0.5) * 0.05;
    vec2 tuv = uv + warp;

    float t = trail(tuv);
    float mask = smoothstep(0.3, 0.52, t + (n - 0.5) * 0.32);
    float edge = mask * (1.0 - mask) * 4.0;
    // Keep the revealed image clean: distortion lives on the rim only.
    float rim = smoothstep(0.0, 0.25, edge);

    vec2 e = vec2(0.008, 0.008 * uAspect);
    vec2 grad = vec2(
      trail(tuv + vec2(e.x, 0.0)) - trail(tuv - vec2(e.x, 0.0)),
      trail(tuv + vec2(0.0, e.y)) - trail(tuv - vec2(0.0, e.y))
    );

    // Ripples travel along the trail's contours as it fades.
    float ripple = sin(t * 26.0 - uTime * 5.0);
    vec2 disp = grad * (0.08 + 0.05 * ripple) * rim;

    vec3 top = texture2D(uTop, cover(uv + disp * 0.6, uTopCover)).rgb;

    vec2 split = (disp * 0.5 + grad * 0.012) * edge;
    vec2 buv = uv - disp;
    vec3 bottom = vec3(
      texture2D(uBottom, cover(buv + split, uBottomCover)).r,
      texture2D(uBottom, cover(buv, uBottomCover)).g,
      texture2D(uBottom, cover(buv - split, uBottomCover)).b
    );

    vec3 color = mix(top, bottom, mask);
    color += edge * (0.07 + 0.06 * ripple);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function waitForImage(img: HTMLImageElement) {
  if (img.complete && img.naturalWidth > 0) return img.decode().catch(() => {});
  return new Promise<void>((resolve, reject) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", reject, { once: true });
  });
}

// srcset images report density-corrected natural sizes, which makes three.js
// allocate a texture smaller than the bitmap. A plain copy of the chosen
// source (served from cache) reports its true dimensions.
export async function loadSource(img: HTMLImageElement) {
  await waitForImage(img);
  const source = new window.Image();
  source.src = img.currentSrc || img.src;
  await source.decode();
  return source;
}

function coverFor(img: HTMLImageElement, width: number, height: number) {
  const containerAspect = width / height;
  const imageAspect = img.naturalWidth / img.naturalHeight;
  const sx = containerAspect > imageAspect ? 1 : containerAspect / imageAspect;
  const sy = containerAspect > imageAspect ? imageAspect / containerAspect : 1;

  return new THREE.Vector4(
    sx,
    sy,
    (1 - sx) * OBJECT_POSITION.x,
    (1 - sy) * OBJECT_POSITION.y,
  );
}

function imageTexture(img: HTMLImageElement) {
  const texture = new THREE.Texture(img);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function startJuryReveal(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  topImg: HTMLImageElement,
  bottomImg: HTMLImageElement,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

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
      uAspect: { value: 1 },
      uRadius: { value: 0.28 },
      uStrength: { value: 0 },
      uDecay: { value: 0.993 },
      uTexel: { value: new THREE.Vector2(1 / TRAIL_SIZE, 1 / TRAIL_SIZE) },
    },
  });
  const trailScene = new THREE.Scene();
  trailScene.add(new THREE.Mesh(geometry, trailMaterial));

  const topTexture = imageTexture(topImg);
  const bottomTexture = imageTexture(bottomImg);
  const revealMaterial = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: revealFragment,
    uniforms: {
      uTop: { value: topTexture },
      uBottom: { value: bottomTexture },
      uTrail: { value: read.texture },
      uTopCover: { value: new THREE.Vector4(1, 1, 0, 0) },
      uBottomCover: { value: new THREE.Vector4(1, 1, 0, 0) },
      uTime: { value: 0 },
      uAspect: { value: 1 },
    },
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, revealMaterial));

  const pointer = new THREE.Vector2(-1, -1);
  const follow = new THREE.Vector2(-1, -1);
  let hovering = false;
  let lastActive = 0;
  let visible = false;
  let frame = 0;
  let lastTime = performance.now();

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    trailMaterial.uniforms.uAspect.value = aspect;
    revealMaterial.uniforms.uAspect.value = aspect;
    revealMaterial.uniforms.uTopCover.value = coverFor(topImg, width, height);
    revealMaterial.uniforms.uBottomCover.value = coverFor(bottomImg, width, height);
    wake();
  };

  const toUv = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      (event.clientX - rect.left) / rect.width,
      1 - (event.clientY - rect.top) / rect.height,
    );
  };

  const onEnter = (event: PointerEvent) => {
    toUv(event);
    follow.copy(pointer);
    hovering = true;
    wake();
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

  const tick = (now: number) => {
    frame = 0;
    const dt = Math.min((now - lastTime) / 1000, 1 / 20);
    lastTime = now;

    const prev = trailMaterial.uniforms.uPrevMouse.value as THREE.Vector2;
    prev.copy(follow);
    follow.lerp(pointer, Math.min(1, dt * 14));
    trailMaterial.uniforms.uMouse.value.copy(follow);
    trailMaterial.uniforms.uStrength.value = hovering ? 1 : 0;
    trailMaterial.uniforms.uDecay.value = Math.pow(0.993, dt * 60);
    trailMaterial.uniforms.uPrev.value = read.texture;

    renderer.setRenderTarget(write);
    renderer.render(trailScene, camera);
    renderer.setRenderTarget(null);
    [read, write] = [write, read];

    revealMaterial.uniforms.uTrail.value = read.texture;
    revealMaterial.uniforms.uTime.value = now / 1000;
    renderer.render(scene, camera);

    if (hovering) lastActive = now;
    // Idle once the trail has faded so the GPU rests.
    if (visible && now - lastActive < 4500) frame = requestAnimationFrame(tick);
  };

  function wake() {
    if (!frame && visible) {
      lastTime = performance.now();
      lastActive = lastTime;
      frame = requestAnimationFrame(tick);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });
  intersectionObserver.observe(container);

  container.addEventListener("pointerenter", onEnter);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);
  container.addEventListener("pointercancel", onLeave);

  resize();
  renderer.render(scene, camera);

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    container.removeEventListener("pointerenter", onEnter);
    container.removeEventListener("pointermove", onMove);
    container.removeEventListener("pointerleave", onLeave);
    container.removeEventListener("pointercancel", onLeave);
    read.dispose();
    write.dispose();
    topTexture.dispose();
    bottomTexture.dispose();
    trailMaterial.dispose();
    revealMaterial.dispose();
    geometry.dispose();
    renderer.dispose();
  };
}
