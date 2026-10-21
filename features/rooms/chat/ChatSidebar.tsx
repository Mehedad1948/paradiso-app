"use client";
import { useEffect } from "react";
import { Drawer, DrawerContent } from "@heroui/drawer";
import type { PanelRoom } from "@/lib/api/panel";
import type { User } from "@/types/user";
import RoomChat from "./RoomChat";

/** The lobby as a side panel: half the screen on desktop (within limits), full width on phones. */
export default function ChatSidebar({
  room,
  me,
  onClose,
  onShowInWatchlist,
}: {
  room: PanelRoom;
  me: User;
  onClose: () => void;
  onShowInWatchlist: (title: string) => void;
}) {
  // The drawer's own outside-click dismissal also fires for clicks inside portaled popovers
  // (message action menu, emoji picker), closing the whole chat. Dismiss only on a real
  // backdrop click instead.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      // Only the wrapper/backdrop element itself counts; descendants (the panel, popovers) never do.
      const slot = (event.target as HTMLElement | null)?.getAttribute?.("data-slot");
      if (slot !== "wrapper" && slot !== "backdrop") return;
      // A dialog stacked above the chat (delete / poll) owns its own backdrop.
      if (document.querySelectorAll("[data-slot=wrapper]").length > 1) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  return (
    <Drawer
      isOpen
      size="full"
      placement="right"
      isDismissable={false}
      onClose={onClose}
      hideCloseButton
      classNames={{
        backdrop: "bg-black/25",
        base: "w-full overflow-hidden border-l border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_22%)] sm:w-[50vw] sm:min-w-[520px] sm:max-w-[760px]",
      }}
    >
      <DrawerContent>
        {() => (
          <RoomChat room={room} me={me} onClose={onClose} onShowInWatchlist={onShowInWatchlist} />
        )}
      </DrawerContent>
    </Drawer>
  );
}
