"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, ClockCircleIcon, GlobalIcon, LockIcon, Login2Icon, MagnifierIcon, ShieldCheckIcon } from "@solar-icons/react/linear";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { BffError } from "@/lib/api/client";
import {
  invitationErrorMessage,
  useInvitableRooms,
  useInviteToRoom,
} from "@/hooks/queries/useInvitationQueries";
import type { InvitableRoom, InvitationStatus } from "@/types/invitations";
import RoomThumb from "./RoomThumb";

const ease = [0.22, 1, 0.36, 1] as const;

/** Rooms they can join first, then the ones already in motion, then the ones they're in. */
const rank = (room: InvitableRoom) => (room.isMember ? 2 : room.hasPendingInvite ? 1 : 0);

function inviteError(error: Error, name: string) {
  if (error instanceof BffError) {
    if (error.status === 403) return error.message || `${name} isn't accepting invitations from you.`;
    if (error.status === 409) return `${name} is already in this room or has an invitation.`;
  }
  return invitationErrorMessage(error);
}

function Skeleton() {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-1 px-2 pb-2">
      {[0, 1, 2].map((index) => (
        <li key={index} className="flex animate-pulse items-center gap-3 px-3 py-2.5" style={{ animationDelay: `${index * 120}ms` }}>
          <span className="size-11 shrink-0 rounded-xl bg-surface" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-3 w-2/3 rounded-full bg-surface" />
            <span className="h-2.5 w-1/3 rounded-full bg-surface" />
          </span>
          <span className="h-8 w-16 rounded-full bg-surface" />
        </li>
      ))}
    </ul>
  );
}

function State({ icon: Icon, children, tone = "muted" }: { icon: typeof CheckIcon; children: string; tone?: "muted" | "success" | "warning" }) {
  return (
    <span
      className={clsx(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold",
        tone === "success" && "bg-success/15 text-success-600 dark:text-success",
        tone === "warning" && "bg-warning/15 text-warning-700 dark:text-warning",
        tone === "muted" && "text-muted",
      )}
    >
      <Icon size={14} aria-hidden="true" strokeWidth={2.4} />
      {children}
    </span>
  );
}

function RoomRow({
  room,
  name,
  sent,
  sending,
  error,
  onInvite,
}: {
  room: InvitableRoom;
  name: string;
  sent?: InvitationStatus;
  sending: boolean;
  error?: string;
  onInvite: (room: InvitableRoom) => void;
}) {
  const reduce = useReducedMotion();
  const done = room.isMember || room.hasPendingInvite || !!sent;
  const meta = room.isPublic ? "Public" : room.requiresApproval ? "Private · owner approves" : "Private";
  const MetaIcon = room.isPublic ? GlobalIcon : room.requiresApproval ? ShieldCheckIcon : LockIcon;

  return (
    <li
      className={clsx(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
        done ? "opacity-90" : "hover:bg-surface/70",
      )}
    >
      <RoomThumb name={room.name} image={room.image} className={clsx(room.isMember && "grayscale-[60%]")} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold text-ink">{room.name}</span>
        <AnimatePresence initial={false} mode="wait">
          {error ? (
            <motion.span
              key="error"
              role="alert"
              initial={reduce ? false : { opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="line-clamp-2 text-xs font-medium text-danger"
            >
              {error}
            </motion.span>
          ) : (
            <motion.span
              key="meta"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-muted"
            >
              <MetaIcon size={12} aria-hidden="true" />
              {meta}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <AnimatePresence initial={false} mode="popLayout">
        {room.isMember ? (
          <motion.span key="member" initial={false}>
            <State icon={CheckIcon}>Member</State>
          </motion.span>
        ) : sent || room.hasPendingInvite ? (
          <motion.span
            key="sent"
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
          >
            {sent === "awaiting_approval" ? (
              <State icon={ClockCircleIcon} tone="warning">Awaiting owner</State>
            ) : sent ? (
              <State icon={CheckIcon} tone="success">Invited</State>
            ) : (
              <State icon={ClockCircleIcon}>Invited</State>
            )}
          </motion.span>
        ) : (
          <motion.button
            key="invite"
            type="button"
            disabled={sending}
            onClick={() => onInvite(room)}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            aria-label={`Invite ${name} to ${room.name}`}
            className="inline-flex h-8 min-w-[76px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-canvas outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-elevated disabled:opacity-60"
          >
            {sending ? <Spinner size="sm" color="current" classNames={{ wrapper: "size-3.5" }} /> : "Invite"}
          </motion.button>
        )}
      </AnimatePresence>
    </li>
  );
}

/** "Invite to a room" from someone's profile: the viewer's rooms, each one tap away. */
export default function InviteToRoomPanel({ userId, name }: { userId: number; name: string }) {
  const rooms = useInvitableRooms(userId);
  const invite = useInviteToRoom(userId);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<Record<number, InvitationStatus>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<Set<number>>(() => new Set());

  const sorted = useMemo(
    () => [...(rooms.data ?? [])].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)),
    [rooms.data],
  );
  const term = query.trim().toLowerCase();
  const visible = term ? sorted.filter((room) => room.name.toLowerCase().includes(term)) : sorted;
  const approvals = sorted.some((room) => room.requiresApproval && !room.isMember && !room.hasPendingInvite);

  function send(room: InvitableRoom) {
    setErrors(({ [room.id]: _, ...rest }) => rest);
    setSending((current) => new Set(current).add(room.id));
    // mutateAsync settles per call, so rapid invites to several rooms each get their own outcome.
    invite
      .mutateAsync(room)
      .then((invitation) => {
        setSent((current) => ({ ...current, [room.id]: invitation.status }));
        addToast({
          title:
            invitation.status === "awaiting_approval"
              ? `Sent to the owner of ${room.name} for approval`
              : `${name} is invited to ${room.name}`,
          color: "success",
        });
      })
      .catch((error: Error) => {
        if (error instanceof BffError && error.status === 429)
          addToast({ title: invitationErrorMessage(error), color: "danger" });
        else setErrors((current) => ({ ...current, [room.id]: inviteError(error, name) }));
      })
      .finally(() =>
        setSending((current) => {
          const next = new Set(current);
          next.delete(room.id);
          return next;
        }),
      );
  }

  return (
    <div className="flex max-h-[min(520px,calc(100svh-160px))] w-[min(380px,calc(100vw-32px))] flex-col">
      <header className="px-5 pb-3 pt-4">
        <h2 id="invite-to-room-title" className="truncate text-lg font-semibold tracking-[-0.03em]">
          Invite {name}
        </h2>
        <p className="text-[13px] text-muted">Pick a room. They&apos;ll get a notification to join.</p>
      </header>

      {sorted.length > 6 && (
        <label className="mx-4 mb-2 flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3.5 focus-within:ring-2 focus-within:ring-accent">
          <MagnifierIcon size={16} aria-hidden="true" className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your rooms"
            aria-label="Search your rooms"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {rooms.isPending ? (
          <Skeleton />
        ) : rooms.isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-8 py-8 text-center text-sm">
            <p className="text-muted">{rooms.error.message}</p>
            <button
              type="button"
              onClick={() => rooms.refetch()}
              className="rounded-full bg-ink px-4 py-1.5 font-semibold text-canvas transition-opacity hover:opacity-85"
            >
              Try again
            </button>
          </div>
        ) : !sorted.length ? (
          <div className="flex flex-col items-center px-8 pb-8 pt-4 text-center">
            <span className="relative mb-4 flex size-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-accent/10" />
              <Login2Icon size={24} className="relative text-accent" aria-hidden="true" />
            </span>
            <p className="text-[15px] font-semibold">No rooms to share yet</p>
            <p className="mt-1 text-sm text-muted">Create or join a room, then bring {name} along.</p>
            <Link
              href="/rooms"
              className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas transition-opacity hover:opacity-85"
            >
              Go to rooms
            </Link>
          </div>
        ) : !visible.length ? (
          <p className="px-6 py-8 text-center text-sm text-muted">No room matches “{query.trim()}”</p>
        ) : (
          <motion.ul layout className="flex flex-col gap-0.5 px-2 pb-2" transition={{ duration: 0.25, ease }}>
            {visible.map((room) => (
              <RoomRow
                key={room.id}
                room={room}
                name={name}
                sent={sent[room.id]}
                sending={sending.has(room.id)}
                error={errors[room.id]}
                onInvite={send}
              />
            ))}
          </motion.ul>
        )}
      </div>

      {approvals && (
        <p className="flex items-start gap-2 border-t border-line px-5 py-3 text-xs text-muted">
          <ShieldCheckIcon size={14} aria-hidden="true" className="mt-px shrink-0" />
          In private rooms you don&apos;t own, the owner approves your invitation before {name} sees it.
        </p>
      )}
    </div>
  );
}
