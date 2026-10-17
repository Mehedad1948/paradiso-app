"use client";
import { memo, useState } from "react";
import clsx from "clsx";
import ChatAvatar from "./ChatAvatar";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { Tooltip } from "@heroui/tooltip";
import { addToast } from "@heroui/toast";
import {
  Ban,
  Copy,
  Lock,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Reply,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { isPollClosed } from "@/lib/chat/timeline";
import type { ChatMessage } from "@/types/chat";
import { memberName, useChat } from "../ChatContext";
import { fullDateOf, timeOf } from "../format";
import ChatMessageText from "./ChatMessageText";
import ChatReplyQuote from "./ChatReplyQuote";
import ChatMovieCards from "./ChatMovieCards";
import ChatPollCard from "./ChatPollCard";
import ChatReactions from "./ChatReactions";
import EmojiPicker, { QUICK_REACTIONS } from "./EmojiPicker";

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  run: () => void;
};

const toolbarButton =
  "flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink";

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
  const [active, setActive] = useState(false);
  const mine = message.author.id === me.id;
  const deleted = !!message.deletedAt;
  const mentionsMe = !mine && message.mentions.some((user) => user.id === me.id);
  const poll = message.poll;
  const canModerate = mine || isOwner;
  const showBubble = deleted || (!poll && (!!message.text || !!message.replyTo));

  const menu: MenuItem[] = deleted
    ? []
    : [
        { key: "reply", label: "Reply", icon: <Reply size={16} />, run: () => chat.reply(message) },
        ...(message.text
          ? [
              {
                key: "copy",
                label: "Copy text",
                icon: <Copy size={16} />,
                run: () =>
                  navigator.clipboard
                    .writeText(message.text!)
                    .then(() => addToast({ title: "Copied to clipboard", color: "default" }))
                    .catch(() => addToast({ title: "Couldn't copy the text", color: "danger" })),
              },
            ]
          : []),
        ...(mine && !poll
          ? [{ key: "edit", label: "Edit", icon: <Pencil size={16} />, run: () => chat.edit(message) }]
          : []),
        ...(canModerate
          ? [
              message.pinnedAt
                ? { key: "unpin", label: "Unpin", icon: <PinOff size={16} />, run: () => actions.pin(message.id, false) }
                : { key: "pin", label: "Pin to the marquee", icon: <Pin size={16} />, run: () => actions.pin(message.id, true) },
            ]
          : []),
        ...(poll && canModerate && !isPollClosed(poll)
          ? [{ key: "close", label: "Close poll", icon: <Lock size={16} />, run: () => actions.closePoll(message.id) }]
          : []),
        ...(canModerate
          ? [{ key: "delete", label: "Delete", icon: <Trash2 size={16} />, danger: true, run: () => chat.requestDelete(message) }]
          : []),
      ];

  return (
    <div
      data-message-id={message.id}
      data-active={active}
      onClick={(event) => {
        // Touch screens have no hover: a tap on the row reveals its toolbar.
        if (!(event.target as HTMLElement).closest("button, a, [role=menu]")) setActive((value) => !value);
      }}
      className={clsx(
        "group relative flex gap-3 px-4 transition-colors duration-700 sm:px-6",
        continued ? "pt-0.5" : "pt-3",
        mine && "flex-row-reverse",
        mentionsMe &&
          "bg-warning/[0.07] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-warning",
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
            <ChatAvatar user={message.author} className="size-9 text-sm font-semibold" />
          )}
        </div>
      )}
      <div className={clsx("flex min-w-0 max-w-[min(82%,580px)] flex-col pb-0.5", mine ? "items-end" : "items-start")}>
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
                <Ban size={14} aria-hidden="true" /> Message deleted
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
                <Pin size={12} aria-hidden="true" /> Pinned by {message.pinnedById === me.id ? "you" : memberName(members, message.pinnedById)}
              </span>
            )}
            {message.editedAt && (
              <span title={`Edited ${fullDateOf(message.editedAt)}`}>edited</span>
            )}
          </div>
        )}
        {!deleted && <ChatReactions message={message} mine={mine} />}
      </div>
      {!deleted && (
        <div
          role="toolbar"
          aria-label="Message actions"
          className={clsx(
            "pointer-events-none absolute -top-3 z-10 flex items-center gap-0.5 rounded-lg border border-line bg-elevated p-0.5 opacity-0 shadow-[0_8px_24px_rgb(0_0_0_/_12%)] transition-opacity",
            "group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
            "group-data-[active=true]:pointer-events-auto group-data-[active=true]:opacity-100",
            mine ? "left-4 sm:left-6" : "right-4 sm:right-6",
          )}
        >
          {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React with ${emoji}`}
              className={clsx(toolbarButton, "text-base hover:scale-110")}
              onClick={() => actions.react(message.id, emoji, true)}
            >
              {emoji}
            </button>
          ))}
          <EmojiPicker label="Add a reaction" placement="bottom-end" onPick={(emoji) => actions.react(message.id, emoji, true)}>
            <button type="button" aria-label="More reactions" className={toolbarButton}>
              <SmilePlus size={17} />
            </button>
          </EmojiPicker>
          <Tooltip content="Reply" delay={400} closeDelay={0}>
            <button type="button" aria-label="Reply" className={toolbarButton} onClick={() => chat.reply(message)}>
              <Reply size={17} />
            </button>
          </Tooltip>
          <Dropdown placement="bottom-end" classNames={{ content: "border border-line bg-elevated" }}>
            <DropdownTrigger>
              <button type="button" aria-label="More actions" className={toolbarButton}>
                <MoreHorizontal size={17} />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Message menu"
              items={menu}
              onAction={(key) => menu.find((item) => item.key === key)?.run()}
            >
              {(item) => (
                <DropdownItem
                  key={item.key}
                  startContent={item.icon}
                  color={item.danger ? "danger" : "default"}
                  className={item.danger ? "text-danger" : undefined}
                >
                  {item.label}
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      )}
    </div>
  );
});
