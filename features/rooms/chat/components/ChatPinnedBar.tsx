"use client";
import { useState } from "react";
import { ChevronDown, Pin, PinOff } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { useChat } from "../ChatContext";
import { summarize } from "../format";

/** The marquee: pinned messages, newest first; click to jump, cycle through the rest. */
export default function ChatPinnedBar({ pinned }: { pinned: ChatMessage[] }) {
  const { jumpTo, actions, me, isOwner } = useChat();
  const [index, setIndex] = useState(0);
  if (!pinned.length) return null;
  const current = pinned[Math.min(index, pinned.length - 1)];
  const canUnpin = current.author.id === me.id || isOwner;
  return (
    <div className="flex items-stretch border-b border-line bg-surface/70">
      <button
        type="button"
        onClick={() => jumpTo(current.id)}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface sm:px-6"
        aria-label={`Pinned message from ${current.author.username}. Show in chat`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-warning/20 text-warning">
          <Pin size={16} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.09em] text-warning">
            Now showing{pinned.length > 1 ? ` · ${index + 1} of ${pinned.length}` : ""}
          </span>
          <span className="line-clamp-1 text-sm">
            <span className="font-semibold">{current.author.id === me.id ? "You" : current.author.username}: </span>
            <span className="text-muted">{summarize(current)}</span>
          </span>
        </span>
      </button>
      {canUnpin && (
        <button
          type="button"
          aria-label="Unpin this message"
          title="Unpin"
          onClick={() => actions.pin(current.id, false)}
          className="flex w-11 items-center justify-center text-muted transition-colors hover:text-ink"
        >
          <PinOff size={16} />
        </button>
      )}
      {pinned.length > 1 && (
        <button
          type="button"
          aria-label="Next pinned message"
          title="Next pinned message"
          onClick={() => setIndex((value) => (value + 1) % pinned.length)}
          className="flex w-11 items-center justify-center border-l border-line text-muted transition-colors hover:text-ink"
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
}
