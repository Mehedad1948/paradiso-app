"use client";
import { useEffect, useRef, type KeyboardEvent } from "react";
import clsx from "clsx";
import { QuoteIcon } from "@solar-icons/react/linear";
import { MAX_FAVORITE_NOTE_LENGTH } from "@/types/community";

const RING = 2 * Math.PI * 9;

/**
 * Fills as the note grows; the count appears in the last 40 characters
 * and the ring turns red at the limit.
 */
export function NoteCounter({ length }: { length: number }) {
  const left = MAX_FAVORITE_NOTE_LENGTH - length;
  const ratio = Math.min(length / MAX_FAVORITE_NOTE_LENGTH, 1);
  const tone = left <= 0 ? "text-danger" : left <= 40 ? "text-warning" : "text-accent";
  return (
    <span className="inline-flex items-center gap-1.5" aria-live="polite">
      {left <= 40 && (
        <span className={clsx("text-xs font-semibold tabular-nums", tone)}>
          {left}
          <span className="sr-only"> characters left</span>
        </span>
      )}
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="-rotate-90">
        <circle cx="11" cy="11" r="9" fill="none" strokeWidth="2" className="stroke-line" />
        <circle
          cx="11"
          cy="11"
          r="9"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - ratio)}
          className={clsx("transition-[stroke-dashoffset,color] duration-200 ease-out", tone)}
        />
      </svg>
    </span>
  );
}

/**
 * A quiet, self-sizing textarea for a favorite's note. Enter with Cmd/Ctrl submits,
 * Escape cancels; the browser enforces the length cap.
 */
export function NoteInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  title,
  autoFocus,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  /** The film's title, for the label. */
  title: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grows with the text instead of scrolling, up to the CSS max height.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    el?.focus({ preventScroll: true });
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit?.();
    } else if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };

  return (
    <div
      className={clsx(
        "relative rounded-lg border border-line bg-surface/60 transition-[border-color,box-shadow] duration-200 focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/15",
        className,
      )}
    >
      <QuoteIcon
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 fill-current text-accent/50"
      />
      <textarea
        ref={ref}
        rows={2}
        value={value}
        maxLength={MAX_FAVORITE_NOTE_LENGTH}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        aria-label={`Note on ${title}`}
        placeholder="Why does this one stay with you?"
        className="block max-h-56 w-full resize-none bg-transparent py-2.5 pl-8 pr-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted/80 disabled:opacity-60 [&:focus-visible]:outline-none"
      />
    </div>
  );
}

/** A note as it reads on the shelf: an italic pull quote. */
export function NoteQuote({ note, className }: { note: string; className?: string }) {
  return (
    <blockquote className={clsx("relative whitespace-pre-line break-words pl-4 italic", className)}>
      <span aria-hidden="true" className="absolute -left-0.5 -top-1.5 font-serif text-2xl not-italic leading-none text-accent">
        “
      </span>
      {note}
    </blockquote>
  );
}
