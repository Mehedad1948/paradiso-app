"use client";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { ClapperboardIcon, CloseIcon } from "@solar-icons/react/linear";

const storageKey = (roomId: string) => `paradiso:unrated-nudge:${roomId}`;
function readDismissed(roomId: string) {
  try {
    const value = Number(localStorage.getItem(storageKey(roomId)));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}
function writeDismissed(roomId: string, count: number) {
  try {
    if (count > 0) localStorage.setItem(storageKey(roomId), String(count));
    else localStorage.removeItem(storageKey(roomId));
  } catch {
    // Storage can be blocked; the banner then simply returns next visit.
  }
}

/**
 * Nudges only for films the group watched together: those were definitely seen,
 * so a missing rating is a gap. Dismissing hides it until the count grows again.
 */
export default function UnratedBanner({
  roomId,
  count,
  onReview,
}: {
  roomId: string;
  count: number;
  onReview: () => void;
}) {
  // null until storage is read, so the banner never flashes in and out.
  const [dismissed, setDismissed] = useState<number | null>(null);
  useEffect(() => {
    setDismissed(readDismissed(roomId));
  }, [roomId]);
  // Rating some lowers the bar, so the next newly marked film shows the banner again.
  useEffect(() => {
    if (dismissed !== null && count < dismissed) {
      writeDismissed(roomId, count);
      setDismissed(count);
    }
  }, [roomId, count, dismissed]);
  if (dismissed === null || count <= dismissed) return null;
  const films = count === 1 ? "1 film" : `${count} films`;
  return (
    <section
      aria-label="Films waiting for your rating"
      className="unrated-banner mb-7 flex items-center gap-4 rounded-[10px] border border-line bg-elevated py-4 pl-5 pr-3 max-sm:flex-wrap"
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"
      >
        <ClapperboardIcon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink [&_em]:font-serif [&_em]:text-[17px] [&_em]:font-normal">
          You watched <em>{films}</em> with the room and haven&apos;t rated{" "}
          {count === 1 ? "it" : "them"} yet.
        </p>
        <p className="mt-0.5 text-sm text-muted">
          Your rating completes the group&apos;s verdict.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 max-sm:w-full max-sm:[&>button:first-child]:flex-1">
        <Button
          size="sm"
          className="min-h-9 rounded-md bg-ink px-4 text-sm font-semibold text-canvas"
          onPress={onReview}
        >
          Rate {count === 1 ? "it" : "them"}
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-muted"
          aria-label="Dismiss until another film is watched together"
          title="Not now"
          onPress={() => {
            writeDismissed(roomId, count);
            setDismissed(count);
          }}
        >
          <CloseIcon size={17} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
