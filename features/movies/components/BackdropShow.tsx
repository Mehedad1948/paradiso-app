"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imageSrc } from "@/features/community/format";
import { useDocumentVisible } from "@/features/rooms/chat/hooks/useDocumentVisible";
import { MorphEngine } from "../lib/morph-engine";

/** How long each still holds before the next one arrives. */
const HOLD_MS = 6500;
/** A drag past this share of the width, or a flick, moves to the neighbor. */
const COMMIT_SHARE = 0.25;
const FLICK_PX_PER_MS = 0.5;
/** Horizontal travel before a press counts as a drag rather than a tap or a scroll. */
const LOCK_PX = 8;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Hero stills are requested with CORS so WebGL may read them. TMDb doesn't vary its responses by
 * Origin, so a copy cached by a plain <img> elsewhere would fail that check; a URL of their own
 * keeps the two apart, and the plain fallback shares it so each still downloads once.
 */
const stillUrl = (path: string) => `${imageSrc(path, "w1280")}?cors=1`;
const wrap = (value: number, count: number) => ((value % count) + count) % count;

function webglAvailable() {
  try {
    return !!document.createElement("canvas").getContext("webgl");
  } catch {
    return false;
  }
}

/** A still with the slow CSS Ken Burns drift, fading in once it has loaded. */
function Still({ path, reverse }: { path: string; reverse?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={stillUrl(path)}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
      crossOrigin="anonymous"
      // A still cached by the browser can finish before hydration, so check on mount as well.
      ref={(image) => {
        if (image?.complete && image.naturalWidth) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      className={clsx(
        "absolute inset-0 h-full w-full select-none object-cover object-[50%_30%] [transform-origin:50%_30%] transition-opacity duration-1000 motion-safe:animate-movie-kenburns",
        reverse && "[animation-direction:reverse]",
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

/** Without WebGL (or with reduced motion): stills dissolve into each other. */
function Crossfade({ slides, index, direction }: { slides: string[]; index: number; direction: 1 | -1 }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false} custom={direction}>
      <motion.div
        key={slides[index]}
        className="absolute inset-0 overflow-hidden"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: `${direction * 3}%` }}
        animate={{ opacity: 1, x: "0%" }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: `${direction * -2}%` }}
        transition={{ opacity: { duration: reduce ? 0.2 : 1.2, ease: "easeInOut" }, x: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } }}
      >
        <Still path={slides[index]} reverse={index % 2 === 1} />
      </motion.div>
    </AnimatePresence>
  );
}

/** A still's own colors, blurred: the wash a framed still feathers into. */
function Ambient({ path }: { path: string }) {
  return (
    <AnimatePresence initial={false}>
      <motion.img
        key={path}
        src={imageSrc(path, "w300") ?? undefined}
        alt=""
        aria-hidden="true"
        draggable={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="absolute inset-0 h-full w-full scale-125 select-none object-cover blur-3xl saturate-125"
      />
    </AnimatePresence>
  );
}

/** Where the stills are drawn: the whole hero, or on the film page's wide screens a frame on the right (see .movie-frame). */
function Frame({ framed, children }: { framed: boolean; children: ReactNode }) {
  return <div className={framed ? "movie-frame" : "absolute inset-0"}>{children}</div>;
}

function Gallery({ slides, title, framed }: { slides: string[]; title: string; framed: boolean }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  // Held only while a finger or mouse drags the stills; hovering doesn't stop the show.
  const [held, setHeld] = useState(false);
  const [moving, setMoving] = useState(false);
  const [inView, setInView] = useState(true);
  // "pending" until we know whether WebGL is usable; the morph only runs once its first still is up.
  const [stage, setStage] = useState<"pending" | "morph" | "fade">("pending");
  const [morphReady, setMorphReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<MorphEngine | null>(null);
  const press = useRef<{ x: number; y: number; at: number; dragging: boolean } | null>(null);
  const visible = useDocumentVisible();
  const reduce = useReducedMotion();

  useEffect(() => setStage(!reduce && webglAvailable() ? "morph" : "fade"), [reduce]);

  // Scrolled past, the clock waits, so the reader comes back to the still they left.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (stage !== "morph" || !host.current) return;
    const created = new MorphEngine(host.current, {
      urls: slides.map(stillUrl),
      onReady: () => setMorphReady(true),
      onLost: () => setStage("fade"),
    });
    engine.current = created;
    return () => {
      created.destroy();
      engine.current = null;
      setMorphReady(false);
    };
  }, [stage, slides]);

  // Stills browsed while the stage was still loading: it takes over from wherever the reader is.
  const latest = useRef(index);
  latest.current = index;
  useEffect(() => {
    if (morphReady && latest.current !== 0) engine.current?.show(latest.current);
  }, [morphReady]);

  const morph = stage === "morph" && morphReady;
  const playing = !reduce && !held && !moving && visible && inView && stage !== "pending";

  async function go(step: 1 | -1) {
    if (moving) return;
    const target = wrap(index + step, count);
    setDirection(step);
    setIndex(target);
    if (!morph || !engine.current) return;
    setMoving(true);
    await engine.current.to(target);
    setMoving(false);
  }

  function keys(event: KeyboardEvent) {
    if (event.key === "ArrowRight") void go(1);
    else if (event.key === "ArrowLeft") void go(-1);
    else return;
    event.preventDefault();
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, [role=group]")) return;
    press.current = { x: event.clientX, y: event.clientY, at: performance.now(), dragging: false };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const start = press.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (!start.dragging) {
      if (Math.abs(dx) < LOCK_PX) return;
      // A mostly vertical gesture is a scroll; let it go.
      if (Math.abs(dx) < Math.abs(event.clientY - start.y)) {
        press.current = null;
        return;
      }
      if (moving) return;
      start.dragging = true;
      setHeld(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is already gone; the drag simply ends on release.
      }
    }
    // The morph follows the finger; the crossfade waits for the release.
    if (morph) engine.current?.drag(dx / event.currentTarget.clientWidth);
  }

  async function up(event: PointerEvent<HTMLDivElement>) {
    const start = press.current;
    press.current = null;
    if (!start?.dragging) return;
    setHeld(false);
    const dx = event.clientX - start.x;
    const speed = Math.abs(dx) / Math.max(performance.now() - start.at, 1);
    const commit = Math.abs(dx) > event.currentTarget.clientWidth * COMMIT_SHARE || speed > FLICK_PX_PER_MS;
    if (!morph || !engine.current) {
      if (commit) void go(dx < 0 ? 1 : -1);
      return;
    }
    setMoving(true);
    const landed = await engine.current.release(commit);
    if (landed !== index) {
      setDirection(dx < 0 ? 1 : -1);
      setIndex(landed);
    }
    setMoving(false);
  }

  return (
    <div
      className={clsx("group/show absolute inset-0 touch-pan-y select-none", "cursor-grab active:cursor-grabbing")}
      ref={root}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        press.current = null;
        setHeld(false);
      }}
    >
      {framed && <Ambient path={slides[index]} />}
      <Frame framed={framed}>
        {/* The plain stills hold the frame until the WebGL stage has its first image (or instead of it). */}
        {(stage !== "morph" || !morphReady) && <Crossfade slides={slides} index={index} direction={direction} />}
        {stage === "morph" && (
          <div
            ref={host}
            aria-hidden="true"
            className={clsx("absolute inset-0 transition-opacity duration-700", morphReady ? "opacity-100" : "opacity-0")}
          />
        )}
      </Frame>

      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-hero-fade from-[8%] via-hero-fade/75 via-[38%] to-transparent"
      />

      {(
        [
          [-1, "left-3 sm:left-4", ChevronLeft, "Previous still", "group-hover/arrow:-translate-x-0.5"],
          [1, "right-3 sm:right-4", ChevronRight, "Next still", "group-hover/arrow:translate-x-0.5"],
        ] as const
      ).map(([step, side, Icon, label, nudge]) => (
        <button
          key={step}
          type="button"
          onClick={() => void go(step)}
          aria-label={label}
          title={label}
          className={clsx(
            "group/arrow absolute top-[38%] z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white/90 ring-1 ring-inset ring-white/15 backdrop-blur-md transition-[opacity,background-color,transform] duration-300 hover:bg-black/40 hover:text-white active:scale-95 sm:size-11",
            // Quiet at rest, clear once the reader reaches for the stills.
            "opacity-70 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/show:opacity-100 focus-visible:opacity-100",
            side,
          )}
        >
          <Icon size={22} strokeWidth={1.5} aria-hidden="true" className={clsx("transition-transform duration-300", nudge)} />
        </button>
      ))}

      {/*
        A title-card counter: current, a hairline that fills while the still holds, total.
        Top centre on phones; on desktop it rests in the hero's lower-right, above the title line, where the image
        has faded into the card, so it takes the theme's ink there.
      */}
      <div
        role="group"
        tabIndex={0}
        aria-label={`${title} stills, ${index + 1} of ${count}. Use the arrow keys to browse.`}
        onKeyDown={keys}
        className="absolute left-1/2 top-[calc(var(--hero-inset,0px)+18px)] z-30 flex -translate-x-1/2 cursor-default items-center gap-2.5 rounded-full px-2 py-1 font-semibold tabular-nums text-white outline-none [text-shadow:0_1px_8px_rgb(0_0_0_/_55%)] focus-visible:ring-2 focus-visible:ring-white/60 sm:top-[calc(var(--hero-inset,0px)+22px)] md:bottom-14 md:left-auto md:right-6 md:top-auto md:translate-x-0 md:text-ink md:[text-shadow:0_0_12px_hsl(var(--hero-fade,var(--heroui-content1)))] md:focus-visible:ring-ink/40"
      >
        <span key={index} aria-hidden="true" className="w-[2ch] text-right text-[13px] tracking-[0.08em] motion-safe:animate-community-rise">
          {pad(index + 1)}
        </span>
        <span aria-hidden="true" className="relative block h-px w-12 overflow-hidden bg-white/35 shadow-[0_1px_6px_rgb(0_0_0_/_40%)] sm:w-16 md:bg-ink/20 md:shadow-none">
          <span
            key={`run-${index}`}
            onAnimationEnd={() => void go(1)}
            // The class, not an inline animation, is what makes Tailwind ship the keyframes.
            className={clsx("absolute inset-0 origin-left bg-white md:bg-ink", reduce ? "scale-x-100" : "scale-x-0 animate-movie-segment")}
            style={reduce ? undefined : { animationDuration: `${HOLD_MS}ms`, animationPlayState: playing ? "running" : "paused" }}
          />
        </span>
        <span aria-hidden="true" className="w-[2ch] text-[13px] tracking-[0.08em] text-white/55 md:text-ink/45">
          {pad(count)}
        </span>
      </div>
    </div>
  );
}

/**
 * The film's stills behind the hero. With several, they morph into each other (WebGL melt,
 * or a dissolve without WebGL), on their own every few seconds, by chevron, keyboard, or by
 * dragging the frame. A single still just drifts.
 */
export default function BackdropShow({
  paths,
  poster,
  title,
  framed = false,
}: {
  /** Backdrop paths, the main one first; duplicates and blanks are ignored. */
  paths: (string | null | undefined)[];
  poster?: string | null;
  title: string;
  /** On wide screens, draw the stills in a frame on the right that feathers into a wash of them. */
  framed?: boolean;
}) {
  const slides = Array.from(new Set(paths.filter((path): path is string => !!path)));
  const key = slides.join("|");
  const [stable, setStable] = useState(slides);
  // Same stills, same array: the WebGL stage is rebuilt only when the list really changes.
  if (stable.join("|") !== key) setStable(slides);
  const wash = imageSrc(poster, "w185");

  return (
    <div className="movie-stage absolute inset-0">
      {/* The poster's own colors, blurred, hold the frame until a still arrives (or when there is none). */}
      {wash && (
        <img
          src={wash}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-80 blur-3xl saturate-150"
        />
      )}
      {stable.length > 1 ? (
        <Gallery key={key} slides={stable} title={title} framed={framed} />
      ) : (
        <>
          {framed && stable[0] && <Ambient path={stable[0]} />}
          {stable[0] && (
            <Frame framed={framed}>
              <Still path={stable[0]} />
            </Frame>
          )}
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-hero-fade from-[8%] via-hero-fade/75 via-[38%] to-transparent"
          />
        </>
      )}
    </div>
  );
}
