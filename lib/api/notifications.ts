import { bffRequest, queryString } from "./client";
import {
  NOTIFICATION_LIMITS,
  type NotificationPage,
  type NotificationUnreadCount,
} from "@/types/notifications";

const json = (body: unknown) => JSON.stringify(body);

export const notificationsApi = {
  list: (
    { cursor, unreadOnly }: { cursor?: string | null; unreadOnly?: boolean },
    signal?: AbortSignal,
  ) =>
    bffRequest<NotificationPage>(
      `/notifications${queryString({
        cursor,
        limit: NOTIFICATION_LIMITS.pageSize,
        unreadOnly: unreadOnly || undefined,
      })}`,
      { signal },
    ),
  unreadCount: (signal?: AbortSignal) =>
    bffRequest<NotificationUnreadCount>("/notifications/unread-count", { signal }),
  markRead: (body: { ids: string[] } | { all: true }) =>
    bffRequest<{ updated: number }>("/notifications/read", { method: "POST", body: json(body) }),
  remove: (id: string) =>
    bffRequest<unknown>(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
