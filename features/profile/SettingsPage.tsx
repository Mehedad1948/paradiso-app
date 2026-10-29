"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import QueryError from "@/components/ui/QueryError";
import UserAvatar from "@/components/ui/UserAvatar";
import { profileHref } from "@/features/community/format";
import { useMe } from "@/hooks/queries/useMe";
import PasswordForm from "./components/PasswordForm";
import ProfileSettings from "./components/ProfileSettings";
import SettingsNav from "./components/SettingsNav";

function Reveal({ index, children }: { index: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 * index }}
    >
      {children}
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      {[340, 220, 180].map((height) => (
        <div key={height} className="animate-pulse rounded-3xl border border-line bg-elevated p-7" style={{ height }}>
          <div className="flex items-center gap-4">
            <span className="size-11 rounded-2xl bg-surface" />
            <div className="flex flex-col gap-2">
              <span className="h-4 w-36 rounded-full bg-surface" />
              <span className="h-3 w-56 rounded-full bg-surface" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** The signed-in user's account settings: profile, taste, privacy and security on one page. */
export default function SettingsPage() {
  const me = useMe();
  const user = me.data;

  // Content renders after the user loads, so a `#section` in the URL can't be honoured by the
  // browser on arrival; scroll to it once the section exists.
  useEffect(() => {
    if (!user) return;
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, [user]);

  return (
    <div>
      <div className="mb-10 flex min-w-0 items-end justify-between gap-6 border-b border-line pb-9 max-lg:mb-0 max-lg:border-b-0 max-sm:flex-col max-sm:items-start max-sm:pb-7">
        <div>
          <h1 className="mb-4 break-words text-[clamp(36px,4.8vw,68px)] tracking-[-0.06em] [&_em]:font-serif [&_em]:font-normal max-sm:text-[38px]">
            Make it
            <br />
            <em>yours.</em>
          </h1>
          <p className="max-w-[540px] text-base text-muted">
            Your photo, your taste, your rules. Nothing changes until you save.
          </p>
        </div>
        {user && (
          <Link
            href={profileHref(user.id)}
            className="group flex min-w-0 max-w-full shrink-0 items-center gap-3 rounded-full border border-line bg-elevated py-1.5 pl-1.5 pr-5 outline-none transition-colors hover:border-ink/30 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <UserAvatar name={user.username} src={user.avatar} size={44} alt="" />
            <span className="min-w-0">
              <span className="block max-w-[180px] truncate text-sm font-semibold">{user.username}</span>
              <span className="flex items-center gap-1 text-xs font-normal text-muted transition-colors group-hover:text-ink">
                View public profile
                <ArrowRightUpIcon
                  size={13}
                  aria-hidden="true"
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </span>
          </Link>
        )}
      </div>

      <SettingsNav variant="tabs" />
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <SettingsNav variant="rail" />
        <div className="flex min-w-0 max-w-3xl flex-col gap-8 pb-24 max-lg:pt-6">
          {user ? (
            <>
              <Reveal index={0}>
                <ProfileSettings user={user} />
              </Reveal>
              <Reveal index={3}>
                <PasswordForm />
              </Reveal>
            </>
          ) : me.isError ? (
            <QueryError error={me.error} retry={() => void me.refetch()} />
          ) : (
            <Skeleton />
          )}
        </div>
      </div>
    </div>
  );
}
