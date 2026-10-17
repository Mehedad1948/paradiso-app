import { bffRequest, queryString } from "./client";
import type {
  ChatMessage,
  ChatPage,
  ChatSync,
  ChatUnread,
  EditChatMessageInputs,
  SendChatMessageInputs,
} from "@/types/chat";

const json = (body: unknown) => JSON.stringify(body);
const chatPath = (roomId: string) => `/rooms/${encodeURIComponent(roomId)}/chat`;
const messagePath = (roomId: string, id: number) =>
  `${chatPath(roomId)}/messages/${encodeURIComponent(id)}`;

/** Every mutation resolves to the full updated message; upsert it by id. */
export const chatApi = {
  messages: (
    roomId: string,
    { before, limit = 30 }: { before?: number; limit?: number } = {},
    signal?: AbortSignal,
  ) =>
    bffRequest<ChatPage>(
      `${chatPath(roomId)}/messages${queryString({ limit, before })}`,
      { signal },
    ),
  sync: (roomId: string, since: string, signal?: AbortSignal) =>
    bffRequest<ChatSync>(
      `${chatPath(roomId)}/messages/sync${queryString({ since })}`,
      { signal },
    ),
  message: (roomId: string, id: number, signal?: AbortSignal) =>
    bffRequest<ChatMessage>(messagePath(roomId, id), { signal }),
  send: (roomId: string, body: SendChatMessageInputs) =>
    bffRequest<ChatMessage>(`${chatPath(roomId)}/messages`, {
      method: "POST",
      body: json(body),
    }),
  edit: (roomId: string, id: number, body: EditChatMessageInputs) =>
    bffRequest<ChatMessage>(messagePath(roomId, id), {
      method: "PATCH",
      body: json(body),
    }),
  remove: (roomId: string, id: number) =>
    bffRequest<ChatMessage>(messagePath(roomId, id), { method: "DELETE" }),
  react: (roomId: string, id: number, emoji: string, add: boolean) =>
    bffRequest<ChatMessage>(`${messagePath(roomId, id)}/reactions`, {
      method: add ? "PUT" : "DELETE",
      body: json({ emoji }),
    }),
  vote: (roomId: string, id: number, optionIds: number[]) =>
    bffRequest<ChatMessage>(`${messagePath(roomId, id)}/poll/vote`, {
      method: "PUT",
      body: json({ optionIds }),
    }),
  closePoll: (roomId: string, id: number) =>
    bffRequest<ChatMessage>(`${messagePath(roomId, id)}/poll/close`, {
      method: "POST",
    }),
  pin: (roomId: string, id: number, pinned: boolean) =>
    bffRequest<ChatMessage>(`${messagePath(roomId, id)}/pin`, {
      method: pinned ? "PUT" : "DELETE",
    }),
  pinned: (roomId: string, signal?: AbortSignal) =>
    bffRequest<{ data: ChatMessage[] }>(`${chatPath(roomId)}/pinned`, { signal }),
  unread: (roomId: string, signal?: AbortSignal) =>
    bffRequest<ChatUnread>(`${chatPath(roomId)}/unread`, { signal }),
  markRead: (roomId: string, messageId: number) =>
    bffRequest<ChatUnread>(`${chatPath(roomId)}/read`, {
      method: "PUT",
      body: json({ messageId }),
    }),
};
