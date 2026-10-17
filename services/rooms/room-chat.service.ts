import type { BackendRequestBody } from "@/types/backend";
import { backendRequest } from "../backend";

type SendBody = BackendRequestBody<"/rooms/{roomId}/chat/messages", "post">;
type EditBody = BackendRequestBody<"/rooms/{roomId}/chat/messages/{messageId}", "patch">;

const messagePath = "/rooms/{roomId}/chat/messages/{messageId}" as const;

const roomChatService = {
  list(roomId: number, limit: number, before?: number, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/chat/messages", "get", {
      pathParams: { roomId }, query: { limit, before }, signal,
    });
  },
  sync(roomId: number, since: string, limit?: number, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/chat/messages/sync", "get", {
      pathParams: { roomId }, query: { since, limit }, signal,
    });
  },
  get(roomId: number, messageId: number, signal?: AbortSignal) {
    return backendRequest(messagePath, "get", { pathParams: { roomId, messageId }, signal });
  },
  send(roomId: number, body: SendBody) {
    return backendRequest("/rooms/{roomId}/chat/messages", "post", {
      pathParams: { roomId }, body,
    });
  },
  edit(roomId: number, messageId: number, body: EditBody) {
    return backendRequest(messagePath, "patch", { pathParams: { roomId, messageId }, body });
  },
  delete(roomId: number, messageId: number) {
    return backendRequest(messagePath, "delete", { pathParams: { roomId, messageId } });
  },
  addReaction(roomId: number, messageId: number, emoji: string) {
    return backendRequest("/rooms/{roomId}/chat/messages/{messageId}/reactions", "put", {
      pathParams: { roomId, messageId }, body: { emoji },
    });
  },
  removeReaction(roomId: number, messageId: number, emoji: string) {
    return backendRequest("/rooms/{roomId}/chat/messages/{messageId}/reactions", "delete", {
      pathParams: { roomId, messageId }, body: { emoji },
    });
  },
  vote(roomId: number, messageId: number, optionIds: number[]) {
    return backendRequest("/rooms/{roomId}/chat/messages/{messageId}/poll/vote", "put", {
      pathParams: { roomId, messageId }, body: { optionIds },
    });
  },
  closePoll(roomId: number, messageId: number) {
    return backendRequest("/rooms/{roomId}/chat/messages/{messageId}/poll/close", "post", {
      pathParams: { roomId, messageId },
    });
  },
  pin(roomId: number, messageId: number) {
    return backendRequest("/rooms/{roomId}/chat/messages/{messageId}/pin", "put", {
      pathParams: { roomId, messageId },
    });
  },
  unpin(roomId: number, messageId: number) {
    return backendRequest("/rooms/{roomId}/chat/messages/{messageId}/pin", "delete", {
      pathParams: { roomId, messageId },
    });
  },
  pinned(roomId: number, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/chat/pinned", "get", { pathParams: { roomId }, signal });
  },
  unread(roomId: number, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/chat/unread", "get", { pathParams: { roomId }, signal });
  },
  markRead(roomId: number, messageId: number) {
    return backendRequest("/rooms/{roomId}/chat/read", "put", {
      pathParams: { roomId }, body: { messageId },
    });
  },
};

export default roomChatService;
