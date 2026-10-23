"use client";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Crown } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { profileHref } from "@/features/community/format";
import type { Room } from "@/types/rooms";

const list: Variants = {
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  // Leaving runs backwards and quicker, so the last pill in is the first out.
  closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};
const pill: Variants = {
  // Neighbours tilt from opposite sides, then spring flat.
  closed: (index: number) => ({
    opacity: 0,
    y: 14,
    scale: 0.6,
    rotate: index % 2 ? 7 : -7,
    transition: { duration: 0.16, ease: "easeIn" },
  }),
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 520, damping: 17 },
  },
};

/** Every member as a name pill, unfolding below the room header. */
export default function RoomMemberPills({
  id,
  open,
  members,
  ownerId,
  meId,
}: {
  id: string;
  open: boolean;
  members: Room["users"];
  ownerId: number;
  meId?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          key="members"
          id={id}
          aria-label="Everyone in this room"
          className="-mt-4 overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{
            height: 0,
            opacity: 0,
            // Wait for the pills to pop out before the row closes.
            transition: { duration: 0.25, delay: reduce ? 0 : 0.15 },
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.ul
            className="flex flex-wrap gap-2.5 pb-8 pt-2"
            variants={reduce ? undefined : list}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {members.map((member, index) => (
              <motion.li
                key={member.id}
                custom={index}
                variants={reduce ? undefined : pill}
              >
                <Link
                  href={profileHref(member.id)}
                  className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-4 text-sm font-semibold text-ink backdrop-blur-md transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
                >
                  <UserAvatar
                    name={member.username}
                    src={member.avatar}
                    size={30}
                  />
                  {member.username}
                  {member.id === meId && (
                    <span className="-ml-1 font-normal text-muted">(you)</span>
                  )}
                  {member.id === ownerId && (
                    <Crown
                      size={14}
                      aria-label="Room owner"
                      className="-ml-0.5 text-amber-400"
                    />
                  )}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
