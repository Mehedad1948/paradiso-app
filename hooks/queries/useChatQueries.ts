"use client";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/lib/api/chat";
import { panelKeys } from "@/lib/query/panel-keys";

/** There is no all-rooms endpoint, so each room card asks for its own counts. */
export const useChatUnread = (
  roomId: string,
  { enabled = true, live = false }: { enabled?: boolean; live?: boolean } = {},
) =>
  useQuery({
    queryKey: panelKeys.chatUnread(roomId),
    queryFn: ({ signal }) => chatApi.unread(roomId, signal),
    enabled: enabled && !!roomId,
    staleTime: 15_000,
    // Polling pauses in background tabs; an open chat refreshes this itself.
    refetchInterval: live ? false : 45_000,
    refetchIntervalInBackground: false,
  });

export const useChatPinned = (roomId: string, enabled = true) =>
  useQuery({
    queryKey: panelKeys.chatPinned(roomId),
    queryFn: ({ signal }) => chatApi.pinned(roomId, signal),
    enabled: enabled && !!roomId,
  });
