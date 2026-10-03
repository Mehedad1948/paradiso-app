"use client";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { useJoinRoom } from "@/hooks/queries/useRoomQueries";
export default function JoinRoomButton({ roomId }: { roomId: number }) {
  const { execute, isPending: isLoading } = useJoinRoom(String(roomId), {
    onSuccess: () =>
      addToast({ title: "You are now a member of the room", color: "success" }),
  });
  return (
    <Button
      isLoading={isLoading}
      isDisabled={isLoading}
      onPress={() => execute(roomId)}
      className="min-h-[46px] rounded-md bg-ink text-[15px] font-semibold text-canvas shrink-0"
      color="secondary"
      radius="lg"
      size="md"
      variant="flat"
    >
      Join
    </Button>
  );
}
