"use client";
import { useCallback, useSyncExternalStore } from "react";
import { useRoomUrl } from "./useRoomUrl";

export type RoomDialog = "create-room" | "add-movie" | "invite";
const legacyHashes = ["add-movie-modal", "invite-modal"];
const event = "paradiso:dialogchange";
function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  window.addEventListener(event, listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
    window.removeEventListener(event, listener);
  };
}
const snapshot = () => window.location.hash;
export function useRoomDialog() {
  const { params, update } = useRoomUrl();
  const hash = useSyncExternalStore(subscribe, snapshot, () => "");
  const legacy = new URLSearchParams(hash.slice(1));
  const current = params.get("dialog");
  const dialog: RoomDialog | null =
    current === "create-room" || current === "add-movie" || current === "invite"
      ? current
      : params.get("addRoomModal") === "true"
        ? "create-room"
        : legacy.get("add-movie-modal") === "true"
          ? "add-movie"
          : legacy.get("invite-modal") === "true"
            ? "invite"
            : null;
  const clearLegacyHash = useCallback(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (!legacyHashes.some((key) => fragment.has(key))) return;
    legacyHashes.forEach((key) => fragment.delete(key));
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${fragment.size ? `#${fragment}` : ""}`,
    );
    window.dispatchEvent(new Event(event));
  }, []);
  const open = useCallback(
    (dialog: RoomDialog) => {
      clearLegacyHash();
      update({ dialog, addRoomModal: null });
    },
    [update, clearLegacyHash],
  );
  const close = useCallback(() => {
    clearLegacyHash();
    update({ dialog: null, addRoomModal: null }, true);
  }, [update, clearLegacyHash]);
  return { dialog, open, close };
}
