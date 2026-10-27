"use client";
import UserAvatar from "@/components/ui/UserAvatar";
import { useMe } from "@/hooks/queries/useMe";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { Clapperboard, LogIn, Popcorn } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/features/notifications/NotificationBell";

const loadProfileSidebar = () => import("@/features/profile/ProfileSidebar");
// ssr: false gives it its own Suspense boundary, so loading the chunk never suspends the header.
const ProfileSidebar = dynamic(loadProfileSidebar, { ssr: false });

export default function Header() {
  const { data: user, isPending } = useMe();
  const [profileOpen, setProfileOpen] = useState(false);
  const signedIn = !!user;
  // Hover/focus preloading never fires before a tap on touch screens, so also fetch the menu
  // once the browser is idle after sign-in is known.
  useEffect(() => {
    if (!signedIn) return;
    // Safari < 16.4 lacks requestIdleCallback.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => void loadProfileSidebar(), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => void loadProfileSidebar(), 2000);
    return () => window.clearTimeout(timer);
  }, [signedIn]);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const navLink = (href: string) =>
    clsx(
      "group relative inline-flex h-10 items-center justify-center gap-2 px-2.5 transition-colors duration-200 max-md:w-9 max-md:px-0",
      "after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:origin-center after:rounded-full after:bg-accent after:transition-transform after:duration-200 max-md:after:inset-x-1.5",
      isActive(href)
        ? "text-ink after:scale-x-100"
        : "text-muted after:scale-x-0 hover:text-ink hover:after:scale-x-50",
    );

  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-canvas/80 px-[4.5vw] text-ink backdrop-blur-xl max-md:px-[4vw]">
      <nav aria-label="Main navigation" className="mx-auto flex h-[88px] max-w-[1600px] flex-nowrap items-center justify-between gap-3 border-b border-line max-md:h-[72px]">
        <Logo className="shrink-0" />

        <div className="flex min-w-0 items-center gap-2 text-[15px] font-semibold max-[480px]:gap-1.5">
          <div className="mr-1 flex items-center gap-1 max-md:mr-0 max-md:gap-0.5">
            <Link href="/community" aria-label="Lobby" title="Lobby" aria-current={isActive("/community") ? "page" : undefined} className={navLink("/community")}>
              <Popcorn size={20} aria-hidden="true" />
              <span className="max-md:hidden">Lobby</span>
            </Link>
            <Link href="/rooms" aria-label="Rooms" title="Rooms" aria-current={isActive("/rooms") ? "page" : undefined} className={navLink("/rooms")}>
              <Clapperboard size={20} aria-hidden="true" />
              <span className="max-md:hidden">Rooms</span>
            </Link>
          </div>
          <InstallAppButton className="max-[480px]:size-9" />
          <ThemeSwitch className="max-[480px]:size-9" />
          {user && <NotificationBell className="max-[480px]:size-9" />}
          {user ? (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                onPointerEnter={loadProfileSidebar}
                onFocus={loadProfileSidebar}
                aria-haspopup="dialog"
                aria-label="Open your account"
                className="group flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent max-md:pr-0.5"
              >
                <UserAvatar
                  name={user.username}
                  src={user.avatar}
                  size={40}
                  alt=""
                  className="ring-2 ring-line transition-shadow group-hover:ring-accent"
                />
                <span className="max-w-[130px] truncate border-b border-transparent transition-colors group-hover:border-ink max-lg:hidden">
                  {user.username}
                </span>
              </button>
            </div>
          ) : isPending ? (
            <span aria-label="Loading" className="size-10 animate-pulse rounded-full bg-surface max-[480px]:size-9" />
          ) : (
            <Link
              href="/auth/sign-in"
              aria-label="Sign in"
              title="Sign in"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-opacity hover:opacity-85 max-[480px]:size-9"
            >
              <LogIn size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
      </nav>
      {user && profileOpen && (
        <ProfileSidebar user={user} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
