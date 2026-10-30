"use client";
import { memo, useState } from "react";
import clsx from "clsx";
import UserAvatar from "@/components/ui/UserAvatar";
import { addToast } from "@/components/ui/toast";
import { CopyIcon, ForbiddenCircleIcon, LockIcon, PenIcon, PinCircleIcon, PinIcon, ReplyIcon, TrashBinMinimalisticIcon } from "@solar-icons/react/linear";
import { isPollClosed } from "@/lib/chat/timeline";
import type { ChatMessage } from "@/types/chat";
import { memberName, useChat } from "../ChatContext";
import { fullDateOf, timeOf } from "../format";
import ChatMessageText from "./ChatMessageText";
import ChatReplyQuote from "./ChatReplyQuote";
import ChatMovieCards from "./ChatMovieCards";
import ChatPollCard from "./ChatPollCard";
import ChatReactions from "./ChatReactions";
import ChatMessageMenu, { type MenuItem } from "./ChatMessageMenu";

export default memo(function ChatMessageItem({
  message,
  original,
  continued,
  highlighted,
}: {
  message: ChatMessage;
  /** Locally loaded version of the replied-to message, if any. */
  original?: ChatMessage;
  continued: boolean;
  highlighted: boolean;
}) {
  const chat = useChat();
  const { me, isOwner, actions, members } = chat;
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const mine = message.author.id === me.id;
  const deleted = !!message.deletedAt;
  const mentionsMe = !mine && message.mentions.some((user) => user.id === me.id);
  const poll = message.poll;
  const canModerate = mine || isOwner;
  const showBubble = deleted || (!poll && (!!message.text || !!message.replyTo));

  const menu: MenuItem[] = deleted
    ? []
    : [
        { key: "reply", label: "Reply", icon: <ReplyIcon size={16} />, run: () => chat.reply(message) },
        ...(message.text
          ? [
              {
                key: "copy",
                label: "Copy text",
                icon: <CopyIcon size={16} />,
                run: () =>
                  navigator.clipboard
                    .writeText(message.text!)
                    .then(() => addToast({ title: "Copied to clipboard", color: "default" }))
                    .catch(() => addToast({ title: "Couldn't copy the text", color: "danger" })),
              },
            ]
          : []),
        ...(mine && !poll
          ? [{ key: "edit", label: "Edit", icon: <PenIcon size={16} />, run: () => chat.edit(message) }]
          : []),
        ...(canModerate
          ? [
              message.pinnedAt
                ? { key: "unpin", label: "Unpin", icon: <PinCircleIcon size={16} />, run: () => actions.pin(message.id, false) }
                : { key: "pin", label: "Pin to the marquee", icon: <PinIcon size={16} />, run: () => actions.pin(message.id, true) },
            ]
          : []),
        ...(poll && canModerate && !isPollClosed(poll)
          ? [{ key: "close", label: "Close poll", icon: <LockIcon size={16} />, run: () => actions.closePoll(message.id) }]
          : []),
        ...(canModerate
          ? [{ key: "delete", label: "Delete", icon: <TrashBinMinimalisticIcon size={16} />, danger: true, run: () => chat.requestDelete(message) }]
          : []),
      ];

  return (
    <div
      data-message-id={message.id}
      onContextMenu={(event) => {
        if (deleted || !menu.length || (event.target as HTMLElement).closest("a")) return;
        event.preventDefault();
        setMenuAt({ x: event.clientX, y: event.clientY });
      }}
      onClick={(event) => {
        // Touch screens have no right-click: a tap on the message opens the menu instead.
        const touch = (event.nativeEvent as PointerEvent).pointerType === "touch";
        if (!touch || deleted || !menu.length) return;
        if ((event.target as HTMLElement).closest("button, a, input, [role=menu]")) return;
        setMenuAt({ x: event.clientX, y: event.clientY });
      }}
      className={clsx(
        "group relative flex gap-3 px-4 transition-colors duration-700 sm:px-6",
        continued ? "pt-0.5" : "pt-3",
        mine && "flex-row-reverse",
        mentionsMe &&
          "bg-warning/[0.07] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-warning",
        menuAt && "bg-ink/[0.05]",
        highlighted && "!bg-accent/15",
      )}
    >
      {!mine && (
        <div className="w-9 shrink-0">
          {continued ? (
            <span className="block pt-1.5 text-center text-[10px] tabular-nums text-muted opacity-0 group-hover:opacity-100">
              {timeOf(message.createdAt)}
            </span>
          ) : (
            <UserAvatar name={message.author.username} src={message.author.avatar} size="sm" />
          )}
        </div>
      )}
      <div className={clsx("relative flex min-w-0 max-w-[min(82%,580px)] flex-col pb-0.5", mine ? "items-end" : "items-start")}>
        {!continued && (
          <div className={clsx("mb-1 flex items-baseline gap-2 text-sm", mine && "flex-row-reverse")}>
            <span className="font-semibold text-ink">{mine ? "You" : message.author.username}</span>
            {message.author.id === chat.ownerId && (
              <span className="rounded-sm bg-ink/10 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                Host
              </span>
            )}
            <time dateTime={message.createdAt} title={fullDateOf(message.createdAt)} className="text-xs tabular-nums text-muted">
              {timeOf(message.createdAt)}
            </time>
            {mentionsMe && <span className="text-xs font-semibold text-warning">@ you</span>}
          </div>
        )}
        {showBubble && (
          <div
            title={continued ? fullDateOf(message.createdAt) : undefined}
            className={clsx(
              "relative max-w-full rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed",
              deleted
                ? "border border-dashed border-line bg-transparent text-muted"
                : mine
                  ? "bg-ink text-canvas"
                  : "border border-line bg-surface text-ink",
              !deleted && (mine ? "rounded-tr-md" : "rounded-tl-md"),
              mentionsMe && "border-warning/50",
            )}
          >
            {deleted ? (
              <span className="inline-flex items-center gap-1.5 italic">
                <ForbiddenCircleIcon size={14} aria-hidden="true" /> Message deleted
              </span>
            ) : (
              <>
                {message.replyTo && (
                  <ChatReplyQuote replyTo={message.replyTo} original={original} inverted={mine} />
                )}
                {message.text && (
                  <ChatMessageText text={message.text} mentions={message.mentions} meId={me.id} inverted={mine} />
                )}
              </>
            )}
          </div>
        )}
        {!deleted && poll && message.replyTo && (
          <div className="w-[420px] max-w-full">
            <ChatReplyQuote replyTo={message.replyTo} original={original} inverted={false} />
          </div>
        )}
        {!deleted && poll && <ChatPollCard message={message} poll={poll} />}
        {!deleted && <ChatMovieCards movies={message.movies} mine={mine} />}
        {(message.editedAt || message.pinnedAt) && !deleted && (
          <div className={clsx("mt-1 flex items-center gap-2 text-xs text-muted", mine && "flex-row-reverse")}>
            {message.pinnedAt && (
              <span className="inline-flex items-center gap-1 font-semibold text-accent">
                <PinIcon size={12} aria-hidden="true" /> Pinned by {message.pinnedById === me.id ? "you" : memberName(members, message.pinnedById)}
              </span>
            )}
            {message.editedAt && (
              <span title={`Edited ${fullDateOf(message.editedAt)}`}>edited</span>
            )}
          </div>
        )}
        {!deleted && <ChatReactions message={message} mine={mine} />}
        {!deleted && !message.reactions.length && (
          <button
            type="button"
            aria-label="React with ❤️"
            onClick={() => actions.react(message.id, "❤️", true)}
            className={clsx(
              "pointer-events-none absolute -bottom-3 left-2 z-10 flex size-6 origin-center scale-0 items-center justify-center text-[16px] leading-none opacity-0",
              "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              "group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100",
              "focus-visible:pointer-events-auto focus-visible:scale-100 focus-visible:opacity-100",
              "hover:!scale-125 active:!scale-95",
            )}
          >
            <span aria-hidden="true">❤️</span>
          </button>
        )}
      </div>
      {menuAt && (
        <ChatMessageMenu
          x={menuAt.x}
          y={menuAt.y}
          items={menu}
          onReact={(emoji) => actions.react(message.id, emoji, true)}
          onClose={() => setMenuAt(null)}
        />
      )}
    </div>
  );
});
