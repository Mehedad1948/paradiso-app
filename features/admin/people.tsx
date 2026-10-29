"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import { addToast } from "@heroui/toast";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { usePeopleSearch, usePersonPreview, useSaveCandidate } from "@/hooks/queries/useAdminQueries";
import type { AdminPerson } from "@/lib/api/admin";
import { Thumb, imageSrc } from "./shared";

/** UTC `YYYY-MM-DD`, the way the backend names a featured day. */
export const utcDay = (date = new Date()) => date.toISOString().slice(0, 10);
export const addDays = (day: string, days: number) =>
  utcDay(new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000));
export const dayLabel = (day: string, options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

export const BOOST_PRESETS = [0, 1, 2, 3, 5, 10] as const;

const REASONS: Record<string, string> = {
  blocked: "Blocked by an editor",
  no_profile_path: "No photo",
  empty_biography: "No biography",
  too_few_credits: "Too few credits",
  featured_within_hard_gap: "Featured too recently",
};

/** A person's photo, name and what they are known for. */
export function PersonLine({
  person,
  trailing,
}: {
  person: { name: string; profile_path: string | null; knownForDepartment: string | null };
  trailing?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Thumb src={imageSrc(person.profile_path, "w92")} alt="" className="size-11 shrink-0 rounded-full" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{person.name}</span>
        <span className="block truncate text-sm text-muted">{person.knownForDepartment ?? "Unknown department"}</span>
      </span>
      {trailing}
    </span>
  );
}

/** Boost presets plus a block switch. Changes go straight to the server. */
export function EditorialControls({ id, boost, blocked }: { id: number; boost: number; blocked: boolean }) {
  const save = useSaveCandidate({ onError: (error) => addToast({ title: error.message, color: "danger" }) });
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2" role="group" aria-label="Boost">
        <span className="mr-1 text-sm text-muted">Boost</span>
        {BOOST_PRESETS.map((value) => (
          <Button
            key={value}
            size="md"
            className="h-7 min-w-9 px-2"
            variant={boost === value ? "solid" : "flat"}
            color={boost === value ? "primary" : "default"}
            isDisabled={save.isPending}
            onPress={() => save.execute({ tmdbPersonId: id, boost: value })}
          >
            {value === 0 ? "0" : `×${value}`}
          </Button>
        ))}
      </div>
      <Switch
        size="md"
        color="danger"
        isSelected={blocked}
        isDisabled={save.isPending}
        onValueChange={(value) => save.execute({ tmdbPersonId: id, blocked: value })}
      >
        Blocked
      </Switch>
    </div>
  );
}

/** Why the automatic draw would or would not pick this person, and how likely. */
export function PersonPreview({ id }: { id: number }) {
  const query = usePersonPreview(id);
  if (query.isPending) return <Spinner size="sm" className="p-3" aria-label="Loading the preview" />;
  if (query.error || !query.data) return <p className="text-sm text-danger">{query.error?.message ?? "No preview."}</p>;
  const preview = query.data;
  const number = (value: number) => Number(value.toFixed(2));
  return (
    <div className="flex flex-col gap-3 text-sm">
      {preview.reasons.length ? (
        <div className="flex flex-wrap gap-2">
          {preview.reasons.map((reason) => (
            <Chip key={reason} size="sm" color="warning" variant="flat">
              {REASONS[reason] ?? reason}
            </Chip>
          ))}
        </div>
      ) : (
        <Chip size="md" color="success" variant="flat" className="self-start">
          Can be drawn automatically
        </Chip>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        {[
          ["Weight", number(preview.weight)],
          ["Base score", number(preview.baseScore)],
          ["Boost", `×${number(preview.editorialBoost)}`],
          ["Cooldown", `×${number(preview.cooldownFactor)}`],
          ["Credits", preview.signals.creditCount],
          ["In library", preview.signals.libraryCount],
          ["Popularity", number(preview.signals.popularity)],
          ["Last featured", preview.lastFeaturedDate ?? "Never"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <EditorialControls id={id} boost={preview.editorialBoost} blocked={preview.reasons.includes("blocked")} />
    </div>
  );
}

/** Finds a person on TMDb by name; Enter picks the highlighted result. */
export function PersonSearch({
  onSelect,
  selectedId,
  autoFocus = false,
  actions,
}: {
  onSelect?: (person: AdminPerson) => void;
  selectedId?: number | null;
  autoFocus?: boolean;
  /** Extra controls on each result row. */
  actions?: (person: AdminPerson) => ReactNode;
}) {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(0);
  const [debounced] = useDebounce(term, 300);
  const input = useRef<HTMLInputElement>(null);
  const query = usePeopleSearch(debounced, page);
  const people = query.data?.data ?? [];
  const totalPages = Math.min(query.data?.meta.totalPages ?? 1, 500);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        ref={input}
        size="lg"
        value={term}
        onValueChange={(value) => {
          setTerm(value);
          setPage(1);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (!people.length) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, people.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && onSelect) {
            event.preventDefault();
            onSelect(people[Math.min(active, people.length - 1)]);
          }
        }}
        placeholder="Search people by name…"
        aria-label="Person name"
        maxLength={100}
        startContent={<Search size={18} className="text-muted" aria-hidden />}
        endContent={query.isFetching ? <Spinner size="sm" /> : null}
        isClearable
        onClear={() => setTerm("")}
      />
      <ul className="flex max-h-[24rem] flex-col gap-2 overflow-y-auto" aria-label="People">
        {people.map((person, index) => (
          <li
            key={person.id}
            className={`flex items-center gap-2 rounded-lg p-2.5 transition-colors ${
              person.id === selectedId ? "bg-primary/15" : index === active ? "bg-surface" : "hover:bg-surface/60"
            }`}
            onMouseMove={() => setActive(index)}
          >
            <button
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(person)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <PersonLine
                person={person}
                trailing={
                  <span className="flex flex-wrap gap-2">
                    {!person.eligible ? <Chip size="md" color="warning" variant="flat">Not eligible</Chip> : null}
                    {person.blocked ? <Chip size="md" color="danger" variant="flat">Blocked</Chip> : null}
                    {person.boost !== 1 && !person.blocked ? (
                      <Chip size="md" color="primary" variant="flat">×{person.boost}</Chip>
                    ) : null}
                    {person.lastFeaturedDate ? (
                      <Chip size="md" variant="flat">Featured {person.lastFeaturedDate}</Chip>
                    ) : null}
                  </span>
                }
              />
            </button>
            {actions?.(person)}
          </li>
        ))}
      </ul>
      {debounced.trim().length < 2 ? <p className="text-sm text-muted">Type at least two letters.</p> : null}
      {debounced.trim().length >= 2 && !query.isFetching && !people.length && !query.error ? (
        <p className="text-sm text-muted">No one found.</p>
      ) : null}
      {query.error ? <p className="text-sm text-danger">{query.error.message}</p> : null}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted">
          <Button size="md" variant="flat" isDisabled={page <= 1} onPress={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button size="md" variant="flat" isDisabled={page >= totalPages} onPress={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
