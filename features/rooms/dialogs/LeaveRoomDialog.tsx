"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { InfoCircleIcon, Logout2Icon, TrashBinMinimalisticIcon } from "@solar-icons/react/linear";
import HoldButton from "@/components/ui/HoldButton";
import { BffError } from "@/lib/api/client";
import { useLeaveRoom } from "@/hooks/queries/useRoomQueries";

export default function LeaveRoomDialog({
  roomId,
  roomName,
  onClose,
}: {
  roomId: string;
  roomName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  // Which button was pressed, so only that one shows the spinner.
  const [clearing, setClearing] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped on failure to remount the hold buttons, which otherwise stay in their done state.
  const [attempt, setAttempt] = useState(0);
  const { execute, isPending } = useLeaveRoom(roomId, {
    onSuccess: (result) => {
      addToast({
        title: `You left ${roomName}`,
        description: result.votesCleared
          ? "Your votes were deleted."
          : "Your votes were kept.",
        color: "success",
      });
      router.replace("/rooms");
    },
    onError: (failure) => {
      setClearing(null);
      setAttempt((count) => count + 1);
      // 404: not a member (or the room is gone), so there is nothing left to leave.
      if (failure instanceof BffError && failure.status === 404) {
        addToast({ title: "You are no longer a member of this room", color: "warning" });
        router.replace("/rooms");
        return;
      }
      setError(failure.message);
    },
  });

  function leave(clearVotes: boolean) {
    setError(null);
    setClearing(clearVotes);
    execute({ roomId, clearVotes });
  }

  return (
    <Modal
      placement="center"
      size="md"
      isOpen
      onClose={onClose}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      hideCloseButton={isPending}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)] [&_header]:text-2xl [&_header]:font-semibold [&_header]:tracking-[-0.04em]">
        {() => (
          <>
            <ModalHeader>Leave {roomName}?</ModalHeader>
            <ModalBody className="gap-4 pb-2">
              <p className="text-[15px] text-muted">
                You will lose access to this room until someone invites you
                again. Choose what happens to the votes you cast here.
              </p>
              <p className="flex items-start gap-2 text-sm text-muted">
                <InfoCircleIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                Votes on closed polls are kept either way. Your chat messages
                are not deleted.
              </p>
              {error && (
                <Alert color="danger" role="alert">
                  {error}
                </Alert>
              )}
            </ModalBody>
            <ModalFooter className="flex-col gap-2">
              <HoldButton
                key={`false-${attempt}`}
                size="lg"
                radius={10}
                holdTime={1500}
                resetAfter={0}
                className="w-full"
                backgroundColor="hsl(var(--heroui-foreground))"
                textColor="hsl(var(--heroui-background))"
                fillColor="hsl(var(--heroui-primary-500))"
                fillTextColor="#ffffff"
                icon={<Logout2Icon size={17} aria-hidden="true" />}
                doneLabel="Leaving…"
                disabled={isPending && clearing !== false}
                onHold={() => leave(false)}
              >
                Hold to leave, keep my votes
              </HoldButton>
              <HoldButton
                key={`true-${attempt}`}
                size="lg"
                radius={10}
                holdTime={1500}
                resetAfter={0}
                className="w-full"
                backgroundColor="hsl(var(--heroui-danger) / 0.15)"
                textColor="hsl(var(--heroui-danger))"
                fillColor="hsl(var(--heroui-danger))"
                fillTextColor="#ffffff"
                icon={<TrashBinMinimalisticIcon size={17} aria-hidden="true" />}
                doneLabel="Leaving…"
                disabled={isPending && clearing !== true}
                onHold={() => leave(true)}
              >
                Hold to leave, delete my votes
              </HoldButton>
              <p className="px-1 text-center text-xs text-muted">
                Deleting removes your movie ratings and your votes on open
                polls in this room. This can&apos;t be undone.
              </p>
              <Button
                fullWidth
                variant="light"
                isDisabled={isPending}
                onPress={onClose}
              >
                Stay in the room
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
