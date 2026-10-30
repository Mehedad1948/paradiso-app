"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { differenceInHours, formatDistanceToNowStrict } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, GlobalIcon, LetterIcon, LockIcon } from "@solar-icons/react/linear";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@/components/ui/toast";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  invitationErrorMessage,
  useInvitationAction,
  useMyInvitations,
} from "@/hooks/queries/useInvitationQueries";
import type { Invitation } from "@/types/invitations";
import RoomThumb from "./RoomThumb";

const ease = [0.22, 1, 0.36, 1] as const;

function InvitationCard({ invitation }: { invitation: Invitation }) {
  const router = useRouter();
  const action = useInvitationAction();
  const [answer, setAnswer] = useState<"accept" | "decline" | null>(null);
  const { room, inviter } = invitation;
  const soon = differenceInHours(new Date(invitation.expiresAt), new Date()) < 48;

  function respond(kind: "accept" | "decline") {
    setAnswer(kind);
    action.mutate(
      { id: invitation.id, action: kind },
      {
        onSuccess: () => {
          if (kind === "accept") {
            addToast({ title: `Welcome to ${room.name}`, color: "success" });
            router.push(`/rooms/${room.id}`);
          } else addToast({ title: "Invitation declined" });
        },
        onError: (error) => {
          setAnswer(null);
          addToast({ title: invitationErrorMessage(error, kind), color: "danger" });
        },
      },
    );
  }

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-elevated p-4 shadow-[0_10px_30px_-18px_rgb(0_0_0_/_35%)]">
      <div className="flex items-start gap-3.5">
        <RoomThumb name={room.name} image={room.image} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-ink">{room.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            {room.isPublic ? <GlobalIcon size={12} aria-hidden="true" /> : <LockIcon size={12} aria-hidden="true" />}
            {room.isPublic ? "Public room" : "Private room"}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
            {inviter ? (
              <>
                <UserAvatar name={inviter.username} src={inviter.avatar} size={20} />
                <span className="truncate">
                  <span className="font-semibold text-ink">{inviter.username}</span> invited you
                </span>
              </>
            ) : (
              <>
                <LetterIcon size={14} aria-hidden="true" /> Invited by email
              </>
            )}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          disabled={action.isPending}
          onClick={() => respond("accept")}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-canvas outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {action.isPending && answer === "accept" ? (
            <Spinner size="sm" color="current" classNames={{ wrapper: "size-4" }} />
          ) : (
            <CheckIcon size={16} aria-hidden="true" />
          )}
          Join room
        </button>
        <button
          type="button"
          disabled={action.isPending}
          onClick={() => respond("decline")}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold text-ink outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        >
          {action.isPending && answer === "decline" && (
            <Spinner size="sm" color="current" classNames={{ wrapper: "size-4" }} />
          )}
          Decline
        </button>
      </div>
      <p className={clsx("-mt-1 text-[11px] font-semibold", soon ? "text-warning-600 dark:text-warning" : "text-muted")}>
        Expires in {formatDistanceToNowStrict(new Date(invitation.expiresAt))}
      </p>
    </article>
  );
}

/** Rooms the viewer is invited to and hasn't answered. Renders nothing when there are none. */
export default function PendingInvitations({ enabled = true }: { enabled?: boolean }) {
  const reduce = useReducedMotion();
  const query = useMyInvitations("pending", { enabled });
  const items = query.data?.data ?? [];
  const total = query.data?.meta.totalItems ?? items.length;

  return (
    <AnimatePresence initial={false}>
      {items.length > 0 && (
        <motion.section
          key="pending-invitations"
          aria-labelledby="pending-invitations-title"
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.32, ease }}
          className="overflow-hidden"
        >
          <div className="mb-10 max-sm:mb-7">
            <div className="mb-4 flex items-baseline gap-2.5">
              <h2 id="pending-invitations-title" className="text-2xl tracking-[-0.04em]">
                You&apos;re invited
              </h2>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                {total}
              </span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((invitation, index) => (
                  <motion.li
                    key={invitation.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.28, ease, delay: reduce ? 0 : Math.min(index, 6) * 0.04 }}
                  >
                    <InvitationCard invitation={invitation} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
