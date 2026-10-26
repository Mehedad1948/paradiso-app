import "server-only";
import notifications from "@/services/notifications";
import type { RequestResult } from "@/types/request";
import { NOTIFICATION_LIMITS, type AppNotification, type NotificationPage } from "@/types/notifications";
import { InputError, boolean, positiveInteger } from "./validation";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Opaque backend cursor: pass it through, but only if it looks like one. */
const cursorPattern = /^[A-Za-z0-9_\-=.:+/]{1,512}$/;

function uuidOf(value: unknown) {
  if (typeof value !== "string" || !uuid.test(value)) throw new InputError("Invalid notification id");
  return value;
}

/** Room images are storage keys; the client gets an absolute URL like everywhere else. */
function withRoomImage(item: AppNotification): AppNotification {
  const image = item.data.roomImage;
  if (!image || /^https?:\/\//.test(image)) return item;
  return { ...item, data: { ...item.data, roomImage: `${process.env.AWS_BASE_URL || ""}${image}` } };
}

/** Routes `/notifications/*`; `path` is the part after `notifications`. Always signed in. */
export async function handleNotificationsRequest({
  path,
  method,
  query,
  data,
  signal,
}: {
  path: string[];
  method: string;
  query: URLSearchParams;
  data: () => Promise<Record<string, unknown>>;
  signal: AbortSignal;
}): Promise<RequestResult<unknown>> {
  const [resource] = path;

  if (path.length === 0 && method === "GET") {
    const cursor = query.get("cursor");
    if (cursor !== null && !cursorPattern.test(cursor)) throw new InputError("Invalid cursor");
    const result = await notifications.list(
      {
        cursor: cursor ?? undefined,
        limit: positiveInteger(query.get("limit"), "limit", NOTIFICATION_LIMITS.pageSize, 50),
        unreadOnly: boolean(query.get("unreadOnly"), "unreadOnly", false),
      },
      signal,
    );
    return {
      ...result,
      result: result.result
        ? ({ ...result.result, items: result.result.items.map(withRoomImage) } satisfies NotificationPage)
        : null,
    };
  }

  if (path.length === 1 && resource === "unread-count" && method === "GET")
    return notifications.unreadCount(signal);

  if (path.length === 1 && resource === "read" && method === "POST") {
    const body = await data();
    if (body.all === true && body.ids === undefined) return notifications.markRead({ all: true });
    const ids = body.ids;
    if (
      body.all !== undefined ||
      !Array.isArray(ids) ||
      !ids.length ||
      ids.length > NOTIFICATION_LIMITS.markReadIds
    )
      throw new InputError("Send ids or all, not both");
    return notifications.markRead({ ids: Array.from(new Set(ids.map(uuidOf))) });
  }

  if (path.length === 1 && method === "DELETE") return notifications.remove(uuidOf(resource));

  throw new InputError("Resource not found", 404);
}
