"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@/components/ui/toast";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { CloseIcon, LetterIcon, SendSquareIcon } from "@solar-icons/react/linear";
import UserAvatar from "@/components/ui/UserAvatar";
import QueryError from "@/components/ui/QueryError";
import { ago, fullDate } from "@/features/community/format";
import { invitationStatus } from "@/utils/statusColorPicker";
import {
  invitationErrorMessage,
  useInvitationAction,
  useInvitations,
  useInviteUser,
} from "@/hooks/queries/useInvitationQueries";
import { isOpen, type Invitation } from "@/types/invitations";
import PanelPagination from "../components/PanelPagination";

function Row({ invitation, meId }: { invitation: Invitation; meId?: number }) {
  const cancel = useInvitationAction();
  const who = invitation.invitee?.username ?? invitation.email ?? "Unknown";
  const status = invitationStatus[invitation.status];
  const mine = !!meId && invitation.inviter?.id === meId;

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface/70">
      <UserAvatar name={who} src={invitation.invitee?.avatar} size={36} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-ink">{who}</span>
        <span className="truncate text-xs text-muted">
          {invitation.inviter && !mine ? `by ${invitation.inviter.username} · ` : ""}
          <time dateTime={invitation.createdAt} title={fullDate(invitation.createdAt)}>
            {ago(invitation.createdAt)}
          </time>
        </span>
      </span>
      <Chip size="sm" variant="flat" color={status.color} className="shrink-0">
        {status.label}
      </Chip>
      {mine && isOpen(invitation.status) && (
        <button
          type="button"
          disabled={cancel.isPending}
          onClick={() =>
            cancel.mutate(
              { id: invitation.id, action: "cancel" },
              {
                onSuccess: () => addToast({ title: `Invitation for ${who} cancelled` }),
                onError: (error) => addToast({ title: invitationErrorMessage(error), color: "danger" }),
              },
            )
          }
          aria-label={`Cancel invitation for ${who}`}
          title="Cancel invitation"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        >
          {cancel.isPending ? <Spinner size="sm" color="current" classNames={{ wrapper: "size-3.5" }} /> : <CloseIcon size={15} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}

/** Invite by email address. The owner also sees every invitation sent to the room. */
export default function InviteByEmail({
  roomId,
  isOwner = false,
  meId,
}: {
  roomId: string;
  isOwner?: boolean;
  meId?: number;
}) {
  const reduce = useReducedMotion();
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const query = useInvitations(roomId, page, undefined, { enabled: isOwner });
  const { execute, isPending } = useInviteUser(roomId, {
    onSuccess: (invitation) => {
      addToast({
        title:
          invitation.status === "awaiting_approval"
            ? `Sent to the owner for approval. ${email} gets the email once it's approved.`
            : `An invitation email was sent to ${email}`,
        color: "success",
      });
      setEmail("");
    },
    onError: (error) => addToast({ title: invitationErrorMessage(error), color: "danger" }),
  });

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (email.trim()) execute({ email: email.trim(), roomId });
        }}
      >
        <Input
          value={email}
          isDisabled={isPending}
          onValueChange={setEmail}
          type="email"
          isRequired
          placeholder="friend@example.com"
          aria-label="Email address"
          startContent={<LetterIcon size={17} aria-hidden="true" className="text-muted" />}
          classNames={{ inputWrapper: "h-11 border border-line bg-surface shadow-none" }}
        />
        <Button
          type="submit"
          isLoading={isPending}
          isDisabled={!email.trim()}
          className="h-11 shrink-0 bg-ink px-5 font-semibold text-canvas"
          startContent={!isPending && <SendSquareIcon size={16} aria-hidden="true" />}
        >
          Invite
        </Button>
      </form>

      {isOwner && (
        <section aria-labelledby="sent-invitations-title">
          <h3 id="sent-invitations-title" className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
            Sent invitations
          </h3>
          {query.isPending ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : query.isError ? (
            <QueryError error={query.error} retry={() => query.refetch()} />
          ) : !query.data.data.length ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No invitations yet. People you invite, by email or from their profile, show up here.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-0.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {query.data.data.map((invitation) => (
                    <motion.li
                      key={invitation.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Row invitation={invitation} meId={meId} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <PanelPagination
                page={page}
                totalPages={query.data.meta.totalPages}
                onChange={setPage}
                disabled={query.isPlaceholderData}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
