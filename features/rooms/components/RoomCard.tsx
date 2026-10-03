"use client";
import { Card, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";
import type { PanelRoom } from "@/lib/api/panel";
import JoinRoomButton from "./JoinRoomButton";
export default function RoomCard({
  room,
  canVisit,
}: {
  room: PanelRoom;
  canVisit: boolean;
}) {
  return (
    <Card isFooterBlurred className="border-none" radius="lg">
      <Image
        alt={room.name}
        className="object-cover w-full h-full"
        height={280}
        width={280}
        src={room.imageUrl || "https://heroui.com/images/hero-card.jpeg"}
      />
      <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
        <p className="text-tiny text-center text-white font-semibold">
          {room.name}
        </p>
        {canVisit ? (
          <Button
            as={Link}
            href={`/rooms/${room.id}`}
            className="text-tiny text-white bg-black/20"
            color="default"
            radius="lg"
            size="sm"
            variant="flat"
          >
            Visit
          </Button>
        ) : (
          <JoinRoomButton roomId={room.id} />
        )}
      </CardFooter>
    </Card>
  );
}
