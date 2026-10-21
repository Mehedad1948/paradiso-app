"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { Clapperboard, ImagePlus, Star } from "lucide-react";
import TintedAvatar from "./TintedAvatar";
import type { Viewer } from "../hooks/useViewer";
import SignInLink from "./SignInLink";

const PostComposer = dynamic(() => import("./PostComposer"), { ssr: false });

/** The quiet "what did you watch?" bar that opens the full composer. */
export default function ComposerPrompt({
  viewer,
  roomId,
  bare = false,
  placeholder = "Seen something worth passing on?",
}: {
  viewer: Viewer;
  roomId?: number;
  bare?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const frame = clsx(
    "flex items-center gap-3.5 px-5 py-4 sm:px-6",
    !bare && "rounded-[10px] border border-line bg-elevated",
  );

  if (viewer.checking)
    return <div aria-hidden="true" className={clsx(frame, "h-[78px] motion-safe:animate-pulse")} />;
  if (!viewer.me)
    return (
      <div className={clsx(frame, "justify-between max-sm:flex-col max-sm:items-start")}>
        <p className="text-[15px] text-muted">Sign in to recommend films, join conversations and follow people.</p>
        <SignInLink className="shrink-0">Sign in</SignInLink>
      </div>
    );

  return (
    <>
      <div className={frame}>
        <TintedAvatar user={viewer.self!} className="h-11 w-11 shrink-0" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[46px] flex-1 rounded-full border border-line bg-surface px-5 text-left text-[15px] text-muted transition-colors hover:border-muted hover:text-ink"
        >
          {placeholder}
        </button>
        <div className="flex items-center gap-0.5 max-md:hidden" aria-hidden="true">
          {[
            { Icon: Clapperboard, tint: "text-sky-500 hover:bg-sky-500/10" },
            { Icon: Star, tint: "text-amber-500 hover:bg-amber-500/10" },
            { Icon: ImagePlus, tint: "text-emerald-500 hover:bg-emerald-500/10" },
          ].map(({ Icon, tint }, index) => (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              onClick={() => setOpen(true)}
              className={clsx("inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors", tint)}
            >
              <Icon size={19} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[42px] shrink-0 rounded-full bg-accent px-5 text-[15px] font-semibold text-on-accent transition-opacity hover:opacity-90 max-sm:hidden"
        >
          Post
        </button>
      </div>
      {open && <PostComposer roomId={roomId} onClose={() => setOpen(false)} />}
    </>
  );
}
