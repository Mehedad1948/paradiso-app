"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { formatDistanceToNowStrict } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { CloseIcon, LetterIcon, SendSquareIcon } from "@solar-icons/react/linear";
import QueryError from "@/components/ui/QueryError";
import UserAvatar from "@/components/ui/UserAvatar";
import RoomThumb from "@/features/rooms/invitations/RoomThumb";
import {
  invitationErrorMessage,
  useInvitationAction,
  useSentInvitations,
} from "@/hooks/queries/useInvitationQueries";
import { isOpen, type Invitation, type InvitationStatus, type SentInvitationsSummary } from "@/types/invitations";

/** Display order for counts and the distribution bar: open first, then outcomes. */
const STATUSES: { value: InvitationStatus; label: string; dot: string; badge: string }[] = [
  { value: "pending", label: "Pending", dot: "bg-primary-500", badge: "bg-primary-500/10 text-primary-600 dark:text-primary-400" },
  { value: "awaiting_approval", label: "Awaiting owner", dot: "bg-warning-500", badge: "bg-warning-500/10 text-warning-700 dark:text-warning-400" },
  { value: "accepted", label: "Accepted", dot: "bg-success-500", badge: "bg-success-500/10 text-success-700 dark:text-success-400" },
  { value: "declined", label: "Declined", dot: "bg-danger-500", badge: "bg-danger-500/10 text-danger-600 dark:text-danger-400" },
  { value: "rejected", label: "Rejected by owner", dot: "bg-danger-300", badge: "bg-danger-500/10 text-danger-600 dark:text-danger-400" },
  { value: "expired", label: "Expired", dot: "bg-default-400", badge: "bg-default-500/10 text-muted" },
  { value: "cancelled", label: "Cancelled", dot: "bg-default-300", badge: "bg-default-500/10 text-muted" },
];
const meta = (status: InvitationStatus) => STATUSES.find((item) => item.value === status)!;
const ago = (date: string) => formatDistanceToNowStrict(new Date(date), { addSuffix: true });

/** A proportional strip of every status with at least one invitation. */
function Distribution({ summary }: { summary: SentInvitationsSummary }) {
  const parts = STATUSES.filter(({ value }) => summary[value] > 0);
  return (
    <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
      {parts.map(({ value, dot }) => (
        <motion.span
          key={value}
          className={clsx("h-full rounded-full", dot)}
          initial={false}
          animate={{ flexGrow: summary[value] }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ flexBasis: 0 }}
        />
      ))}
    </div>
  );
}

function Filters({
  summary,
  value,
  onChange,
}: {
  summary: SentInvitationsSummary;
  value: InvitationStatus | undefined;
  onChange: (next: InvitationStatus | undefined) => void;
}) {
  const reduce = useReducedMotion();
  const options = [
    { value: undefined, label: "All", count: summary.total, dot: null },
    ...STATUSES.filter((status) => summary[status.value] > 0 || status.value === value).map((status) => ({
      value: status.value,
      label: status.label,
      count: summary[status.value],
      dot: status.dot,
    })),
  ];
  return (
    <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value ?? "all"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              "relative flex h-8 items-center gap-2 rounded-full px-3 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
              active ? "text-canvas" : "text-muted hover:bg-surface hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="sent-invitations-filter"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-full bg-ink"
              />
            )}
            {option.dot && <span className={clsx("relative size-1.5 rounded-full", option.dot)} aria-hidden="true" />}
            <span className="relative">{option.label}</span>
            <span className={clsx("relative tabular-nums", active ? "text-canvas/60" : "text-muted/70")}>
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const cancel = useInvitationAction();
  const { room, invitee, email, status } = invitation;
  const badge = meta(status);
  const who = invitee?.username ?? email ?? "Someone";
  const open = isOpen(status);
  const when = open
    ? `Sent ${ago(invitation.createdAt)} · expires ${ago(invitation.expiresAt)}`
    : invitation.respondedAt || invitation.reviewedAt
      ? `${badge.label} ${ago((invitation.respondedAt ?? invitation.reviewedAt)!)}`
      : `Sent ${ago(invitation.createdAt)}`;

  return (
    <div className="group flex items-center gap-3.5 py-3.5">
      <div className="relative shrink-0">
        <RoomThumb name={room.name} image={room.image} size={44} />
        <span className="absolute -bottom-1.5 -right-1.5 rounded-full ring-[3px] ring-elevated">
          {invitee ? (
            <UserAvatar name={invitee.username} src={invitee.avatar} size={22} alt="" />
          ) : (
            <span className="grid size-[22px] place-items-center rounded-full bg-surface text-muted">
              <LetterIcon size={12} aria-hidden="true" />
            </span>
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em]">
          {who}
          <span className="font-normal text-muted"> to </span>
          <Link href={`/rooms/${room.id}`} className="underline-offset-2 hover:underline">
            {room.name}
          </Link>
        </p>
        <p className="mt-1 truncate text-xs font-normal text-muted">{when}</p>
      </div>
      <span className={clsx("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold max-sm:hidden", badge.badge)}>
        {badge.label}
      </span>
      <span
        className={clsx("size-2 shrink-0 rounded-full sm:hidden", badge.dot)}
        role="img"
        aria-label={badge.label}
      />
      {open && (
        <Button
          isIconOnly
          size="sm"
          variant="light"
          radius="full"
          aria-label={`Cancel the invitation to ${who}`}
          title="Cancel invitation"
          className="shrink-0 text-muted data-[hover=true]:bg-danger-500/10 data-[hover=true]:text-danger-500"
          isLoading={cancel.isPending}
          onPress={() =>
            cancel.mutate(
              { id: invitation.id, action: "cancel" },
              {
                onSuccess: () => addToast({ title: `Invitation to ${who} cancelled` }),
                onError: (error) => addToast({ title: invitationErrorMessage(error), color: "danger" }),
              },
            )
          }
        >
          <CloseIcon size={16} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="divide-y divide-line" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex animate-pulse items-center gap-3.5 py-3.5">
          <span className="size-11 rounded-xl bg-surface" />
          <div className="flex flex-1 flex-col gap-2">
            <span className="h-3.5 w-2/5 rounded-full bg-surface" />
            <span className="h-3 w-3/5 rounded-full bg-surface" />
          </div>
          <span className="h-6 w-20 rounded-full bg-surface max-sm:hidden" />
        </div>
      ))}
    </div>
  );
}

/** The status of every room invitation the user has sent, with cancel for the open ones. */
export default function SentInvitations() {
  const [status, setStatus] = useState<InvitationStatus | undefined>();
  const reduce = useReducedMotion();
  const sent = useSentInvitations(status);
  const summary = sent.data?.summary;
  const items = sent.data?.items ?? [];

  return (
    <section aria-labelledby="sent-invitations-title" className="mt-8 border-t border-line pt-7">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h3 id="sent-invitations-title" className="text-base font-semibold">
          Invitations you&apos;ve sent
        </h3>
        {summary && summary.total > 0 && (
          <span className="text-sm tabular-nums text-muted">
            {summary.accepted} of {summary.total} accepted
          </span>
        )}
      </div>

      {sent.isPending ? (
        <RowsSkeleton />
      ) : sent.isError ? (
        <QueryError error={sent.error} retry={() => void sent.refetch()} />
      ) : !summary?.total ? (
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-line px-5 py-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-muted">
            <SendSquareIcon size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">No invitations yet</p>
            <p className="text-sm font-normal text-muted">
              Invite friends from inside a room, and you&apos;ll see their answers here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Distribution summary={summary} />
          <div className="mt-4">
            <Filters summary={summary} value={status} onChange={setStatus} />
          </div>
          <div
            className={clsx("mt-3 transition-opacity", sent.isPlaceholderData && "opacity-50")}
            aria-busy={sent.isPlaceholderData}
          >
            {items.length ? (
              <ul className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {items.map((invitation) => (
                    <motion.li
                      key={invitation.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <InvitationRow invitation={invitation} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted">Nothing here right now.</p>
            )}
            {sent.hasNextPage && (
              <Button
                variant="flat"
                fullWidth
                className="mt-2 bg-surface font-semibold"
                isLoading={sent.isFetchingNextPage}
                onPress={() => void sent.fetchNextPage()}
              >
                Show more
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
