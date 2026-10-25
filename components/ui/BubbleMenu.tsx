"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

export interface BubbleItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Opens in a new tab. Use this or `onSelect`. */
  href?: string;
  onSelect?: () => void;
  /** Extra classes for this bubble, e.g. a brand color on hover. */
  className?: string;
}

const SIZE = 40;
const GAP = 8;
const SPRING = { type: "spring" as const, stiffness: 520, damping: 30, mass: 0.7 };

/**
 * A trigger that fans its items out as circles along an arc around itself.
 * Angles are in degrees, clockwise from 3 o'clock (so 270 is straight up).
 */
export default function BubbleMenu({
  items,
  label,
  children,
  triggerClassName,
  bubbleClassName,
  startAngle = 200,
  endAngle = 340,
  radius = 64,
}: {
  items: BubbleItem[];
  /** Accessible name of the trigger. */
  label: string;
  children: ReactNode | ((open: boolean) => ReactNode);
  triggerClassName?: string;
  bubbleClassName?: string;
  startAngle?: number;
  endAngle?: number;
  /** Minimum distance from the trigger; grows if the bubbles would overlap. */
  radius?: number;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const bubbles = useRef<(HTMLElement | null)[]>([]);
  const menuId = useId();
  const reduce = useReducedMotion();

  const step = items.length > 1 ? (endAngle - startAngle) / (items.length - 1) : 0;
  const stepRad = (Math.abs(step) * Math.PI) / 180;
  // Keep neighbouring bubbles from touching however many items there are.
  const r = stepRad > 0 ? Math.max(radius, (SIZE + GAP) / (2 * Math.sin(stepRad / 2))) : radius;
  const positions = items.map((_, i) => {
    const angle = ((startAngle + step * i) * Math.PI) / 180;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  });

  useEffect(() => {
    if (!open) return;
    bubbles.current[0]?.focus({ preventScroll: true });

    function onPointerDown(event: PointerEvent) {
      if (root.current?.contains(event.target as Node)) return;
      setOpen(false);
      // The click that dismisses the menu shouldn't also act on whatever is underneath.
      const swallow = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
      };
      document.addEventListener("click", swallow, true);
      setTimeout(() => document.removeEventListener("click", swallow, true), 500);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!open) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      return close();
    }
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const current = bubbles.current.indexOf(document.activeElement as HTMLElement);
    const next = (current + keys[event.key] + items.length) % items.length;
    bubbles.current[next]?.focus();
  }

  return (
    <span ref={root} className="relative inline-flex" onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {typeof children === "function" ? children(open) : children}
      </button>

      <AnimatePresence>
        {open && (
          <span id={menuId} role="menu" aria-label={label} className="absolute left-1/2 top-1/2 z-30">
            {items.map((item, i) => {
              const { x, y } = positions[i];
              const className = clsx(
                "absolute inline-flex items-center justify-center rounded-full outline-offset-2",
                bubbleClassName,
                item.className,
              );
              const motionProps = {
                style: { width: SIZE, height: SIZE, left: -SIZE / 2, top: -SIZE / 2 },
                initial: reduce ? { x, y, opacity: 0 } : { x: 0, y: 0, scale: 0.3, opacity: 0 },
                animate: { x, y, scale: 1, opacity: 1, transition: { ...SPRING, delay: i * 0.035 } },
                exit: reduce
                  ? { opacity: 0, transition: { duration: 0.1 } }
                  : {
                      x: 0,
                      y: 0,
                      scale: 0.3,
                      opacity: 0,
                      transition: { duration: 0.16, ease: "easeIn" as const, delay: (items.length - 1 - i) * 0.02 },
                    },
                whileHover: reduce ? undefined : { scale: 1.1 },
                whileTap: { scale: 0.92 },
              };
              const ref = (el: HTMLElement | null) => {
                bubbles.current[i] = el;
              };
              return item.href ? (
                <motion.a
                  key={item.key}
                  ref={ref}
                  role="menuitem"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setOpen(false)}
                  className={className}
                  {...motionProps}
                >
                  {item.icon}
                </motion.a>
              ) : (
                <motion.button
                  key={item.key}
                  ref={ref}
                  type="button"
                  role="menuitem"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => {
                    item.onSelect?.();
                    close();
                  }}
                  className={className}
                  {...motionProps}
                >
                  {item.icon}
                </motion.button>
              );
            })}
          </span>
        )}
      </AnimatePresence>
    </span>
  );
}
