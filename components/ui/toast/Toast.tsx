"use client";

import { memo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { CheckCircleIcon, CloseIcon, DangerCircleIcon, DangerTriangleIcon, InfoCircleIcon } from "@solar-icons/react/bold";
import { dismissToast, type ToastColor, type ToastItem } from "./store";
import styles from "./toast.module.css";

const ICONS = {
  default: InfoCircleIcon,
  primary: InfoCircleIcon,
  success: CheckCircleIcon,
  warning: DangerTriangleIcon,
  danger: DangerCircleIcon,
} satisfies Record<ToastColor, unknown>;

const SWIPE_DISTANCE = 40;
/** px/ms: a quick flick dismisses however short it was. */
const FLICK = 0.11;
const DEAD_ZONE = 3;
const RESIST_PX = 24;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
/** A gentle overshoot for the return after an abandoned swipe. */
const SETTLE = "cubic-bezier(0.34, 1.45, 0.64, 1)";

type Sample = [time: number, y: number];
interface Drag {
  pointerId: number;
  startY: number;
  moved: boolean;
  history: Sample[];
}

const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
const lift = (y: number) => `translate3d(0, ${y}px, 0)`;

function velocityOf(history: Sample[]) {
  if (history.length < 2) return 0;
  const [t0, y0] = history[0];
  const [t1, y1] = history[history.length - 1];
  return performance.now() - t1 > 100 ? 0 : (y1 - y0) / Math.max(1, t1 - t0);
}

/**
 * One toast. The drag writes straight to the DOM and the fuse is a CSS animation, so nothing here
 * re-renders while a toast is on screen; memo keeps its siblings still when the stack changes.
 */
const Toast = memo(function Toast({ item }: { item: ToastItem }) {
  const { id, color, timeout, closing } = item;
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const Icon = ICONS[color];

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || drag.current || closing || (event.target as Element).closest("button")) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    drag.current = { pointerId: event.pointerId, startY: event.clientY, moved: false, history: [[performance.now(), 0]] };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const raw = event.clientY - gesture.startY;
    if (!gesture.moved) {
      if (Math.abs(raw) < DEAD_ZONE) return;
      gesture.moved = true;
      rootRef.current?.setAttribute("data-dragging", "");
    }
    // Following the finger down is free; pulling up meets resistance.
    const y = raw >= 0 ? raw : rubberband(raw, RESIST_PX);
    event.currentTarget.style.transform = lift(y);
    gesture.history.push([performance.now(), y]);
    if (gesture.history.length > 4) gesture.history.shift();
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    const card = cardRef.current;
    if (!gesture || !card || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    rootRef.current?.removeAttribute("data-dragging");
    try {
      card.releasePointerCapture(event.pointerId);
    } catch {}
    if (!gesture.moved) return;

    const y = gesture.history[gesture.history.length - 1][1];
    const velocity = velocityOf(gesture.history);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (event.type !== "pointercancel" && y > 0 && (velocity > FLICK || y >= SWIPE_DISTANCE)) {
      dismissToast(id, "swipe");
      card.animate(
        [
          { transform: lift(y), opacity: 1 },
          { transform: reduce ? lift(y) : lift(y + card.offsetHeight + 24), opacity: 0 },
        ],
        { duration: 220, easing: EASE_OUT, fill: "forwards" },
      );
      return;
    }
    card.style.transform = "";
    card.animate([{ transform: lift(y) }, { transform: lift(0) }], {
      duration: reduce ? 160 : 480,
      easing: reduce ? EASE_OUT : SETTLE,
    });
  };

  return (
    <div className={styles.slot} data-state={closing ? "closing" : "open"} data-exit={closing ?? "default"}>
      <div className={styles.slotInner}>
        <div
          ref={rootRef}
          className={styles.enter}
          data-tone={color}
          style={{ "--toast-ms": `${timeout}ms` } as CSSProperties}
        >
          <div
            ref={cardRef}
            className={styles.card}
            role={color === "danger" || color === "warning" ? "alert" : "status"}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.stopPropagation();
              dismissToast(id);
            }}
          >
            <span className={styles.chip} aria-hidden="true">
              <Icon size={16} />
            </span>
            <div className={styles.body}>
              <span className={styles.title}>{item.title}</span>
              {item.description ? <span className={styles.description}>{item.description}</span> : null}
            </div>
            {item.actionLabel ? (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  item.onAction?.();
                  dismissToast(id);
                }}
              >
                {item.actionLabel}
              </button>
            ) : null}
            {timeout > 0 ? (
              // A new `rev` remounts the fuse, which restarts the countdown for a repeated message.
              <i
                key={item.rev}
                className={styles.fuse}
                aria-hidden="true"
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget) dismissToast(id);
                }}
              />
            ) : null}
          </div>
          <button
            type="button"
            className={styles.close}
            data-persistent={timeout === 0 ? "" : undefined}
            aria-label="Dismiss notification"
            onClick={() => dismissToast(id)}
          >
            <CloseIcon size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default Toast;
