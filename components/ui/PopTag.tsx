"use client";
import type { ReactNode } from "react";
import { Tooltip } from "@heroui/tooltip";
import clsx from "clsx";

/** A name tag that springs up with a little tilt, alternating side to side. */
export default function PopTag({
  content,
  tilt = 8,
  bare = false,
  multiline = false,
  children,
}: {
  content: ReactNode;
  tilt?: number;
  /** Hand the trigger props straight to a single native child instead of wrapping it in a span. */
  bare?: boolean;
  /** For a sentence rather than a name: wraps inside a rounded card instead of a one-line pill. */
  multiline?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip
      content={content}
      showArrow
      delay={60}
      closeDelay={0}
      offset={10}
      classNames={{
        // Inverse pill on light pages; on dark ones a raised dark chip rather than a white flash.
        base: "before:bg-ink dark:before:bg-surface dark:before:shadow-[1px_1px_0_0_hsl(var(--heroui-divider))]",
        content: clsx(
          "bg-ink text-canvas shadow-lg dark:border dark:border-line dark:bg-surface dark:text-ink dark:shadow-black/50",
          multiline
            ? "max-w-[240px] rounded-2xl px-3.5 py-2 text-center text-[13px] font-medium leading-snug"
            : "rounded-full px-3 py-1.5 text-[13px] font-semibold",
        ),
      }}
      motionProps={{
        variants: {
          exit: {
            opacity: 0,
            scale: 0.5,
            y: 8,
            rotate: tilt,
            transition: { duration: 0.12, ease: "easeIn" },
          },
          enter: {
            opacity: 1,
            scale: 1,
            y: 0,
            rotate: 0,
            transition: { type: "spring", stiffness: 560, damping: 15 },
          },
        },
      }}
    >
      {bare ? (
        (children as React.ReactElement)
      ) : (
        // A plain element takes the trigger's ref and handlers; focus bubbles up to it.
        <span className="block rounded-full">{children}</span>
      )}
    </Tooltip>
  );
}
