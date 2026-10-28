import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import { animate, type AnimationPlaybackControls } from "framer-motion";

/**
 * A small WebGL stage for the film stills: a "melt" morph between two images (noise-warped
 * dissolve with a brief RGB split), plus a slow Ken Burns zoom on the still at rest.
 * Adapted from React Bits' MorphSlider, trimmed to one transition and tuned to stay light: the
 * noise only runs mid-transition, idle frames render at ~30fps, and nothing renders off screen.
 */

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;

uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform vec2 uResolution;
uniform vec2 uFromSize;
uniform vec2 uToSize;
uniform float uFromZoom;
uniform float uToZoom;
uniform float uProgress;
uniform float uTime;

varying vec2 vUv;

const float PI = 3.14159265359;
const float INTENSITY = 0.5;
const float SCALE = 2.4;
const float ABERRATION = 0.25;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// object-fit: cover, then the Ken Burns zoom around the centre.
vec2 cover(vec2 uv, vec2 res, vec2 img, float zoom) {
  float ratio = (res.x / max(res.y, 1.0)) / max(img.x / max(img.y, 1.0), 0.0001);
  vec2 s = ratio > 1.0 ? vec2(1.0, 1.0 / ratio) : vec2(ratio, 1.0);
  return (uv - 0.5) * s * zoom + 0.5;
}

void main() {
  vec2 uv = vUv;
  float p = clamp(uProgress, 0.0, 1.0);

  // At rest only the current still is sampled; the noise is skipped entirely.
  if (p <= 0.0) {
    gl_FragColor = vec4(texture2D(tFrom, cover(uv, uResolution, uFromSize, uFromZoom)).rgb, 1.0);
    return;
  }

  float env = sin(p * PI);
  float nn = fbm(uv * SCALE + uTime * 0.03);
  float warp = fbm(uv * SCALE * 1.7 - uTime * 0.02);
  vec2 g = vec2(nn, warp) - 0.5;
  vec2 uvFrom = uv + g * INTENSITY * 0.5 * p;
  vec2 uvTo = uv - g * INTENSITY * 0.5 * (1.0 - p);
  float m = smoothstep(nn - 0.15, nn + 0.15, p);

  vec2 sF = cover(uvFrom, uResolution, uFromSize, uFromZoom);
  vec2 sT = cover(uvTo, uResolution, uToSize, uToZoom);
  float ca = ABERRATION * env * 0.03;

  vec3 from = vec3(texture2D(tFrom, sF + vec2(ca, 0.0)).r, texture2D(tFrom, sF).g, texture2D(tFrom, sF - vec2(ca, 0.0)).b);
  vec3 to = vec3(texture2D(tTo, sT + vec2(ca, 0.0)).r, texture2D(tTo, sT).g, texture2D(tTo, sT - vec2(ca, 0.0)).b);
  gl_FragColor = vec4(mix(from, to, m), 1.0);
}
`;

/** Ken Burns: each still eases from one zoom to another over this long, alternating direction. */
const DRIFT_MS = 22_000;
const ZOOM_WIDE = 0.98;
const ZOOM_CLOSE = 0.89;
/** "power2.inOut", the curve the original morph uses. */
const EASE = [0.45, 0, 0.55, 1] as const;

type Loaded = { texture: Texture; size: [number, number] };

export type MorphStageOptions = {
  urls: string[];
  /** Called once the first still is on screen, so the canvas can fade in. */
  onReady: () => void;
  /** WebGL went away (context lost); the caller should fall back to plain images. */
  onLost: () => void;
};

export class MorphEngine {
  private renderer: Renderer;
  private gl: Renderer["gl"];
  private program: Program;
  private mesh: Mesh;
  private canvas: HTMLCanvasElement;
  private observer: ResizeObserver;
  private intersection: IntersectionObserver;
  private urls: string[];
  private textures = new Map<string, Promise<Loaded | null>>();
  private loaded = new Map<string, Loaded>();
  private current = 0;
  private shownAt = 0;
  private raf = 0;
  private frame = 0;
  private inView = true;
  private busy = false;
  private tween: AnimationPlaybackControls | null = null;
  private dragTarget: number | null = null;
  private destroyed = false;
  private readyCalled = false;
  private onReady: () => void;
  private onLost: () => void;

  constructor(private container: HTMLElement, options: MorphStageOptions) {
    this.urls = options.urls;
    this.onReady = options.onReady;
    this.onLost = options.onLost;
    this.renderer = new Renderer({
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.canvas = this.gl.canvas as HTMLCanvasElement;
    this.canvas.style.cssText = "display:block;width:100%;height:100%";
    container.appendChild(this.canvas);

    const blank = new Texture(this.gl, { image: new Uint8Array([0, 0, 0, 0]), width: 1, height: 1, generateMipmaps: false });
    this.program = new Program(this.gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        tFrom: { value: blank },
        tTo: { value: blank },
        uResolution: { value: [1, 1] },
        uFromSize: { value: [1, 1] },
        uToSize: { value: [1, 1] },
        uFromZoom: { value: ZOOM_WIDE },
        uToZoom: { value: ZOOM_WIDE },
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
    });
    this.mesh = new Mesh(this.gl, { geometry: new Triangle(this.gl), program: this.program });

    this.canvas.addEventListener("webglcontextlost", this.lost, false);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
      this.wake();
    });
    this.intersection.observe(container);
    document.addEventListener("visibilitychange", this.wake);
    this.resize();
    this.show(0);
  }

  /** Puts a still on screen without a transition (first paint, or a new film). */
  show(index: number) {
    this.current = index;
    void this.load(index).then((still) => {
      if (!still || this.destroyed || this.current !== index || this.busy) return;
      this.useFrom(index, still);
      this.program.uniforms.uProgress.value = 0;
      if (!this.readyCalled) {
        this.readyCalled = true;
        this.onReady();
      }
      this.warmNeighbours(index);
    });
    this.wake();
  }

  /** Morphs to `index`. Resolves when the new still has settled. */
  async to(index: number) {
    if (this.destroyed || index === this.current || this.busy) return;
    this.busy = true;
    const still = await this.load(index);
    if (!still || this.destroyed) {
      this.busy = false;
      return;
    }
    this.useTo(index, still);
    await this.run(1, 1.1);
    this.commit(index);
  }

  /** Dragging: `share` is the horizontal drag as a fraction of the width (negative = towards next). */
  drag(share: number) {
    if (this.destroyed || (this.busy && this.dragTarget === null)) return;
    const target = this.wrap(this.current + (share < 0 ? 1 : -1));
    const still = this.loaded.get(this.urls[target]);
    if (!still) {
      void this.load(target);
      return;
    }
    this.busy = true;
    if (target !== this.dragTarget) {
      this.dragTarget = target;
      this.useTo(target, still);
    }
    this.program.uniforms.uProgress.value = Math.min(Math.abs(share) * 1.6, 1);
    this.wake();
  }

  /** Lets go of a drag. Resolves with the index now on screen. */
  async release(commit: boolean) {
    const target = this.dragTarget;
    this.dragTarget = null;
    if (target === null) return this.current;
    if (commit) {
      await this.run(1, 0.5);
      this.commit(target);
    } else {
      await this.run(0, 0.45);
      this.busy = false;
    }
    return this.current;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.tween?.stop();
    this.observer.disconnect();
    this.intersection.disconnect();
    document.removeEventListener("visibilitychange", this.wake);
    this.canvas.removeEventListener("webglcontextlost", this.lost);
    this.loaded.forEach(({ texture }) => texture.texture && this.gl.deleteTexture(texture.texture));
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.canvas.remove();
  }

  private run(to: 0 | 1, seconds: number) {
    this.tween?.stop();
    const uniform = this.program.uniforms.uProgress;
    this.wake();
    return new Promise<void>((resolve) => {
      this.tween = animate(uniform.value as number, to, {
        duration: seconds,
        ease: EASE,
        onUpdate: (value) => (uniform.value = value),
        onComplete: () => resolve(),
      });
    });
  }

  private commit(index: number) {
    const still = this.loaded.get(this.urls[index])!;
    this.current = index;
    // The incoming still was shown at its starting zoom, so its drift picks up from there.
    this.useFrom(index, still);
    this.program.uniforms.uProgress.value = 0;
    this.busy = false;
    this.tween = null;
    this.warmNeighbours(index);
  }

  private useFrom(index: number, still: Loaded) {
    this.program.uniforms.tFrom.value = still.texture;
    this.program.uniforms.uFromSize.value = still.size;
    this.program.uniforms.uFromZoom.value = this.zoom(index, 0);
    this.shownAt = performance.now();
  }

  private useTo(index: number, still: Loaded) {
    this.program.uniforms.tTo.value = still.texture;
    this.program.uniforms.uToSize.value = still.size;
    this.program.uniforms.uToZoom.value = this.zoom(index, 0);
  }

  /** The Ken Burns zoom for still `index`, `elapsed` ms after it appeared. */
  private zoom(index: number, elapsed: number) {
    const t = Math.min(elapsed / DRIFT_MS, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const [from, to] = index % 2 ? [ZOOM_WIDE, ZOOM_CLOSE] : [ZOOM_CLOSE, ZOOM_WIDE];
    return from + (to - from) * eased;
  }

  private warmNeighbours(index: number) {
    if (this.urls.length < 2) return;
    void this.load(this.wrap(index + 1));
    void this.load(this.wrap(index - 1));
  }

  private wrap(index: number) {
    const n = this.urls.length;
    return ((index % n) + n) % n;
  }

  private load(index: number) {
    const url = this.urls[index];
    let pending = this.textures.get(url);
    if (!pending) {
      pending = new Promise<Loaded | null>((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => {
          if (this.destroyed) return resolve(null);
          const texture = new Texture(this.gl, { image, generateMipmaps: false });
          const still: Loaded = { texture, size: [image.naturalWidth || 1, image.naturalHeight || 1] };
          this.loaded.set(url, still);
          resolve(still);
        };
        image.onerror = () => resolve(null);
        image.src = url;
      });
      this.textures.set(url, pending);
    }
    return pending;
  }

  private resize() {
    const { width, height } = this.container.getBoundingClientRect();
    this.renderer.setSize(Math.max(width, 1), Math.max(height, 1));
    this.program.uniforms.uResolution.value = [this.gl.canvas.width, this.gl.canvas.height];
    this.wake();
  }

  private lost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(this.raf);
    this.onLost();
  };

  /** Starts the render loop if it should be running and isn't. */
  private wake = () => {
    if (this.destroyed || this.raf) return;
    this.raf = requestAnimationFrame(this.loop);
  };

  private loop = (now: number) => {
    this.raf = 0;
    if (this.destroyed || !this.inView || document.visibilityState !== "visible") return;
    const moving = (this.program.uniforms.uProgress.value as number) > 0;
    // At rest the drift is slow enough that every other frame is plenty.
    if (moving || this.frame++ % 2 === 0) {
      this.program.uniforms.uTime.value = now * 0.001;
      this.program.uniforms.uFromZoom.value = this.zoom(this.current, now - this.shownAt);
      this.renderer.render({ scene: this.mesh });
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}
