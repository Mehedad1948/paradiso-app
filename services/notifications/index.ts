import { backendRequest } from "../backend";

const notificationsServices = {
  list(query: { cursor?: string; limit?: number; unreadOnly?: boolean }, signal?: AbortSignal) {
    return backendRequest("/notifications", "get", { query, signal });
  },
  unreadCount(signal?: AbortSignal) {
    return backendRequest("/notifications/unread-count", "get", { signal });
  },
  markRead(body: { ids: string[] } | { all: true }) {
    return backendRequest("/notifications/read", "post", { body });
  },
  remove(id: string) {
    return backendRequest("/notifications/{id}", "delete", { pathParams: { id } });
  },
};

export default notificationsServices;
