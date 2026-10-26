"use client";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  useProfile,
  useSuggestedPeople,
} from "@/hooks/queries/useCommunityQueries";
import type { Viewer } from "../hooks/useViewer";
import { plural, profileHref } from "../format";

const COUNT = 8;

/** A grid of people worth discovering, with the viewer's own profile tucked underneath. */
export default function SuggestedPeople({ viewer }: { viewer: Viewer }) {
  const people = useSuggestedPeople(viewer.me?.id, COUNT);
  const list = people.data ?? [];
  // Nothing to suggest and nothing of the viewer's own to show: stay out of the way.
  if (!viewer.me && (people.isError || (people.isSuccess && !list.length)))
    return null;

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

      {!people.isError && (
        <div className="relative p-5">
          <header className="mb-4">
            <h2
              id="suggested-people-title"
              className="flex items-center gap-2 text-[17px] font-semibold tracking-tight"
            >
              Expand your circle
              <Sparkles size={15} className="text-accent" aria-hidden="true" />
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Fresh voices worth a follow.
            </p>
          </header>

          {people.isSuccess && !list.length ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm leading-relaxed text-muted">
              You&rsquo;re following everyone here.
              <br />
              New faces will show up as people join.
            </p>
          ) : (
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
          )}
        </div>
      )}

      {viewer.me && <MeRow viewer={viewer} divided={!people.isError} />}
    </section>
  );
}

function MeRow({ viewer, divided }: { viewer: Viewer; divided: boolean }) {
  const me = viewer.me!;
  const profile = useProfile(me.id);
  return (
    <Link
      href={profileHref(me.id)}
      className={`group relative flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface/50 ${divided ? "border-t border-line" : ""}`}
    >
      <UserAvatar
        name={viewer.self!.username}
        src={viewer.self!.avatar}
        size={36}
      />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{me.username}</p>
        <p className="truncate text-xs text-muted">
          {profile.data
            ? `${plural(profile.data.followersCount, "follower")} · ${profile.data.followingCount.toLocaleString()} following`
            : " "}
        </p>
      </div>
      <ArrowUpRight
        size={16}
        aria-label="Your profile"
        className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </Link>
  );
}
