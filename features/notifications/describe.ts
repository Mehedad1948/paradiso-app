import { differenceInCalendarDays, isToday, isYesterday } from "date-fns";
import { AtSign, Clapperboard, DoorOpen, MessageCircle, Reply, ThumbsUp, type LucideIcon } from "lucide-react";
import { imageSrc, postHref } from "@/features/community/format";
import type { AppNotification } from "@/types/notifications";

export type Described = {
  icon: LucideIcon;
  /** Badge colors on the actor's avatar. */
  tone: string;
  /** Rendered as: <actor>{others} {verb} <target>. */
  verb: string;
  target?: string;
  excerpt?: string;
  href?: string;
  thumbnail?: { src: string; shape: "poster" | "square" } | null;
};

const roomHref = (item: AppNotification, chat = false) =>
  item.roomId ? `/rooms/${item.roomId}${chat ? "?dialog=chat" : ""}` : undefined;

export function describe(item: AppNotification): Described {
  const { data } = item;
  const room = data.roomName || "a room";
  switch (item.type) {
    case "room_invite":
      return {
        icon: DoorOpen,
        tone: "bg-violet-500",
        verb: "invited you to",
        target: room,
        // An accepted invite becomes a shortcut into the room.
        href: item.read ? roomHref(item) : undefined,
        thumbnail: data.roomImage ? { src: data.roomImage, shape: "square" } : null,
      };
    case "movie_added": {
      const poster = imageSrc(data.posterUrl, "w185");
      return {
        icon: Clapperboard,
        tone: "bg-amber-500",
        verb: item.actorCount > 1 ? "added films to" : `added ${data.movieTitle ? `“${data.movieTitle}” to` : "a film to"}`,
        target: room,
        href: roomHref(item),
        thumbnail: poster ? { src: poster, shape: "poster" } : null,
      };
    }
    case "chat_mention": {
      const reply = data.reason === "reply";
      return {
        icon: reply ? Reply : AtSign,
        tone: "bg-sky-500",
        verb: reply ? "replied to you in" : "mentioned you in",
        target: room,
        excerpt: data.messageExcerpt,
        href: roomHref(item, true),
      };
    }
    case "post_liked":
      return {
        icon: ThumbsUp,
        tone: "bg-rose-500",
        verb: "liked your post",
        excerpt: data.postExcerpt,
        href: item.entity.type === "post" ? postHref(Number(item.entity.id)) : undefined,
      };
    case "post_commented":
      return {
        icon: MessageCircle,
        tone: "bg-emerald-500",
        verb: "commented on your post",
        excerpt: data.commentExcerpt || data.postExcerpt,
        href: item.entity.type === "post" ? postHref(Number(item.entity.id)) : undefined,
      };
  }
}

export const others = (count: number) =>
  count > 1 ? ` and ${count - 1 === 1 ? "1 other" : `${(count - 1).toLocaleString()} others`}` : "";

/** Plain-text line for screen readers and tooltips. */
export function sentence(item: AppNotification) {
  const { verb, target } = describe(item);
  return `${item.actor.username}${others(item.actorCount)} ${verb}${target ? ` ${target}` : ""}`;
}

export type Section = { label: string; items: AppNotification[] };

/** Today / Yesterday / This week / Earlier, in feed order. */
export function sections(items: AppNotification[], now = new Date()): Section[] {
  const result: Section[] = [];
  for (const item of items) {
    const date = new Date(item.updatedAt);
    const label = isToday(date)
      ? "Today"
      : isYesterday(date)
        ? "Yesterday"
        : differenceInCalendarDays(now, date) < 7
          ? "This week"
          : "Earlier";
    const last = result.at(-1);
    if (last?.label === label) last.items.push(item);
    else result.push({ label, items: [item] });
  }
  return result;
}
