"use client";
import clsx from "clsx";
import { Tooltip } from "@heroui/tooltip";
import { EmojiFunnyCircleIcon } from "@solar-icons/react/linear";
import type { ChatMessage } from "@/types/chat";
import { memberName, useChat } from "../ChatContext";
import EmojiPicker from "./EmojiPicker";

function names(list: string[]) {
  if (list.length <= 3) return list.join(", ").replace(/, ([^,]*)$/, " and $1");
  return `${list.slice(0, 3).join(", ")} and ${list.length - 3} more`;
}

export default function ChatReactions({
  message,
  mine,
}: {
  message: ChatMessage;
  mine: boolean;
}) {
  const { members, me, actions } = useChat();
  if (!message.reactions.length) return null;
  return (
    <div className={clsx("mt-1.5 flex flex-wrap items-center gap-1.5", mine && "justify-end")}>
      {message.reactions.map((reaction) => {
        const who = reaction.userIds.map((id) =>
          id === me.id ? "you" : memberName(members, id),
        );
        return (
          <Tooltip
            key={reaction.emoji}
            delay={300}
            closeDelay={0}
            content={`${names(who)} reacted with ${reaction.emoji}`}
            classNames={{ content: "max-w-60 text-sm" }}
          >
            <button
              type="button"
              aria-pressed={reaction.reactedByMe}
              aria-label={`${reaction.emoji} ${reaction.count}${reaction.reactedByMe ? ", you reacted" : ""}`}
              onClick={() => actions.react(message.id, reaction.emoji, !reaction.reactedByMe)}
              className={clsx(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-sm font-semibold tabular-nums transition-all active:scale-95",
                reaction.reactedByMe
                  ? "border-accent/60 bg-accent/15 text-ink"
                  : "border-line bg-surface text-muted hover:border-muted hover:text-ink",
              )}
            >
              <span className="text-base leading-none">{reaction.emoji}</span>
              {reaction.count}
            </button>
          </Tooltip>
        );
      })}
      <EmojiPicker label="Add a reaction" onPick={(emoji) => actions.react(message.id, emoji, true)}>
        <button
          type="button"
          aria-label="Add a reaction"
          className="inline-flex h-7 w-8 items-center justify-center rounded-full border border-dashed border-line text-muted transition-colors hover:border-muted hover:text-ink"
        >
          <EmojiFunnyCircleIcon size={15} aria-hidden="true" />
        </button>
      </EmojiPicker>
    </div>
  );
}
