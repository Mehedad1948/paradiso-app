"use client";
import { memo, useMemo } from "react";
import clsx from "clsx";
import { segmentText } from "@/lib/chat/mentions";
import type { PublicUser } from "@/types/chat";

export default memo(function ChatMessageText({
  text,
  mentions,
  meId,
  inverted,
}: {
  text: string;
  mentions: PublicUser[];
  meId: number;
  /** Text sits on the ink-coloured bubble of my own messages. */
  inverted: boolean;
}) {
  const segments = useMemo(() => segmentText(text, mentions), [text, mentions]);
  return (
    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
      {segments.map((segment, index) =>
        segment.type === "mention" ? (
          <span
            key={index}
            className={clsx(
              "rounded px-0.5 font-semibold",
              segment.user.id === meId
                ? "bg-warning/30 text-ink"
                : inverted
                  ? "bg-canvas/15"
                  : "bg-accent/15 text-accent",
            )}
          >
            {segment.value}
          </span>
        ) : segment.type === "link" ? (
          <a
            key={index}
            href={segment.value}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline decoration-1 underline-offset-2 hover:opacity-80"
          >
            {segment.value}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </p>
  );
});
