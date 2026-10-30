"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, CloseIcon, ShieldCheckIcon } from "@solar-icons/react/linear";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@/components/ui/toast";
import UserAvatar from "@/components/ui/UserAvatar";
import { ago, fullDate, profileHref } from "@/features/community/format";
import {
  invitationErrorMessage,
  useInvitationAction,
  useInvitations,
} from "@/hooks/queries/useInvitationQueries";
import type { Invitation } from "@/types/invitations";

const ease = [0.22, 1, 0.36, 1] as const;

function Row({ invitation }: { invitation: Invitation }) {
  const action = useInvitationAction();
  const [answer, setAnswer] = useState<"approve" | "reject" | null>(null);
  const who = invitation.invitee?.username ?? invitation.email ?? "Someone";

  function review(kind: "approve" | "reject") {
    setAnswer(kind);
    action.mutate(
      { id: invitation.id, action: kind },
      {
        onSuccess: () =>
          addToast({
            title: kind === "approve" ? `${who} will get the invitation now` : `Invitation for ${who} rejected`,
            color: kind === "approve" ? "success" : "default",
          }),
        onError: (error) => {
          setAnswer(null);
          addToast({ title: invitationErrorMessage(error, kind), color: "danger" });
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5">
      <UserAvatar name={who} src={invitation.invitee?.avatar} size={40} />
      <span className="flex min-w-0 flex-1 flex-col">
        {invitation.invitee ? (
          <Link
            href={profileHref(invitation.invitee.id)}
            className="truncate rounded text-[15px] font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent"
          >
            {who}
          </Link>
        ) : (
          <span className="truncate text-[15px] font-semibold text-ink">{who}</span>
        )}
        <span className="truncate text-xs text-muted">
          by {invitation.inviter?.username ?? "a member"} ·{" "}
          <time dateTime={invitation.createdAt} title={fullDate(invitation.createdAt)}>
            {ago(invitation.createdAt)}
          </time>
        </span>
      </span>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          disabled={action.isPending}
          onClick={() => review("reject")}
          aria-label={`Reject invitation for ${who}`}
          title="Reject"
          className="flex size-9 items-center justify-center rounded-full border border-line text-muted outline-none transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        >
          {action.isPending && answer === "reject" ? <Spinner size="sm" color="current" classNames={{ wrapper: "size-4" }} /> : <CloseIcon size={17} aria-hidden="true" />}
        </button>
        <button
          type="button"
          disabled={action.isPending}
          onClick={() => review("approve")}
          aria-label={`Approve invitation for ${who}`}
          title="Approve"
          className="flex size-9 items-center justify-center rounded-full bg-ink text-canvas outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {action.isPending && answer === "approve" ? <Spinner size="sm" color="current" classNames={{ wrapper: "size-4" }} /> : <CheckIcon size={17} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

/** Invitations members sent to this private room, waiting for the owner. Renders nothing when empty. */
export default function ApprovalQueue({ roomId }: { roomId: string }) {
  const reduce = useReducedMotion();
  const query = useInvitations(roomId, 1, "awaiting_approval", { limit: 50 });
  const items = query.data?.data ?? [];
  const total = query.data?.meta.totalItems ?? items.length;

  return (
    <AnimatePresence initial={false}>
      {items.length > 0 && (
        <motion.section
          key="queue"
          aria-labelledby="approval-queue-title"
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-warning/30 bg-warning/[0.07]">
            <h3
              id="approval-queue-title"
              className="flex items-center gap-2 px-3.5 pb-1 pt-3 text-[13px] font-semibold text-ink"
            >
              <ShieldCheckIcon size={16} aria-hidden="true" className="text-warning-600 dark:text-warning" />
              Waiting for your approval
              <span className="ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-bold tabular-nums text-warning-700 dark:text-warning">
                {total}
              </span>
            </h3>
            <ul className="flex flex-col pb-1">
              <AnimatePresence initial={false}>
                {items.map((invitation) => (
                  <motion.li
                    key={invitation.id}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, x: 24 }}
                    transition={{ duration: 0.22, ease }}
                    className="overflow-hidden"
                  >
                    <Row invitation={invitation} />
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
