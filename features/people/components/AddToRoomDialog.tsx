"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@/components/ui/toast";
import { CheckIcon, GlobalIcon, LockIcon } from "@solar-icons/react/linear";
import QueryError from "@/components/ui/QueryError";
import { useMyRooms } from "@/hooks/queries/useCommunityQueries";
import { useMe } from "@/hooks/queries/useMe";
import { BffError } from "@/lib/api/client";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import type { PersonCredit } from "@/types/people";

/** Pick the rooms a filmography film should join. It stays open so one film can go to several. */
export default function AddToRoomDialog({ credit, onClose }: { credit: PersonCredit; onClose: () => void }) {
  const client = useQueryClient();
  const me = useMe().data;
  const myRooms = useMyRooms(me?.id);
  const [added, setAdded] = useState<ReadonlySet<number>>(new Set());
  const add = useMutation({
    mutationFn: (roomId: number) => panelApi.addMovie({ roomId, dbId: credit.tmdbId }),
    retry: false,
    onSuccess: (_, roomId) => {
      setAdded((current) => new Set(current).add(roomId));
      const key = String(roomId);
      void client.invalidateQueries({ queryKey: panelKeys.room(key) });
      void client.invalidateQueries({ queryKey: panelKeys.ratings(key) });
      addToast({ title: `${credit.title} added to the room`, color: "success" });
    },
    onError: (error, roomId) => {
      if (error instanceof BffError && error.status === 409) {
        setAdded((current) => new Set(current).add(roomId));
        addToast({ title: "This film is already in that room", color: "warning" });
      } else addToast({ title: error.message, color: "danger" });
    },
  });
  const pending = add.isPending ? add.variables : undefined;
  const rooms = myRooms.data ?? [];

  return (
    <Modal
      isOpen
      size="md"
      placement="center"
      scrollBehavior="inside"
      onClose={onClose}
      classNames={{ wrapper: "max-sm:items-end", base: "max-sm:m-0 max-sm:rounded-b-none" }}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)]">
        <ModalHeader className="flex flex-col gap-1 pb-2 pt-6">
          <span className="text-sm font-semibold uppercase tracking-[0.09em] text-accent">Add to a room</span>
          <span className="line-clamp-2 text-2xl font-semibold tracking-[-0.04em]">{credit.title}</span>
        </ModalHeader>
        <ModalBody className="py-3">
          {myRooms.isPending ? (
            <div className="grid place-items-center py-8">
              <Spinner size="sm" />
            </div>
          ) : myRooms.isError ? (
            <QueryError error={myRooms.error} retry={() => void myRooms.refetch()} />
          ) : rooms.length ? (
            <ul className="flex flex-col gap-2">
              {rooms.map((room) => {
                const done = added.has(room.id);
                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      disabled={done || pending !== undefined}
                      onClick={() => add.mutate(room.id)}
                      className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left text-[15px] font-semibold transition-colors hover:border-muted disabled:cursor-default disabled:opacity-70"
                    >
                      {room.isPublic ? (
                        <GlobalIcon size={16} aria-hidden="true" className="shrink-0 text-muted" />
                      ) : (
                        <LockIcon size={16} aria-hidden="true" className="shrink-0 text-muted" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{room.name}</span>
                      {pending === room.id ? (
                        <Spinner size="sm" />
                      ) : done ? (
                        <CheckIcon size={18} aria-label="Added" className="shrink-0 text-accent" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-[15px] text-muted">
              You aren&apos;t in any rooms yet.{" "}
              <Link href="/rooms" className="font-semibold text-accent underline-offset-4 hover:underline">
                Find or create one
              </Link>
              .
            </p>
          )}
        </ModalBody>
        <ModalFooter className="border-t border-line">
          <Button variant="light" onPress={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
