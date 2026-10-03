"use client";
import { Card, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";
import type { PanelRoom } from "@/lib/api/panel";
import JoinRoomButton from "./JoinRoomButton";
import { posters } from "@/config/posters";
import { ArrowUpRight } from "lucide-react";
export default function RoomCard({
  room,
  canVisit,
}: {
  room: PanelRoom;
  canVisit: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[10px] border border-line bg-elevated shadow-none" radius="lg" shadow="none">
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
          <p className="break-words text-lg font-semibold leading-[1.3]">{room.name}</p>
        </div>
        {canVisit ? (
          <Button
            as={Link}
            href={`/rooms/${room.id}`}
            className="min-h-[46px] rounded-md border border-line bg-surface text-[15px] font-semibold text-ink shrink-0"
            color="default"
            radius="lg"
            size="md"
            variant="flat"
            endContent={<ArrowUpRight size={17} aria-hidden="true" />}
          >
            Enter
          </Button>
        ) : (
          <JoinRoomButton roomId={room.id} />
        )}
      </CardFooter>
    </Card>
  );
}
