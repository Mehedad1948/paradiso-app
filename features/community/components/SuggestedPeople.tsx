"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { ArrowRightUpIcon, MagnifierIcon, StarsMinimalisticIcon } from "@solar-icons/react/linear";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  useSuggestedPeople,
  useUserSearch,
} from "@/hooks/queries/useCommunityQueries";
import type { Viewer } from "../hooks/useViewer";
import { plural, profileHref } from "../format";
import FollowButton from "./FollowButton";

const COUNT = 8;

/** People worth discovering, a search for anyone by name, and the viewer's own profile underneath. */
export default function SuggestedPeople({ viewer }: { viewer: Viewer }) {
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query.trim(), 300);
  const searching = !!query.trim();

  return (
    <section
      aria-labelledby="suggested-people-title"
      className="relative overflow-hidden rounded-[14px] border border-line bg-elevated"
    >
      {/* A faint wash of accent in the corner gives the card a little light. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative p-5">
        <header className="mb-4">
          <h2
            id="suggested-people-title"
            className="flex items-center gap-2 text-[17px] font-semibold tracking-tight"
          >
            Expand your circle
            <StarsMinimalisticIcon size={15} className="text-accent" aria-hidden="true" />
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Fresh voices worth a follow.
          </p>
        </header>

        <Input
          type="text"
          aria-label="Search people by username"
          placeholder="Search people"
          value={query}
          onValueChange={setQuery}
          onClear={() => setQuery("")}
          onKeyDown={(event) => event.key === "Escape" && setQuery("")}
          isClearable
          autoComplete="off"
          spellCheck="false"
          maxLength={50}
          startContent={
            <MagnifierIcon size={16} className="shrink-0 text-default-400" aria-hidden="true" />
          }
          classNames={{
            base: "mb-4",
            inputWrapper:
              "h-10 min-h-10 rounded-full border border-line bg-surface/70 shadow-none transition-colors group-data-[focus=true]:border-accent/60 data-[hover=true]:bg-surface",
            input: "text-sm placeholder:text-muted",
          }}
        />

        {searching ? (
          <SearchResults viewer={viewer} term={debounced} typing={debounced !== query.trim()} />
        ) : (
          <Suggestions viewer={viewer} />
        )}
      </div>

      {viewer.me && <MeRow viewer={viewer} />}
    </section>
  );
}

function Suggestions({ viewer }: { viewer: Viewer }) {
  const people = useSuggestedPeople(viewer.me?.id, COUNT);
  const list = people.data ?? [];
  // The search above still works, so a failed suggestion list just steps aside.
  if (people.isError) return null;

  if (people.isSuccess && !list.length)
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm leading-relaxed text-muted">
        You&rsquo;re following everyone here.
        <br />
        Search above to find someone by name.
      </p>
    );

  return (
    <ul className="grid grid-cols-4 gap-x-2 gap-y-4">
      {people.isPending
        ? Array.from({ length: COUNT }, (_, index) => (
            <li
              key={index}
              className="flex flex-col items-center gap-2"
              aria-hidden="true"
            >
              <span
                className="h-[52px] w-[52px] animate-pulse rounded-full bg-surface"
                style={{ animationDelay: `${index * 80}ms` }}
              />
              <span className="h-2.5 w-10 animate-pulse rounded-full bg-surface" />
            </li>
          ))
        : list.map((user, index) => (
            <li
              key={user.id}
              className="motion-safe:animate-community-rise"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <Link
                href={profileHref(user.id)}
                title={user.username}
                className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="rounded-full p-[2px] ring-1 ring-line transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_22px_-8px_hsl(var(--heroui-primary-500)_/_0.55)] group-hover:ring-2 group-hover:ring-accent/70 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                  <UserAvatar
                    name={user.username}
                    src={user.avatar}
                    size={48}
                  />
                </span>
                <span className="w-full truncate text-center text-xs font-medium text-muted transition-colors group-hover:text-ink">
                  {user.username}
                </span>
              </Link>
            </li>
          ))}
    </ul>
  );
}

function SearchResults({
  viewer,
  term,
  typing,
}: {
  viewer: Viewer;
  term: string;
  /** The input is ahead of `term`; results on screen are about to change. */
  typing: boolean;
}) {
  const search = useUserSearch(viewer.me?.id, term);
  const list = useMemo(
    () => search.data?.pages.flatMap((page) => page.data) ?? [],
    [search.data],
  );
  const stale = typing || search.isPlaceholderData;

  // Nothing fetched yet for any term: hold the space with a few quiet rows.
  if (!search.data && !search.isError)
    return (
      <ul aria-hidden="true" className="flex flex-col gap-1">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 px-2 py-2">
            <span
              className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface"
              style={{ animationDelay: `${index * 80}ms` }}
            />
            <span
              className="h-3 animate-pulse rounded-full bg-surface"
              style={{ width: `${45 - index * 10}%`, animationDelay: `${index * 80}ms` }}
            />
          </li>
        ))}
      </ul>
    );

  if (search.isError && !list.length)
    return (
      <div role="alert" className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
        <p>Search isn&rsquo;t available right now.</p>
        <button
          type="button"
          onClick={() => search.refetch()}
          className="mt-1.5 font-semibold text-accent hover:underline"
        >
          Try again
        </button>
      </div>
    );

  return (
    <div
      aria-busy={stale}
      className={`transition-opacity duration-200 ${stale ? "opacity-60" : ""}`}
    >
      <p role="status" className="sr-only">
        {stale ? "" : list.length ? `${list.length}${search.hasNextPage ? "+" : ""} people found` : "No one found"}
      </p>
      {!list.length ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm leading-relaxed text-muted">
          No one goes by &ldquo;<span className="font-medium text-ink">{term}</span>&rdquo;.
          <br />
          Check the spelling or try fewer letters.
        </p>
      ) : (
        <ul className="-mx-2 flex max-h-[340px] flex-col overflow-y-auto overscroll-contain">
          {list.map((user, index) => (
            <li
              key={user.id}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface/60 motion-safe:animate-community-rise"
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              <Link
                href={profileHref(user.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <UserAvatar name={user.username} src={user.avatar} size={36} />
                <span className="truncate text-sm text-muted">
                  <Highlight text={user.username} term={term} />
                </span>
              </Link>
              <FollowButton userId={user.id} viewer={viewer} size="xs" />
            </li>
          ))}
          {search.hasNextPage && (
            <li className="flex justify-center pt-1">
              <button
                type="button"
                disabled={search.isFetchingNextPage}
                onClick={() => search.fetchNextPage()}
                className="flex min-h-[34px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
              >
                {search.isFetchingNextPage && <Spinner size="sm" color="current" />}
                {search.isError ? "Try again" : "Show more"}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Bolds the first case-insensitive occurrence of `term`, so it's clear why a name matched. */
function Highlight({ text, term }: { text: string; term: string }) {
  const at = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (at < 0) return <span className="font-semibold text-ink">{text}</span>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-ink">
        {text.slice(at, at + term.length)}
      </mark>
      {text.slice(at + term.length)}
    </>
  );
}

function MeRow({ viewer }: { viewer: Viewer }) {
  const me = viewer.me!;
  const { followersCount, followingCount } = me.stats;
  return (
    <Link
      href={profileHref(me.id)}
      className="group relative flex items-center gap-3 border-t border-line px-5 py-3.5 transition-colors hover:bg-surface/50"
    >
      <UserAvatar
        name={viewer.self!.username}
        src={viewer.self!.avatar}
        size={36}
      />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{me.username}</p>
        <p className="truncate text-xs text-muted">
          {`${plural(followersCount, "follower")} · ${followingCount.toLocaleString()} following`}
        </p>
      </div>
      <ArrowRightUpIcon
        size={16}
        aria-label="Your profile"
        className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </Link>
  );
}
