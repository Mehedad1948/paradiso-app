"use client";
import { Avatar } from "@heroui/avatar";
import { useMe } from "@/hooks/queries/useMe";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { useState } from "react";
import dynamic from "next/dynamic";
import Logo from "@/components/ui/Logo";

const loadProfileSidebar = () => import("@/features/profile/ProfileSidebar");
// ssr: false gives it its own Suspense boundary, so loading the chunk never suspends the header.
const ProfileSidebar = dynamic(loadProfileSidebar, { ssr: false });

export default function Header() {
  const { data: user, isPending } = useMe();
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const navLink = (href: string) =>
    clsx(
      "inline-flex items-center gap-2 border-b py-1.5 transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "border-ink"
        : "border-transparent text-muted hover:text-ink",
    );

  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-canvas/95 px-[4.5vw] text-ink backdrop-blur-md max-md:px-[5vw]">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-[88px] max-w-[1600px] items-center justify-between gap-6 border-b border-line max-md:min-h-20 max-md:gap-3 max-[480px]:flex-wrap max-[480px]:gap-y-3 max-[480px]:py-3.5">
        <Logo />

        <div className="flex items-center gap-5 text-[15px] font-semibold max-md:gap-3 max-md:text-sm max-[480px]:basis-full max-[480px]:justify-between">
          <Link href="/community" className={navLink("/community")}>
            Community
          </Link>
          <Link href="/rooms" className={navLink("/rooms")}>
            Dashboard <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <InstallAppButton />
          <ThemeSwitch />
          {user ? (
            <div className="flex items-center gap-2.5 max-md:gap-2 max-[480px]:ml-auto">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                onPointerEnter={loadProfileSidebar}
                onFocus={loadProfileSidebar}
                aria-haspopup="dialog"
                aria-label="Open your account"
                className="group flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent max-md:pr-0.5"
              >
                <Avatar
                  name={user.username}
                  src={user.avatar ?? undefined}
                  alt=""
                  className="ring-1 ring-line transition-shadow group-hover:ring-ink/40"
                />
                <span className="max-w-[130px] truncate border-b border-transparent transition-colors group-hover:border-ink max-md:hidden">
                  {user.username}
                </span>
              </button>
            </div>
          ) : isPending ? (
            <p>Loading…</p>
          ) : (
            <Link href="/auth/sign-in" className="text-muted">
              Sign in
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
