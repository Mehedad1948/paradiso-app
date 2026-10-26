"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { DoorOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";

const loadPanel = () => import("./InviteToRoomPanel");
// The picker and its queries load on first hover or open, keeping the profile light.
const InviteToRoomPanel = dynamic(loadPanel, {
  ssr: false,
  loading: () => <div className="h-56 w-[min(380px,calc(100vw-32px))]" />,
});

/** Opens the room picker for inviting `userId`, anchored to the profile header. */
export default function InviteToRoomButton({
  userId,
  name,
  className,
}: {
  userId: number;
  name: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      placement="bottom-end"
      offset={10}
      shouldBlockScroll={false}
      classNames={{
        content:
          "overflow-hidden rounded-[22px] border border-line bg-elevated p-0 text-ink shadow-[0_24px_70px_-12px_rgb(0_0_0_/_28%)]",
      }}
    >
      <PopoverTrigger>
        <button
          type="button"
          onPointerEnter={loadPanel}
          onFocus={loadPanel}
          aria-haspopup="dialog"
          className={clsx(
            "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-line px-5 text-[15px] font-semibold text-ink outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent",
            open && "bg-surface",
            className,
          )}
        >
          <DoorOpen size={18} aria-hidden="true" />
          Invite to room
        </button>
      </PopoverTrigger>
      <PopoverContent aria-labelledby="invite-to-room-title">
        {open && <InviteToRoomPanel userId={userId} name={name} />}
      </PopoverContent>
    </Popover>
  );
}
