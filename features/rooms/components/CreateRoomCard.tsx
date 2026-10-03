"use client";
import { Button } from "@heroui/button";
import { Card, CardFooter } from "@heroui/card";
import Image from "next/image";

export default function CreateRoomCard({ onCreate }: { onCreate: () => void }) {
  return (
    <Card isFooterBlurred className="border-none" radius="lg">
      <Image
        alt="Create a room"
        className="object-cover aspect-square w-full h-full"
        height={280}
        width={280}
        src="/12-angry.jpg"
      />
      <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
        <Button
          className="text-tiny text-white w-full bg-black/20"
          color="default"
          radius="lg"
          size="sm"
          variant="flat"
          onPress={onCreate}
        >
          Create Your Room
        </Button>
      </CardFooter>
    </Card>
  );
}
