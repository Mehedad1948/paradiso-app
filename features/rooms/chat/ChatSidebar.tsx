"use client";
import { useCallback, useEffect, useRef } from "react";
import StaggeredDrawer, { layerColors, type StaggeredDrawerHandle } from "@/components/ui/StaggeredDrawer";
import type { PanelRoom } from "@/lib/api/panel";
import type { User } from "@/types/user";
import RoomChat from "./RoomChat";

/** The lobby as a side panel: half the screen on desktop (within limits), full width on phones. */
export default function ChatSidebar({
  room,
  me,
  onClose: onClosed,
  onShowInWatchlist,
}: {
  room: PanelRoom;
  me: User;
  onClose: () => void;
  onShowInWatchlist: (title: string) => void;
}) {
  // The drawer plays its exit animation, then calls `onClosed` so the parent can unmount it.
  const drawer = useRef<StaggeredDrawerHandle>(null);
  const onClose = useCallback(() => {
    if (drawer.current) drawer.current.close();
    else onClosed();
  }, [onClosed]);

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
    <StaggeredDrawer
      ref={drawer}
      size="full"
      placement="right"
      isDismissable={false}
      colors={layerColors(room.themeColor)}
      onClose={onClosed}
      backdropClassName="bg-black/25"
      className="w-full sm:w-[50vw] sm:min-w-[520px] sm:max-w-[760px]"
    >
      <RoomChat room={room} me={me} onClose={onClose} onShowInWatchlist={onShowInWatchlist} />
    </StaggeredDrawer>
  );
}
