"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { addToast } from "@heroui/toast";
import { Crown, Gavel, MoreVertical, Search, UserMinus, UserPlus, Users } from "lucide-react";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import { layerColors } from "@/components/ui/StaggeredDrawer";
import HoldButton from "@/components/ui/HoldButton";
import UserAvatar from "@/components/ui/UserAvatar";
import { profileHref } from "@/features/community/format";
import { useBanMember, useKickMember } from "@/hooks/queries/useRoomQueries";
import ApprovalQueue from "../invitations/ApprovalQueue";
import type { PanelRoom } from "@/lib/api/panel";

type Member = PanelRoom["users"][number];
type Pending = { member: Member; kind: "remove" | "ban" } | null;

/** Case-insensitive name match. Swap for a server query once the backend supports member search. */
const matches = (member: Member, query: string) =>
  member.username.toLowerCase().includes(query.trim().toLowerCase());

/** Everyone in the room as a left-hand panel, with search and, for admins, remove / ban. */
export default function RoomMembersSidebar({
  room,
  meId,
  canManage,
  canReview = false,
  onInvite,
  onClose,
}: {
  room: PanelRoom;
  meId?: number;
  canManage: boolean;
  /** The owner of a private room reviews members' invitations here. */
  canReview?: boolean;
  onInvite: () => void;
  onClose: () => void;
}) {
  const sidebar = useSidebar(onClose);
  const reduce = useReducedMotion();
  const roomId = String(room.id);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  // Remounts the hold button so it can be held again after a failed request.
  const [attempt, setAttempt] = useState(0);

  const done = (title: string) => () => {
    addToast({ title, color: "success" });
    setPending(null);
    setReason("");
  };
  const failed = (error: Error) => {
    addToast({ title: error.message, color: "danger" });
    setAttempt((value) => value + 1);
  };
  const kick = useKickMember(roomId, {
    onSuccess: done("Member removed from the room"),
    onError: failed,
  });
  const ban = useBanMember(roomId, {
    onSuccess: done("Member banned from the room"),
    onError: failed,
  });
  const busy = kick.isPending || ban.isPending;

  // The owner always leads the list, then everyone else in room order.
  const members = useMemo(
    () =>
      [...room.users].sort(
        (a, b) => Number(b.id === room.owner.id) - Number(a.id === room.owner.id),
      ),
    [room.users, room.owner.id],
  );
  const visible = useMemo(
    () => (query.trim() ? members.filter((member) => matches(member, query)) : members),
    [members, query],
  );

  function confirm() {
    if (!pending) return;
    if (pending.kind === "remove") kick.execute({ roomId, userId: pending.member.id });
    else
      ban.execute({
        roomId,
        userId: pending.member.id,
        reason: reason.trim() || undefined,
      });
  }

  return (
    <Sidebar
      ref={sidebar.ref}
      placement="left"
      colors={layerColors(room.themeColor)}
      title="Members"
      description={`${members.length} ${members.length === 1 ? "person" : "people"} in ${room.name}`}
      onClose={onClose}
      busy={busy}
      footer={
        <Button
          fullWidth
          className="min-h-[44px] bg-ink font-semibold text-canvas"
          startContent={<UserPlus size={17} aria-hidden="true" />}
          onPress={onInvite}
        >
          Invite people
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {canReview && <ApprovalQueue roomId={roomId} />}
        <Input
          aria-label="Search members"
          placeholder="Search members"
          value={query}
          onValueChange={setQuery}
          isClearable
          onClear={() => setQuery("")}
          startContent={<Search size={17} aria-hidden="true" className="text-muted" />}
          classNames={{ inputWrapper: "border border-line bg-surface shadow-none" }}
        />

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted">
            <Users size={28} aria-hidden="true" />
            <p className="text-[15px]">
              {query.trim() ? `No one matches “${query.trim()}”` : "No members yet"}
            </p>
          </div>
        ) : (
          <ul aria-label="Room members" className="flex flex-col gap-1.5">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((member, index) => {
                const isOwner = member.id === room.owner.id;
                const isMe = member.id === meId;
                const manageable = canManage && !isOwner && !isMe;
                const asking = pending?.member.id === member.id ? pending : null;
                return (
                  <motion.li
                    key={member.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? undefined : { opacity: 0, x: -16 }}
                    transition={{
                      duration: 0.25,
                      ease: [0.22, 1, 0.36, 1],
                      // Only the first screenful staggers in; later rows should not lag.
                      delay: reduce ? 0 : Math.min(index, 8) * 0.035,
                    }}
                    className={`rounded-xl border transition-colors ${
                      asking
                        ? "border-danger/40 bg-danger/5"
                        : "border-transparent hover:border-line hover:bg-surface/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 p-2.5">
                      <UserAvatar
                        name={member.username}
                        src={member.avatar}
                        size={42}
                        title={undefined}
                      />
                      <Link
                        href={profileHref(member.id)}
                        className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                          <span className="truncate">{member.username}</span>
                          {isMe && <span className="font-normal text-muted">(you)</span>}
                        </span>
                        <span className="block text-xs text-muted">
                          {isOwner ? "Owner" : "Member"}
                        </span>
                      </Link>
                      {isOwner && (
                        <Crown
                          size={16}
                          aria-label="Room owner"
                          className="shrink-0 text-amber-400"
                        />
                      )}
                      {manageable && (
                        <Dropdown
                          placement="bottom-end"
                          classNames={{
                            content:
                              "min-w-[210px] rounded-xl border border-line bg-elevated p-1.5 shadow-[0_18px_50px_rgb(0_0_0_/_18%)]",
                          }}
                        >
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              isDisabled={busy}
                              aria-label={`Manage ${member.username}`}
                              className="shrink-0 text-muted"
                            >
                              <MoreVertical size={18} aria-hidden="true" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label={`Manage ${member.username}`}
                            onAction={(key) => {
                              setReason("");
                              setPending({
                                member,
                                kind: key === "ban" ? "ban" : "remove",
                              });
                            }}
                          >
                            <DropdownItem
                              key="remove"
                              startContent={<UserMinus size={17} aria-hidden="true" />}
                              description="They can be invited back"
                            >
                              Remove from room
                            </DropdownItem>
                            <DropdownItem
                              key="ban"
                              color="danger"
                              className="text-danger"
                              startContent={<Gavel size={17} aria-hidden="true" />}
                              description="Blocks them from rejoining"
                            >
                              Ban from room
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {asking && (
                        <motion.div
                          key="confirm"
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-3 px-3 pb-3">
                            <p className="text-sm text-muted">
                              {asking.kind === "remove"
                                ? `Remove ${member.username} from this room? Their ratings stay with the room.`
                                : `Ban ${member.username}? They are removed and cannot rejoin, even with an invite link.`}
                            </p>
                            {asking.kind === "ban" && (
                              <Input
                                aria-label="Reason for the ban"
                                placeholder="Reason (optional)"
                                size="sm"
                                value={reason}
                                onValueChange={setReason}
                                maxLength={500}
                                isDisabled={busy}
                                classNames={{
                                  inputWrapper: "border border-line bg-surface shadow-none",
                                }}
                              />
                            )}
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="light"
                                isDisabled={busy}
                                onPress={() => setPending(null)}
                              >
                                Cancel
                              </Button>
                              <HoldButton
                                key={`${asking.kind}-${attempt}`}
                                size="sm"
                                radius={10}
                                holdTime={1200}
                                resetAfter={0}
                                className="flex-1 font-semibold"
                                backgroundColor="hsl(var(--heroui-danger) / 0.15)"
                                textColor="hsl(var(--heroui-danger))"
                                fillColor="hsl(var(--heroui-danger))"
                                fillTextColor="#ffffff"
                                icon={
                                  asking.kind === "remove" ? (
                                    <UserMinus size={15} aria-hidden="true" />
                                  ) : (
                                    <Gavel size={15} aria-hidden="true" />
                                  )
                                }
                                doneLabel={asking.kind === "remove" ? "Removing…" : "Banning…"}
                                onHold={confirm}
                              >
                                {asking.kind === "remove" ? "Hold to remove" : "Hold to ban"}
                              </HoldButton>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </Sidebar>
  );
}
