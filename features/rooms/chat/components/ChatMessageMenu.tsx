"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { QUICK_REACTIONS } from "./EmojiPicker";

export type MenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  danger?: boolean;
  run: () => void;
};

const EDGE = 8;

/** Native-style context menu at the pointer: quick reactions on top, message actions below. */
export default function ChatMessageMenu({
  x,
  y,
  items,
  onReact,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onReact: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // Keep the menu fully on screen, flipping above/left of the pointer when it would overflow.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    const left = x + w + EDGE > window.innerWidth ? Math.max(EDGE, x - w) : x;
    const top = y + h + EDGE > window.innerHeight ? Math.max(EDGE, y - h) : y;
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    const close = () => onClose();
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Message menu"
      style={pos}
      onContextMenu={(event) => event.preventDefault()}
      className="fixed z-[1000] w-[230px] rounded-xl border border-line bg-elevated p-1.5 text-ink shadow-[0_18px_50px_rgb(0_0_0_/_20%)]"
    >
      <div className="flex items-center justify-between px-1 pb-1.5">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="menuitem"
            aria-label={`React with ${emoji}`}
            className="flex size-8 items-center justify-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-surface"
            onClick={() => {
              onReact(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="border-t border-line pt-1">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            className={clsx(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface",
              item.danger && "text-danger",
            )}
            onClick={() => {
              onClose();
              item.run();
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
