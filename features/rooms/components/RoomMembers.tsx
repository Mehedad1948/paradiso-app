"use client";
import { AltArrowRightIcon, CrownIcon, UserPlusIcon } from "@solar-icons/react/linear";
import Tag from "@/components/ui/PopTag";
import UserAvatar from "@/components/ui/UserAvatar";
import { profileHref } from "@/features/community/format";
import type { Room } from "@/types/rooms";

const SHOWN = 4;
const SIZE = 38;
// The canvas-coloured ring cuts each circle out of the one beneath it.
const ring = "ring-[3px] ring-canvas";

/** Overlapping member faces with an invite button closing the stack. */
export default function RoomMembers({
  members,
  ownerId,
  disabled,
  onInvite,
  onOpenList,
  reviewCount = 0,
}: {
  members: Room["users"];
  ownerId: number;
  disabled: boolean;
  onInvite: () => void;
  /** Opens the full member sidebar. */
  onOpenList: () => void;
  /** Invitations waiting for the owner's approval. */
  reviewCount?: number;
}) {
  const hidden = members.length - SHOWN;
  return (
    <div className="mt-6 flex items-center gap-3.5">
      <ul aria-label="Room members" className="flex items-center -space-x-2.5">
        {members.slice(0, SHOWN).map((member, index) => (
          <li
            key={member.id}
            // Earlier faces stay on top; hovering one lifts it clear of its neighbours.
            style={{ zIndex: SHOWN - index }}
            className="relative transition-transform duration-200 hover:z-10 hover:-translate-y-0.5"
          >
            <Tag
              tilt={index % 2 ? 8 : -8}
              content={
                <span className="flex items-center gap-1.5">
                  {member.id === ownerId && (
                    <CrownIcon
                      size={13}
                      aria-label="Room owner"
                      className="text-amber-400"
                    />
                  )}
                  {member.username}
                </span>
              }
            >
              <UserAvatar
                name={member.username}
                src={member.avatar}
                size={SIZE}
                href={profileHref(member.id)}
                className={ring}
                // The tag replaces the browser's plain title tooltip.
                title={undefined}
              />
            </Tag>
          </li>
        ))}
        {hidden > 0 && (
          <li className="relative">
            <Tag
              tilt={SHOWN % 2 ? 8 : -8}
              content={members
                .slice(SHOWN)
                .map((member) => member.username)
                .join(", ")}
            >
              <span
                tabIndex={0}
                aria-label={`${hidden} more members`}
                className={`grid cursor-default place-items-center rounded-full bg-surface text-xs font-semibold tabular-nums text-muted ${ring}`}
                style={{ width: SIZE, height: SIZE }}
              >
                +{hidden}
              </span>
            </Tag>
          </li>
        )}
        <li className="relative">
          <Tag tilt={8} content="Invite someone">
            <button
              type="button"
              aria-label="Invite people to this room"
              disabled={disabled}
              onClick={onInvite}
              className={`grid place-items-center rounded-full border border-dashed border-ink/30 bg-canvas text-muted transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent disabled:pointer-events-none disabled:opacity-50 ${ring}`}
              style={{ width: SIZE, height: SIZE }}
            >
              <UserPlusIcon size={16} aria-hidden="true" />
            </button>
          </Tag>
        </li>
      </ul>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOpenList}
        className="group -mx-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted transition-colors hover:bg-ink/5 hover:text-ink"
      >
        {members.length === 1 ? "1 member" : `${members.length} members`}
        {reviewCount > 0 && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-700 dark:text-warning">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-warning motion-safe:animate-pulse" />
            {reviewCount} to review
          </span>
        )}
        <AltArrowRightIcon
          size={15}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </button>
    </div>
  );
}
