"use client";
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
  return (
    <Drawer
      isOpen
      size="full"
      placement="right"
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
