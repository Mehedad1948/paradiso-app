"use client";
import { Card, CardFooter } from "@heroui/card";
import Image from "next/image";
import Link from "next/link";
import JoinRoomButton from "./JoinRoomButton";
import { posters } from "@/config/posters";
import { ArrowRightUpIcon, ChatSquare2Icon } from "@solar-icons/react/linear";
import { useChatUnread } from "@/hooks/queries/useChatQueries";
import BorderGlow from "./BorderGlow";
import UnreadBadge from "../chat/components/UnreadBadge";
/** What a card needs, which both the public and the viewer's own room lists provide. */
export type RoomCardRoom = {
  id: number;
  name: string;
  isPublic: boolean;
  imageUrl: string | null;
};
export default function RoomCard({
  room,
  canVisit,
}: {
  room: RoomCardRoom;
  canVisit: boolean;
}) {
  // Visitable rooms are the ones I belong to, so their chat is readable.
  const unread = useChatUnread(String(room.id), { enabled: canVisit });
  const hasUnread =
    !!unread.data &&
    (unread.data.unreadCount > 0 || unread.data.mentionCount > 0);
  // Non-members can preview a public room before joining; the Join button stays separately clickable.
  const canPreview = !canVisit && room.isPublic;
  const card = (
    <Card
      className={`relative h-full overflow-hidden rounded-[10px] border border-line bg-elevated shadow-none ${canVisit || canPreview ? "transition-colors " : ""}`}
      radius="lg"
      shadow="none"
    >
      {hasUnread && (
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-media/85 py-1 pl-2.5 pr-1 text-sm font-semibold text-media-foreground backdrop-blur">
          <ChatSquare2Icon size={15} aria-hidden="true" />
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
            {canPreview ? (
              // Stretched link: the whole card opens the preview, Join sits above it.
              <Link
                href={`/rooms/${room.id}`}
                aria-label={`Preview ${room.name}`}
                className="outline-none after:absolute after:inset-0 after:z-0 focus-visible:after:ring-2 focus-visible:after:ring-ink"
              >
                {room.name}
              </Link>
            ) : (
              room.name
            )}
          </p>
        </div>
        {canVisit ? (
          // Visual only: the whole card is the link, so this can't be a nested <a>.
          <span
            aria-hidden="true"
            className="inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-md border border-line bg-surface px-4 text-[15px] font-semibold text-ink transition-opacity group-hover:opacity-80"
          >
            Enter
            <ArrowRightUpIcon size={17} />
          </span>
        ) : (
          <div className="relative z-10 shrink-0">
            <JoinRoomButton roomId={room.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );

  if (!canVisit) {
    return (
      <BorderGlow>
        <div className={canPreview ? "group h-full" : "h-full"}>{card}</div>
      </BorderGlow>
    );
  }

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
