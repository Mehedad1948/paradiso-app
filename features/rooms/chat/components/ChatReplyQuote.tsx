"use client";
import clsx from "clsx";
import { ReplyIcon } from "@solar-icons/react/linear";
import type { ChatMessage } from "@/types/chat";
import { useChat } from "../ChatContext";
import { summarize } from "../format";

/**
 * Quoted preview of the replied-to message. The server's preview is frozen at
 * send time, so a locally loaded original takes precedence.
 */
export default function ChatReplyQuote({
  replyTo,
  original,
  inverted,
}: {
  replyTo: NonNullable<ChatMessage["replyTo"]>;
  original?: ChatMessage;
  inverted: boolean;
}) {
  const { jumpTo, me } = useChat();
  const deleted = original ? !!original.deletedAt : replyTo.deleted;
  const text = original ? summarize(original) : replyTo.text;
  const author = original?.author ?? replyTo.author;
  return (
    <button
      type="button"
      onClick={() => jumpTo(replyTo.id)}
      aria-label={`Replying to ${author.username}. Show original message`}
      className={clsx(
        "mb-1.5 flex w-full min-w-0 flex-col rounded-md border-l-[3px] px-2.5 py-1.5 text-left text-sm transition-opacity hover:opacity-80",
        inverted ? "border-canvas/50 bg-canvas/10" : "border-accent bg-ink/[0.05]",
      )}
    >
      <span className="inline-flex items-center gap-1 font-semibold">
        <ReplyIcon size={13} aria-hidden="true" />
        {author.id === me.id ? "You" : author.username}
      </span>
      <span className={clsx("line-clamp-2 break-words", deleted && "italic opacity-70")}>
        {deleted ? "Message deleted" : text || "Message"}
      </span>
    </button>
  );
}
