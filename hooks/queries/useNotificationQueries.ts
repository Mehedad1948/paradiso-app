"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { addToast } from "@/components/ui/toast";
import { notificationsApi } from "@/lib/api/notifications";
import { panelApi } from "@/lib/api/panel";
import { BffError } from "@/lib/api/client";
import { notificationKeys } from "@/lib/query/notification-keys";
import { panelKeys } from "@/lib/query/panel-keys";
import type { AppNotification, InlineAction, NotificationPage } from "@/types/notifications";
import { invitationErrorMessage, isStaleInvitationError } from "./useInvitationQueries";

type Pages = InfiniteData<NotificationPage, string | null>;
type Count = { count: number; apiVersion: string };
type Snapshot = { lists: [readonly unknown[], Pages | undefined][]; count: Count | undefined };

/** The bell badge. Cheap on the backend, so it polls; paused while the tab is hidden. */
export const useUnreadNotificationCount = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: ({ signal }) => notificationsApi.unreadCount(signal),
    select: (data) => data.count,
    enabled,
    staleTime: 20_000,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

/** One feed per filter, cursor-paged. Only fetched while the panel is open. */
export const useNotifications = (filter: "all" | "unread", enabled = true) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: ({ pageParam, signal }) =>
      notificationsApi.list({ cursor: pageParam, unreadOnly: filter === "unread" }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    staleTime: 15_000,
    // Reopening after a while starts from the top instead of refetching every loaded page.
    maxPages: 10,
  });

/** Applies `edit` to every cached notification feed and returns what it replaced. */
async function patchLists(
  client: QueryClient,
  edit: (items: AppNotification[]) => AppNotification[],
): Promise<Snapshot> {
  await client.cancelQueries({ queryKey: notificationKeys.all });
  const lists = client.getQueriesData<Pages>({ queryKey: notificationKeys.lists });
  const count = client.getQueryData<Count>(notificationKeys.unreadCount);
  for (const [key, data] of lists) {
    if (!data) continue;
    client.setQueryData<Pages>(key, {
      ...data,
      pages: data.pages.map((page) => ({ ...page, items: edit(page.items) })),
    });
  }
  return { lists, count };
}

function cachedUnread(client: QueryClient, ids: Set<string>) {
  const seen = new Set<string>();
  for (const [, data] of client.getQueriesData<Pages>({ queryKey: notificationKeys.lists }))
    for (const page of data?.pages ?? [])
      for (const item of page.items) if (ids.has(item.id) && !item.read) seen.add(item.id);
  return seen.size;
}

function setCount(client: QueryClient, next: (count: number) => number) {
  client.setQueryData<Count>(notificationKeys.unreadCount, (old) =>
    old ? { ...old, count: Math.max(0, next(old.count)) } : old,
  );
}

function restore(client: QueryClient, snapshot: Snapshot | undefined) {
  if (!snapshot) return;
  for (const [key, data] of snapshot.lists) client.setQueryData(key, data);
  client.setQueryData(notificationKeys.unreadCount, snapshot.count);
}

/** Lists keep their order after a change; mark them stale so the next open is fresh. */
function settle(client: QueryClient) {
  client.invalidateQueries({ queryKey: notificationKeys.unreadCount });
  client.invalidateQueries({ queryKey: notificationKeys.lists, refetchType: "none" });
}

const failed = (error: Error) => addToast({ title: error.message, color: "danger" });

export function useMarkNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: async (body) => {
      const ids = "ids" in body ? new Set(body.ids) : null;
      const unread = ids ? cachedUnread(client, ids) : 0;
      const snapshot = await patchLists(client, (items) =>
        items.map((item) => (!item.read && (!ids || ids.has(item.id)) ? { ...item, read: true } : item)),
      );
      setCount(client, (count) => (ids ? count - unread : 0));
      return snapshot;
    },
    onError: (error, _, snapshot) => {
      restore(client, snapshot);
      failed(error);
    },
    onSettled: () => settle(client),
  });
}

export function useRemoveNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (item: AppNotification) => notificationsApi.remove(item.id),
    onMutate: async (target) => {
      const snapshot = await patchLists(client, (items) => items.filter((item) => item.id !== target.id));
      if (!target.read) setCount(client, (count) => count - 1);
      return snapshot;
    },
    onError: (error, _, snapshot) => {
      restore(client, snapshot);
      failed(error);
    },
    onSettled: () => settle(client),
  });
}

const tokenMessage = (error: Error) => {
  if (!(error instanceof BffError)) return error.message;
  switch (error.status) {
    case 401:
      return "This invitation has expired. Ask the host to send a new one.";
    case 403:
      return "Verify your email address to accept this invitation.";
    case 404:
      return "This invitation no longer exists.";
    case 409:
      return "This invitation is no longer active.";
    default:
      return error.message;
  }
};

const done: Partial<Record<InlineAction, string>> = {
  decline: "Invitation declined",
  approve: "Approved — they'll get the invitation now",
  reject: "Invitation rejected",
};

type InviteVariables = { item: AppNotification; action: InlineAction };

/**
 * Answers an invitation notification in place — join, decline, approve or reject —
 * then retires it. Resolves with the room id so an accept can open the room.
 */
export function useNotificationInviteAction() {
  const client = useQueryClient();
  const markRead = useMarkNotificationsRead();
  const retire = (item: AppNotification) => {
    if (!item.read) markRead.mutate({ ids: [item.id] });
  };
  return useMutation({
    mutationFn: async ({ item, action }: InviteVariables): Promise<{ roomId: number | null }> => {
      const id = item.data.invitationId;
      if (id) {
        const result = await panelApi.respondInvitation({ id, action });
        return { roomId: result.room.id };
      }
      // Legacy email invitation: only the token can accept it, and "not now" is just dismissing.
      if (action === "accept" && item.data.inviteToken) {
        const result = await panelApi.acceptEmailInvite(item.data.inviteToken);
        return { roomId: result.roomId };
      }
      return { roomId: item.roomId };
    },
    onSuccess: (_, { item, action }) => {
      retire(item);
      const title = item.data.invitationId ? done[action] : undefined;
      if (title) addToast({ title, color: action === "approve" ? "success" : "default" });
    },
    onError: (error, { item, action }) => {
      // Already answered, expired or withdrawn: it will never be actionable again.
      if (isStaleInvitationError(error)) retire(item);
      addToast({
        title: item.data.invitationId ? invitationErrorMessage(error, action) : tokenMessage(error),
        color: "danger",
      });
    },
    onSettled: (_, __, { action }) => {
      client.invalidateQueries({ queryKey: panelKeys.myInvitations });
      if (action === "accept") client.invalidateQueries({ queryKey: panelKeys.rooms });
      client.invalidateQueries({ queryKey: ["room"], predicate: (query) => query.queryKey[2] === "invitations" });
    },
  });
}
