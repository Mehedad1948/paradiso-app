export const notificationKeys = {
  all: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  lists: ["notifications", "list"] as const,
  list: (filter: "all" | "unread") => ["notifications", "list", filter] as const,
};
