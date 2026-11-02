"use client";
import type { ReactNode } from "react";
import {
  CircleDashedIcon,
  ClockCircleIcon,
  SortFromBottomToTopIcon,
  SortFromTopToBottomIcon,
  SortVerticalIcon,
  UsersGroupTwoRoundedIcon,
} from "@solar-icons/react/linear";
import { RevealToggle } from "./RatingReveal";

function FilterChip({
  active,
  disabled,
  onToggle,
  icon,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50 ${
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-surface text-muted hover:border-ink/30 hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export default function RoomQuickFilters({
  watchedTogether,
  unrated,
  unratedCount,
  showUnrated,
  showReveal,
  addedSort,
  onSortAdded,
  disabled,
  onChange,
}: {
  watchedTogether: boolean;
  unrated: boolean;
  /** Undefined while the summary loads; the chip then shows no count. */
  unratedCount?: number;
  /** Only members have ratings of their own to filter by. */
  showUnrated: boolean;
  /** Offered only while some ratings are masked. */
  showReveal: boolean;
  addedSort: { active: boolean; ascending: boolean };
  onSortAdded: () => void;
  disabled: boolean;
  onChange: (patch: { watchedTogether?: boolean; unrated?: boolean }) => void;
}) {
  const { active, ascending } = addedSort;
  const SortIcon = !active ? SortVerticalIcon : ascending ? SortFromBottomToTopIcon : SortFromTopToBottomIcon;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Filter movies" className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={watchedTogether}
          disabled={disabled}
          onToggle={() => onChange({ watchedTogether: !watchedTogether })}
          icon={<UsersGroupTwoRoundedIcon size={15} aria-hidden="true" />}
        >
          Watched together
        </FilterChip>
        {showUnrated && (
          <FilterChip
            active={unrated}
            disabled={disabled}
            onToggle={() => onChange({ unrated: !unrated })}
            icon={<CircleDashedIcon size={15} aria-hidden="true" />}
          >
            Unrated by me
            {unratedCount !== undefined && (
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  unrated ? "bg-canvas/20" : "bg-ink/10 text-ink"
                }`}
              >
                {unratedCount}
              </span>
            )}
          </FilterChip>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {showReveal && <RevealToggle />}
        <button
          type="button"
          disabled={disabled}
          onClick={onSortAdded}
          aria-label={
            active
              ? `Sorted by date added, ${ascending ? "oldest" : "newest"} first. Press to reverse.`
              : "Sort by date added"
          }
          className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50 ${
            active
              ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
              : "border-line bg-surface text-muted hover:border-ink/30 hover:text-ink"
          }`}
        >
          <ClockCircleIcon size={15} aria-hidden="true" />
          Date added
          {active && <span className="font-medium opacity-80">· {ascending ? "Oldest" : "Newest"}</span>}
          <SortIcon size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
