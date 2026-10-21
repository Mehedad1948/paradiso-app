"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { ArrowUpRight, DoorOpen } from "lucide-react";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import type { CommunityPromotion } from "@/types/community";
import type { Viewer } from "../hooks/useViewer";
import SignInLink from "./SignInLink";

/** A room the author invites readers into. Readers only ever see its name and image. */
export default function PromotionCard({
  promotion,
  viewer,
}: {
  promotion: CommunityPromotion;
  viewer: Viewer;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const { room, canJoin, token } = promotion;
  const roomHref = `/rooms/${room.id}`;
  const member = viewer.isMember(room.id);
  const join = useMutation({
    mutationFn: panelApi.acceptInvite,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: panelKeys.rooms });
      addToast({ title: `Welcome to ${room.name}`, color: "success" });
      router.push(roomHref);
    },
    onError: (error) => addToast({ title: error.message, color: "danger" }),
  });

  let action;
  if (member)
    action = (
      <Link
        href={roomHref}
        className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-md border border-line bg-elevated px-3.5 text-sm font-semibold transition-opacity hover:opacity-80"
      >
        Enter <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    );
  else if (!canJoin || !token)
    action = (
      <span className="shrink-0 rounded-md border border-dashed border-line px-3 py-2 text-sm font-semibold text-muted">
        Invite expired
      </span>
    );
  else if (!viewer.signedIn)
    action = <SignInLink className="shrink-0 !min-h-[40px] !px-3.5 text-sm">Sign in to join</SignInLink>;
  else
    action = (
      <Button
        size="sm"
        className="min-h-[40px] shrink-0 rounded-md bg-ink px-4 text-sm font-semibold text-canvas"
        isLoading={join.isPending}
        onPress={() => join.mutate(token)}
      >
        Join room
      </Button>
    );

  return (
    <div className="mt-3 flex items-center gap-3.5 rounded-[10px] border border-line bg-surface/70 p-3">
      {room.image ? (
        <img src={room.image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-md object-cover" />
      ) : (
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-media text-media-foreground/70">
          <DoorOpen size={22} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Room invitation</p>
        <p className="truncate font-semibold leading-snug">{room.name}</p>
        <p className="text-sm text-muted">
          {member
            ? "You're already a member."
            : canJoin
              ? "Watch along and share the ratings."
              : "This invitation is no longer open."}
        </p>
      </div>
      {action}
    </div>
  );
}
