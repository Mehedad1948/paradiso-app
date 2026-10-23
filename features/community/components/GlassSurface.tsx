"use client";
/* Trimmed from React Bits' GlassSurface: SVG-filter refraction only (Chromium); other browsers get
   the frosted-glass fallback. The WebGL/backdrop/shape paths were dropped as nothing here needs them. */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Channel = "R" | "G" | "B";

interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: Channel;
  yChannel?: Channel;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  className?: string;
  style?: CSSProperties;
}

const SVG_SHADOW = [
  "0 0 2px 1px light-dark(color-mix(in oklch, black, transparent 85%), color-mix(in oklch, white, transparent 65%)) inset",
  "0 0 10px 4px light-dark(color-mix(in oklch, black, transparent 90%), color-mix(in oklch, white, transparent 85%)) inset",
  "0px 4px 16px rgba(17, 17, 26, 0.05)",
  "0px 8px 24px rgba(17, 17, 26, 0.05)",
].join(", ");

const FALLBACK_SHADOW = [
  "inset 0 1px 0 0 hsl(0 0% 100% / 0.3)",
  "inset 0 -1px 0 0 hsl(0 0% 100% / 0.08)",
  "0 0 2px 1px color-mix(in oklch, white, transparent 72%) inset",
  "0px 4px 16px rgba(17, 17, 26, 0.12)",
].join(", ");

function supportsSVGFilters(filterId: string) {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if ((/Safari/.test(ua) && !/Chrome/.test(ua)) || /Firefox/.test(ua)) return false;
  const div = document.createElement("div");
  div.style.backdropFilter = `url(#${filterId})`;
  return div.style.backdropFilter !== "";
}

export default function GlassSurface({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  className = "",
  style = {},
}: GlassSurfaceProps) {
  const id = useId().replace(/:/g, "-");
  const filterId = `glass-filter-${id}`;
  const redGradId = `red-grad-${id}`;
  const blueGradId = `blue-grad-${id}`;
  const softId = `soft-${id}`;

  const [refractive, setRefractive] = useState(false);
  const [boxSize, setBoxSize] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueRef = useRef<SVGFEDisplacementMapElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => setRefractive(supportsSVGFilters(filterId)), [filterId]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setBoxSize(`${element.offsetWidth}x${element.offsetHeight}`),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || 400;
    const h = rect?.height || 200;
    const edge = Math.min(w, h) * (borderWidth * 0.5);
    const svg = `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/>
          </linearGradient>
          <filter id="${softId}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="${blur}" />
          </filter>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="black"></rect>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" filter="url(#${softId})" />
      </svg>`;
    feImageRef.current?.setAttribute(
      "href",
      `data:image/svg+xml,${encodeURIComponent(svg)}`,
    );
    [
      { ref: redRef, offset: redOffset },
      { ref: greenRef, offset: greenOffset },
      { ref: blueRef, offset: blueOffset },
    ].forEach(({ ref, offset }) => {
      ref.current?.setAttribute("scale", String(distortionScale + offset));
      ref.current?.setAttribute("xChannelSelector", xChannel);
      ref.current?.setAttribute("yChannelSelector", yChannel);
    });
    blurRef.current?.setAttribute("stdDeviation", String(displace));
  }, [
    boxSize,
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
    redGradId,
    blueGradId,
    softId,
  ]);

  const modeStyle: CSSProperties = refractive
    ? {
        background: `light-dark(hsl(0 0% 100% / ${backgroundOpacity}), hsl(0 0% 0% / ${backgroundOpacity}))`,
        backdropFilter: `url(#${filterId}) saturate(${saturation})`,
        boxShadow: SVG_SHADOW,
      }
    : {
        background: `hsl(0 0% 100% / ${0.12 + backgroundOpacity * 0.5})`,
        WebkitBackdropFilter: `blur(12px) saturate(${saturation * 1.4}) brightness(1.04)`,
        backdropFilter: `blur(12px) saturate(${saturation * 1.4}) brightness(1.04)`,
        boxShadow: FALLBACK_SHADOW,
      };

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        ...style,
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: `${borderRadius}px`,
        ...modeStyle,
      }}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redRef} in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
            <feDisplacementMap ref={greenRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
            <feDisplacementMap ref={blueRef} in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={blurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
      <div className="relative z-[1] flex h-full w-full items-center justify-center rounded-[inherit]">
        {children}
      </div>
    </div>
  );
}
