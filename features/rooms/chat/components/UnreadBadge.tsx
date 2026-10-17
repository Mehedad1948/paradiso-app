import clsx from "clsx";
import type { ChatUnread } from "@/types/chat";

/** Unread count, with an amber "@" when one of them mentions me. */
export default function UnreadBadge({
  unread,
  className,
}: {
  unread: Pick<ChatUnread, "unreadCount" | "mentionCount">;
  className?: string;
}) {
  if (!unread.unreadCount && !unread.mentionCount) return null;
  const count = unread.unreadCount > 99 ? "99+" : unread.unreadCount;
  return (
    <span className={clsx("inline-flex items-center gap-1", className)}>
      {unread.mentionCount > 0 && (
        <span
          title={`${unread.mentionCount} ${unread.mentionCount === 1 ? "mention" : "mentions"}`}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-xs font-bold text-warning-foreground"
        >
          @<span className="sr-only"> {unread.mentionCount} mentions,</span>
        </span>
      )}
      {unread.unreadCount > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold tabular-nums text-danger-foreground">
          {count}
          <span className="sr-only"> unread</span>
        </span>
      )}
    </span>
  );
}
