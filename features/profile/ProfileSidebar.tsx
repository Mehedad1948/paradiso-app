"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/button";
import { Bookmark, ChevronRight, KeyRound, LogOut, Settings2, Shield, UserRound, type LucideIcon } from "lucide-react";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useWatchlistTotal } from "@/hooks/queries/useWatchlistQueries";
import { authApi } from "@/lib/api/auth";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import UserAvatar from "@/components/ui/UserAvatar";
import { profileHref } from "@/features/community/format";
import type { CurrentUser } from "@/types/user";
import { invitePolicyOptions } from "./components/InvitePolicyPicker";
import { settingsHref } from "./sections";

const SHOWN_GENRES = 3;

function MenuRow({
  href,
  icon: Icon,
  title,
  hint,
  badge,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  hint: string;
  badge?: number;
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
        {!!badge && (
          <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold tabular-nums text-canvas">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        <ChevronRight
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
  const saved = useWatchlistTotal();
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
            startContent={!signOut.isPending && <LogOut size={16} aria-hidden="true" />}
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

      <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface p-5">
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
        <Button
          as={Link}
          href={settingsHref()}
          onNavigate={sidebar.close}
          fullWidth
          className="mt-5 bg-ink font-semibold text-canvas"
          startContent={<Settings2 size={17} aria-hidden="true" />}
        >
          Edit profile
        </Button>
      </div>

      <nav aria-label="Account" className="mt-5">
        <ul className="-mx-3 flex flex-col gap-0.5">
          <MenuRow
            href="/watchlist"
            icon={Bookmark}
            title="Watchlist"
            hint={
              saved.data === undefined
                ? "Films you've saved for later"
                : saved.data
                  ? `${saved.data} ${saved.data === 1 ? "film" : "films"} saved for later`
                  : "Nothing saved yet"
            }
            badge={saved.data}
            onNavigate={sidebar.close}
          />
          <MenuRow
            href={settingsHref("privacy")}
            icon={Shield}
            title="Privacy"
            hint={`Room invites: ${policy.label.toLowerCase()}`}
            onNavigate={sidebar.close}
          />
          <MenuRow
            href={settingsHref("security")}
            icon={KeyRound}
            title="Password & security"
            hint="Change your password"
            onNavigate={sidebar.close}
          />
          <MenuRow
            href={profileHref(user.id)}
            icon={UserRound}
            title="Public profile"
            hint="See what others see"
            onNavigate={sidebar.close}
          />
        </ul>
      </nav>
    </Sidebar>
  );
}
