import type { components } from "./generated/backend";
import type { BackendRequestBody } from "./backend";

export type ChatMessage = components["schemas"]["ChatMessage"];
export type ChatPage = components["schemas"]["ChatMessagePageResponse"];
export type ChatSync = components["schemas"]["ChatSyncResponse"];
export type ChatUnread = components["schemas"]["ChatUnreadResponse"];
export type ChatPoll = NonNullable<ChatMessage["poll"]>;
export type ChatMovieCard = ChatMessage["movies"][number];
export type ChatReaction = ChatMessage["reactions"][number];
export type PublicUser = components["schemas"]["PublicUser"];

export type SendChatMessageInputs = BackendRequestBody<
  "/rooms/{roomId}/chat/messages",
  "post"
>;
export type EditChatMessageInputs = BackendRequestBody<
  "/rooms/{roomId}/chat/messages/{messageId}",
  "patch"
>;
export type ChatMovieMention = NonNullable<
  SendChatMessageInputs["movies"]
>[number];
export type ChatPollInputs = NonNullable<SendChatMessageInputs["poll"]>;

export const CHAT_LIMITS = {
  text: 2000,
  mentions: 20,
  movies: 5,
  pollOptions: { min: 2, max: 10 },
  pollOptionText: 100,
  pollMaxDays: 30,
  reactionEmoji: 32,
} as const;
