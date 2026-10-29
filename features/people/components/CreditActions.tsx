"use client";
import { memo, useMemo, useSyncExternalStore, type CSSProperties } from "react";
import clsx from "clsx";
import { BookmarkCheckIcon, BookmarkPlusIcon, CloseIcon, MenuDotsVerticalIcon, Pen2Icon, UsersGroupRoundedIcon } from "@solar-icons/react/linear";
import BubbleMenu, { type BubbleItem } from "@/components/ui/BubbleMenu";
import type { PersonCredit } from "@/types/people";

export type CreditAction = "watchlist" | "post" | "room";

const ACTIONS = [
  { key: "watchlist", label: "Add to watchlist", Icon: BookmarkPlusIcon },
  { key: "post", label: "Make a post", Icon: Pen2Icon },
  { key: "room", label: "Add to room", Icon: UsersGroupRoundedIcon },
] as const;

/** The watchlist action turns into a confirmation once the film is saved. */
function present(action: (typeof ACTIONS)[number], saved: boolean) {
  const done = action.key === "watchlist" && saved;
  return { done, label: done ? "On your watchlist" : action.label, Icon: done ? BookmarkCheckIcon : action.Icon };
}

/** Narrow screens and touch devices have no hover, so the actions move behind a ⋮ menu. */
const COMPACT = "(max-width: 639px), (hover: none)";

function subscribe(listener: () => void) {
  const query = window.matchMedia(COMPACT);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** One subscription for the whole filmography, passed down, rather than one per card. */
export const useCompactActions = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(COMPACT).matches,
    () => false,
  );

/** The dialogs the actions open are fetched on first intent, not with the page. */
let warmed = false;
export function warmCreditDialogs() {
  if (warmed) return;
  warmed = true;
  void import("@/features/community/components/PostComposer");
  void import("./AddToRoomDialog");
}

const glass =
  "flex size-8 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-inset ring-white/20 transition-[background-color,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-black/75 active:scale-90 motion-reduce:transition-none";

/**
 * What can be done with a filmography film without opening it: save it, post about it, add it to a
 * room. On a pointer device the actions rise over the poster's foot one after another on hover or
 * focus (CSS only, so a hover re-renders nothing); on a phone they fan out of a ⋮ menu.
 * Lives beside the card's link, over the poster, because a button can't sit inside a link.
 */
function CreditActions({
  credit,
  compact,
  saved,
  busy,
  onAction,
}: {
  credit: PersonCredit;
  compact: boolean;
  saved: boolean;
  busy: boolean;
  onAction: (action: CreditAction, credit: PersonCredit) => void;
}) {
  const items = useMemo<BubbleItem[]>(
    () =>
      compact
        ? ACTIONS.map((action) => {
            const { done, label, Icon } = present(action, saved);
            return {
              key: action.key,
              label,
              icon: <Icon size={18} aria-hidden="true" />,
              onSelect: () => !done && onAction(action.key, credit),
              className: done ? "text-accent" : undefined,
            };
          })
        : [],
    [compact, saved, onAction, credit],
  );

  // Laid over the poster only, so the hit area never reaches the title below it.
  const overlay = "pointer-events-none absolute inset-x-0 top-0 aspect-[2/3]";

  if (compact) {
    return (
      <div className={overlay}>
        <div className={clsx("pointer-events-auto absolute bottom-1.5 right-1.5", busy && "invisible")}>
          <BubbleMenu
            label={`Actions for ${credit.title}`}
            items={items}
            triggerClassName={glass}
            bubbleClassName="bg-elevated text-ink shadow-[0_2px_4px_rgb(0_0_0_/_5%),0_10px_24px_-8px_rgb(0_0_0_/_25%)] transition-colors dark:bg-surface"
            // Anchored at the poster's bottom-right corner, so the bubbles fan up and to the left.
            startAngle={180}
            endAngle={270}
            radius={58}
          >
            {(open) => (open ? <CloseIcon size={16} aria-hidden="true" /> : <MenuDotsVerticalIcon size={17} aria-hidden="true" />)}
          </BubbleMenu>
        </div>
      </div>
    );
  }

  const shown = "group-hover/credit:opacity-100 group-focus-within/credit:opacity-100";
  return (
    <div
      className={clsx(
        overlay,
        // Rides along with the poster's lift on hover.
        "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/credit:-translate-y-1 motion-reduce:transition-none",
        busy && "invisible",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 motion-reduce:transition-none",
          shown,
        )}
      />
      <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
        {ACTIONS.map((action, index) => {
          const { done, label, Icon } = present(action, saved);
          return (
            <button
              key={action.key}
              type="button"
              title={label}
              aria-label={label}
              aria-disabled={done || undefined}
              onClick={() => !done && onAction(action.key, credit)}
              style={{ "--i": index } as CSSProperties}
              className={clsx(
                glass,
                "pointer-events-none translate-y-2 scale-90 opacity-0 outline-none focus-visible:ring-2 focus-visible:ring-white",
                "group-hover/credit:pointer-events-auto group-focus-within/credit:pointer-events-auto",
                "group-hover/credit:translate-y-0 group-focus-within/credit:translate-y-0 group-hover/credit:scale-100 group-focus-within/credit:scale-100",
                shown,
                // The delay only applies on the way in, so the strip leaves together.
                "group-hover/credit:[transition-delay:calc(var(--i)_*_55ms)] group-focus-within/credit:[transition-delay:calc(var(--i)_*_55ms)]",
                done && "text-accent",
              )}
            >
              <Icon size={16} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(CreditActions);
