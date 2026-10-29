"use client";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { ForbiddenCircleIcon, GlobalIcon, UserCheckIcon } from "@solar-icons/react/linear";
import type { Icon as SolarIcon } from "@solar-icons/react/lib/types";
import type { RoomInvitePolicy } from "@/types/invitations";

export const invitePolicyOptions: { value: RoomInvitePolicy; label: string; hint: string; icon: SolarIcon }[] = [
  { value: "everyone", label: "Everyone", hint: "Anyone in a room can invite you", icon: GlobalIcon },
  { value: "following", label: "People I follow", hint: "Only people you follow can invite you", icon: UserCheckIcon },
  { value: "nobody", label: "No one", hint: "You join rooms with links only", icon: ForbiddenCircleIcon },
];

/** Who may invite the user to rooms; a three-way segmented control. */
export default function InvitePolicyPicker({
  value,
  onChange,
  disabled,
  labelledBy,
}: {
  value: RoomInvitePolicy;
  onChange: (next: RoomInvitePolicy) => void;
  disabled?: boolean;
  /** A heading rendered by the parent, replacing the picker's own. */
  labelledBy?: string;
}) {
  const reduce = useReducedMotion();
  const current = invitePolicyOptions.find((option) => option.value === value) ?? invitePolicyOptions[0];
  return (
    <section aria-labelledby={labelledBy ?? "invite-policy-label"}>
      {!labelledBy && (
        <h2 id="invite-policy-label" className="mb-3 text-base font-semibold">
          Who can invite you to rooms
        </h2>
      )}
      <div role="radiogroup" aria-labelledby={labelledBy ?? "invite-policy-label"} className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1">
        {invitePolicyOptions.map(({ value: option, label, icon: Icon }) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={clsx(
                "relative flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="invite-policy"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-xl bg-elevated shadow-sm"
                />
              )}
              <Icon size={17} aria-hidden="true" className="relative" />
              <span className="relative text-center leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {current.hint}
      </p>
    </section>
  );
}
