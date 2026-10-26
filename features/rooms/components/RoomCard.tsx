"use client";
import { Card, CardFooter } from "@heroui/card";
import Image from "next/image";
import Link from "next/link";
import type { PanelRoomListItem } from "@/lib/api/panel";
import JoinRoomButton from "./JoinRoomButton";
import { posters } from "@/config/posters";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import { useChatUnread } from "@/hooks/queries/useChatQueries";
import BorderGlow from "./BorderGlow";
import UnreadBadge from "../chat/components/UnreadBadge";
export default function RoomCard({
  room,
  canVisit,
}: {
  room: PanelRoomListItem;
  canVisit: boolean;
}) {
  // Visitable rooms are the ones I belong to, so their chat is readable.
  const unread = useChatUnread(String(room.id), { enabled: canVisit });
  const hasUnread =
    !!unread.data &&
    (unread.data.unreadCount > 0 || unread.data.mentionCount > 0);
  const card = (
    <Card
      className={`h-full overflow-hidden rounded-[10px] border border-line bg-elevated shadow-none ${canVisit ? "transition-colors group-hover:border-muted" : ""}`}
      radius="lg"
      shadow="none"
    >
      {hasUnread && (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-media/85 py-1 pl-2.5 pr-1 text-sm font-semibold text-media-foreground backdrop-blur">
          <MessagesSquare size={15} aria-hidden="true" />
          <span className="sr-only">Lobby:</span>
          <UnreadBadge unread={unread.data!} />
        </span>
      )}
      <Image
        alt={room.name}
        className="aspect-[16/10] w-full object-cover"
        height={280}
        width={280}
        src={room.imageUrl || posters.fellowship}
      />
      <CardFooter className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="mb-1.5 text-sm text-muted">
            {room.isPublic ? "Open to discovery" : "Your private circle"}
          </p>
          <p className="break-words text-lg font-semibold leading-[1.3]">
            {room.name}
          </p>
        </div>
        {canVisit ? (
          // Visual only: the whole card is the link, so this can't be a nested <a>.
          <span
            aria-hidden="true"
            className="inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-md border border-line bg-surface px-4 text-[15px] font-semibold text-ink transition-opacity group-hover:opacity-80"
          >
            Enter
            <ArrowUpRight size={17} />
          </span>
        ) : (
          <JoinRoomButton roomId={room.id} />
        )}
      </CardFooter>
    </Card>
  );

  if (!canVisit) return <BorderGlow>{card}</BorderGlow>;

  return (
    <BorderGlow>
      <Link
        href={`/rooms/${room.id}`}
        aria-label={`Enter ${room.name}`}
        className="group block h-full rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    </BorderGlow>
  );
}
