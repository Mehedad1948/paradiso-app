import type { components } from "./generated/backend";

export type AppNotification = components["schemas"]["Notification"];
export type NotificationType = AppNotification["type"];
export type NotificationPage = components["schemas"]["NotificationPageResponse"];
export type NotificationUnreadCount = components["schemas"]["NotificationUnreadCountResponse"];
export type MarkNotificationsRead = components["schemas"]["MarkNotificationsReadDto"];

/** Buttons an unread invitation notification offers in place of a link. */
export type InlineAction = "accept" | "decline" | "approve" | "reject";

export const NOTIFICATION_LIMITS = {
  pageSize: 20,
  /** The backend accepts up to this many ids per mark-read call. */
  markReadIds: 100,
} as const;
