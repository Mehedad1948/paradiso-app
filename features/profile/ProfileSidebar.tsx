"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/button";
import { AltArrowRightIcon, BookmarkIcon, HeartIcon, KeyMinimalisticIcon, Logout2Icon, SettingsIcon, ShieldIcon, UserRoundedIcon } from "@solar-icons/react/linear";
import type { Icon as SolarIcon } from "@solar-icons/react/lib/types";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { authApi } from "@/lib/api/auth";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import UserAvatar from "@/components/ui/UserAvatar";
import { profileHref } from "@/features/community/format";
import MoviePoster from "@/features/rooms/components/MoviePoster";
import { MAX_FAVORITE_MOVIES } from "@/types/community";
import type { CurrentUser } from "@/types/user";
import { invitePolicyOptions } from "./components/InvitePolicyPicker";
import { settingsHref } from "./sections";

const SHOWN_GENRES = 3;

/** The first favorite posters (from `/me`), fanned out; they spread apart when the row is hovered. */
function PosterFan({ posters }: { posters: (string | null)[] }) {
  return (
    <span className="flex shrink-0 items-center pr-1" aria-hidden="true">
      {posters.map((path, index, shown) => (
        <span
          // Posters can repeat as null, and the list only ever changes as a whole.
          key={index}
          style={{ zIndex: shown.length - index, rotate: `${(index - (shown.length - 1) / 2) * 5}deg` }}
          className="-ml-2.5 block overflow-hidden rounded-md bg-surface shadow-md ring-2 ring-elevated transition-[margin,transform] duration-300 ease-out first:ml-0 group-hover:-ml-1 group-hover:first:ml-0"
        >
          <MoviePoster path={path} title="" size="w92" width={26} height={39} className="h-[39px] w-[26px]" />
        </span>
      ))}
    </span>
  );
}

/**
 * Smoked glass: a dark translucent fill that blurs the card's glow behind it, with a faint lit
 * top edge. Pure CSS, so the menu stays light.
 */
function GlassLink({ href, onNavigate, children }: { href: string; onNavigate: () => void; children: ReactNode }) {
  return (
    <Link
      href={href}
      onNavigate={onNavigate}
      className={[
        "group relative isolate mt-3 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl",
        "border border-white/10 bg-zinc-900/75 text-[15px] font-semibold text-white backdrop-blur-xl backdrop-saturate-150",
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(0_0_0/0.15)]",
        "dark:bg-black/40 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.3)]",
        "outline-none transition-[transform,background-color,border-color] duration-300 ease-out",
        "hover:border-white/20 hover:bg-zinc-900/85 dark:hover:bg-black/55",
        "active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent",
      ].join(" ")}
    >
      {/* A faint reflection on the upper half of the glass. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent dark:from-white/[0.05]"
      />
      {/* A tint of the accent pooled at the bottom edge. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 -bottom-6 -z-10 h-10 rounded-full bg-accent/30 opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </Link>
  );
}

function Stat({
  href,
  value,
  label,
  onNavigate,
}: {
  href: string;
  value: number;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onNavigate={onNavigate}
        className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 outline-none transition-colors hover:bg-canvas/60 focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="text-lg font-semibold leading-none tabular-nums tracking-[-0.02em]">
          {value.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-muted">{label}</span>
      </Link>
    </li>
  );
}

function MenuRow({
  href,
  icon: Icon,
  title,
  hint,
  badge,
  aside,
  onNavigate,
}: {
  href: string;
  icon: SolarIcon;
  title: string;
  hint: string;
  badge?: number;
  /** Replaces the count badge, e.g. with a poster preview. */
  aside?: ReactNode;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  return (
    <li>
      <Link
        href={href}
        onNavigate={onNavigate}
        aria-current={pathname === href ? "page" : undefined}
        className="group flex items-center gap-4 rounded-2xl px-3 py-3 outline-none transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent aria-[current=page]:bg-surface"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-elevated text-ink transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
          <Icon size={19} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-tight tracking-[-0.01em]">{title}</span>
          <span className="mt-0.5 block truncate text-sm font-normal text-muted">{hint}</span>
        </span>
        {aside}
        {!aside && !!badge && (
          <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold tabular-nums text-canvas">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        <AltArrowRightIcon
          size={18}
          aria-hidden="true"
          className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
        />
      </Link>
    </li>
  );
}

/** The signed-in user's account menu: who they are, and the way to everything they can change. */
export default function ProfileSidebar({
  user,
  onClose,
}: {
  user: CurrentUser;
  onClose: () => void;
}) {
  const sidebar = useSidebar(onClose);
  const router = useRouter();
  const client = useQueryClient();
  const signOut = useAuthForm(authApi.signOut, true);
  // Every count comes with `/me`, which the header already holds: opening the menu costs nothing.
  const { followersCount, followingCount, favoritesCount, watchlistCount, favoritePosters } = user.stats;
  const profile = profileHref(user.id);
  const people = (kind: "followers" | "following") => `${profile}?people=${kind}`;
  const policy = invitePolicyOptions.find((option) => option.value === user.roomInvitePolicy) ?? invitePolicyOptions[0];
  const genres = user.genres.slice(0, SHOWN_GENRES);
  const moreGenres = user.genres.length - genres.length;

  // Someone who opens the menu is likely heading to settings: have its genre list ready.
  useEffect(() => {
    client
      .query({
        queryKey: panelKeys.genres,
        queryFn: ({ signal }) => panelApi.genres(signal),
        staleTime: Infinity,
      })
      .catch(() => {}); // The settings page shows its own retry if this failed.
  }, [client]);

  return (
    <Sidebar
      ref={sidebar.ref}
      title="Your account"
      description={user.email}
      onClose={onClose}
      footer={
        <>
          <Button
            variant="flat"
            color="danger"
            className="mr-auto bg-danger-500/10 font-semibold text-danger-500 hover:bg-danger-500/20"
            startContent={!signOut.isPending && <Logout2Icon size={16} aria-hidden="true" />}
            isLoading={signOut.isPending}
            isDisabled={signOut.isPending}
            onPress={() => {
              void signOut.submit(undefined, () =>
                router.replace("/auth/sign-in?reason=signed-out"),
              );
            }}
          >
            Sign out
          </Button>
          <Button variant="light" onPress={sidebar.close}>
            Close
          </Button>
        </>
      }
    >
      {signOut.error && (
        <p role="alert" className="mb-3 text-sm text-danger-500">
          {signOut.error}
        </p>
      )}

      <div className="relative isolate shrink-0 overflow-hidden rounded-3xl border border-line bg-surface p-5">
        <span
          aria-hidden="true"
          className="absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-accent/25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-24 -left-10 -z-10 size-48 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.username}
            src={user.avatar}
            size="lg"
            alt=""
            className="shrink-0 ring-4 ring-elevated"
          />
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold leading-tight tracking-[-0.04em]">{user.username}</p>
            {user.genres.length ? (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Favorite genres">
                {genres.map((genre) => (
                  <li
                    key={genre.id}
                    className="rounded-full border border-line bg-elevated/80 px-2.5 py-0.5 text-xs font-semibold"
                  >
                    {genre.name}
                  </li>
                ))}
                {moreGenres > 0 && (
                  <li className="rounded-full px-1.5 py-0.5 text-xs font-semibold text-muted">+{moreGenres}</li>
                )}
              </ul>
            ) : (
              <p className="mt-1 text-sm font-normal text-muted">No favorite genres yet</p>
            )}
          </div>
        </div>
        <ul className="mt-5 grid grid-cols-3 rounded-2xl border border-line bg-elevated/70 p-1 backdrop-blur" aria-label="Your community">
          <Stat
            href={people("followers")}
            value={followersCount}
            label={followersCount === 1 ? "Follower" : "Followers"}
            onNavigate={sidebar.close}
          />
          <Stat href={people("following")} value={followingCount} label="Following" onNavigate={sidebar.close} />
          <Stat href={profile} value={favoritesCount} label="Favorites" onNavigate={sidebar.close} />
        </ul>
        <GlassLink href={settingsHref()} onNavigate={sidebar.close}>
          <SettingsIcon size={17} aria-hidden="true" />
          Edit profile
        </GlassLink>
      </div>

      <nav aria-label="Account" className="mt-5 shrink-0">
        <ul className="-mx-3 flex flex-col gap-0.5">
          <MenuRow
            href={favoritesCount ? profile : `${profile}?edit=favorites`}
            icon={HeartIcon}
            title="Favorite films"
            hint={
              favoritesCount
                ? `${favoritesCount} of ${MAX_FAVORITE_MOVIES} picked`
                : `Pick your top ${MAX_FAVORITE_MOVIES} for your profile`
            }
            aside={favoritePosters.length ? <PosterFan posters={favoritePosters} /> : undefined}
            onNavigate={sidebar.close}
          />
          <MenuRow
            href="/watchlist"
            icon={BookmarkIcon}
            title="Watchlist"
            hint={
              watchlistCount
                ? `${watchlistCount} ${watchlistCount === 1 ? "film" : "films"} saved for later`
                : "Nothing saved yet"
            }
            badge={watchlistCount}
            onNavigate={sidebar.close}
          />
          <MenuRow
            href={settingsHref("privacy")}
            icon={ShieldIcon}
            title="Privacy"
            hint={`Room invites: ${policy.label.toLowerCase()}`}
            onNavigate={sidebar.close}
          />
          <MenuRow
            href={settingsHref("security")}
            icon={KeyMinimalisticIcon}
            title="Password & security"
            hint="Change your password"
            onNavigate={sidebar.close}
          />
          <MenuRow
            href={profile}
            icon={UserRoundedIcon}
            title="Public profile"
            hint="See what others see"
            onNavigate={sidebar.close}
          />
        </ul>
      </nav>
    </Sidebar>
  );
}
