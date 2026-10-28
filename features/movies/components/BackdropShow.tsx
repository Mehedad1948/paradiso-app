"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imageSrc } from "@/features/community/format";
import { useDocumentVisible } from "@/features/rooms/chat/hooks/useDocumentVisible";

/** How long each still holds before the next one fades in. */
const HOLD_MS = 6500;
const SWIPE_PX = 40;

/**
 * The film's stills as a slow slideshow behind the hero: each one drifts (Ken Burns, alternating
 * in and out) and dissolves into the next. A glass pill of story-style segments tracks the
 * position; hovering pauses, arrows, swipes and the keyboard step through.
 */
export default function BackdropShow({
  paths,
  poster,
  title,
}: {
  /** Backdrop paths, the main one first; duplicates and blanks are ignored. */
  paths: (string | null | undefined)[];
  poster?: string | null;
  title: string;
}) {
  const key = paths.join("|");
  // Keyed by content, not array identity, so a re-render doesn't restart the preloading.
  const slides = useMemo(() => Array.from(new Set(paths.filter((path): path is string => !!path))), [key]);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const visible = useDocumentVisible();
  const reduce = useReducedMotion();
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const current = slides[Math.min(index, count - 1)];
  const src = current ? imageSrc(current, "w1280") : null;
  const wash = imageSrc(poster, "w185");
  const gallery = count > 1;
  // The clock only runs once the still on screen has actually arrived.
  const playing = gallery && !reduce && !hovered && visible && !!current && loaded.has(current);

  const go = (step: 1 | -1) => {
    setDirection(step);
    setIndex((value) => (value + step + count) % count);
  };
  const jump = (to: number) => {
    if (to === index) return;
    setDirection(to > index ? 1 : -1);
    setIndex(to);
  };

  // Fetch the next still ahead of time so the dissolve never waits on the network.
  useEffect(() => {
    if (!gallery) return;
    const next = imageSrc(slides[(index + 1) % count], "w1280");
    if (next) new Image().src = next;
  }, [gallery, index, count, slides]);

  const markLoaded = (path: string) =>
    setLoaded((set) => (set.has(path) ? set : new Set(set).add(path)));

  function keys(event: KeyboardEvent) {
    if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
    else return;
    event.preventDefault();
  }

  function down(event: PointerEvent) {
    if (event.pointerType === "mouse" || (event.target as HTMLElement).closest("button")) return;
    swipe.current = { x: event.clientX, y: event.clientY };
  }
  function up(event: PointerEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || !gallery) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - start.y)) go(dx < 0 ? 1 : -1);
  }

  return (
    <div
      // Vertical drags still scroll the sheet; horizontal ones are ours to swipe.
      className="group/show absolute inset-0 touch-pan-y"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => (swipe.current = null)}
    >
      {/* The poster's own colors, blurred, hold the frame until a still arrives (or when there is none). */}
      {wash && (
        <img
          src={wash}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-80 blur-3xl saturate-150"
        />
      )}

      <AnimatePresence initial={false} custom={direction}>
        {current && src && (
          <motion.div
            key={current}
            custom={direction}
            className="absolute inset-0 overflow-hidden"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: `${direction * 3}%` }}
            animate={{ opacity: current && loaded.has(current) ? 1 : 0, x: "0%" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: `${direction * -2}%` }}
            transition={{ opacity: { duration: reduce ? 0.2 : 1.2, ease: "easeInOut" }, x: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } }}
          >
            <img
              src={src}
              alt=""
              aria-hidden="true"
              decoding="async"
              // A still cached by the browser can finish before hydration, so check on mount as well.
              ref={(image) => {
                if (image?.complete && image.naturalWidth) markLoaded(current);
              }}
              onLoad={() => markLoaded(current)}
              className={clsx(
                "h-full w-full object-cover motion-safe:animate-movie-kenburns",
                // Alternate the drift so consecutive stills don't all push the same way.
                index % 2 === 1 && "[animation-direction:reverse]",
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-elevated from-[8%] via-elevated/75 via-[38%] to-transparent"
      />

      {gallery && (
        <>
          {(
            [
              [-1, "left-3 sm:left-4", ChevronLeft, "Previous still"],
              [1, "right-3 sm:right-4", ChevronRight, "Next still"],
            ] as const
          ).map(([step, side, Icon, label]) => (
            <button
              key={step}
              type="button"
              onClick={() => go(step)}
              aria-label={label}
              title={label}
              className={clsx(
                "absolute top-[34%] z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition-[opacity,transform,background-color] duration-300 hover:scale-105 hover:bg-black/50 focus-visible:opacity-100 md:flex",
                "opacity-0 group-hover/show:opacity-100",
                step === -1 ? "group-hover/show:translate-x-0 -translate-x-1" : "group-hover/show:translate-x-0 translate-x-1",
                side,
              )}
            >
              <Icon size={20} aria-hidden="true" />
            </button>
          ))}

          {/* Story-style segments: one per still, the current one filling while it holds. */}
          <div
            role="group"
            aria-label={`${title} stills`}
            onKeyDown={keys}
            className="absolute left-1/2 top-3 z-30 flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/30 px-3.5 ring-1 ring-inset ring-white/15 backdrop-blur-md sm:top-4"
          >
            {slides.map((path, at) => (
              <button
                key={path}
                type="button"
                onClick={() => jump(at)}
                aria-label={`Still ${at + 1} of ${count}`}
                aria-current={at === index || undefined}
                className="group/seg flex h-6 items-center"
              >
                <span
                  className={clsx(
                    "relative block h-[3px] overflow-hidden rounded-full bg-white/30 transition-[width,background-color] duration-500 group-hover/seg:bg-white/50",
                    at === index ? "w-7 sm:w-9" : "w-3 sm:w-4",
                  )}
                >
                  <span
                    key={at === index ? `run-${index}` : "idle"}
                    onAnimationEnd={at === index ? () => go(1) : undefined}
                    className={clsx(
                      "absolute inset-0 origin-left rounded-full bg-white",
                      at < index || (at === index && reduce) ? "scale-x-100" : at === index ? "" : "scale-x-0",
                    )}
                    style={
                      at === index && !reduce
                        ? {
                            animation: `movie-segment ${HOLD_MS}ms linear forwards`,
                            animationPlayState: playing ? "running" : "paused",
                          }
                        : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
