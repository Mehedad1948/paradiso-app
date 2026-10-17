"use client";
import { useCallback, useMemo } from "react";
import { addToast } from "@heroui/toast";
import { chatApi } from "@/lib/api/chat";
import { BffError } from "@/lib/api/client";
import { applyVote, toggleReaction } from "@/lib/chat/timeline";
import type {
  ChatMessage,
  EditChatMessageInputs,
  SendChatMessageInputs,
} from "@/types/chat";
import type { ChatTimeline } from "./useChatTimeline";

export function chatErrorToast(error: unknown) {
  if (error instanceof BffError && error.status === 429)
    return addToast({
      title: "Easy there, projectionist",
      description: "You're sending messages too fast. Give it a few seconds.",
      color: "warning",
    });
  addToast({
    title:
      error instanceof BffError && error.status === 403
        ? "You can't do that in this room"
        : error instanceof Error
          ? error.message
          : "Something went wrong",
    color: "danger",
  });
}

/** Chat mutations. Each resolves to the updated message, which is upserted by id. */
export function useChatActions(
  roomId: string,
  timeline: Pick<ChatTimeline, "upsert" | "setOverlay" | "get" | "nudge">,
  userId: number | undefined,
) {
  const { upsert, setOverlay, get, nudge } = timeline;

  const run = useCallback(
    async (request: () => Promise<ChatMessage>, optimistic?: ChatMessage) => {
      if (optimistic) setOverlay(optimistic);
      try {
        upsert([await request()], "mutation");
        nudge();
        return true;
      } catch (error) {
        chatErrorToast(error);
        return false;
      } finally {
        if (optimistic) setOverlay(null, optimistic.id);
      }
    },
    [upsert, setOverlay, nudge],
  );

  const send = useCallback(
    (body: SendChatMessageInputs) => run(() => chatApi.send(roomId, body)),
    [run, roomId],
  );
  const edit = useCallback(
    (id: number, body: EditChatMessageInputs) =>
      run(() => chatApi.edit(roomId, id, body)),
    [run, roomId],
  );
  const remove = useCallback(
    (id: number) => run(() => chatApi.remove(roomId, id)),
    [run, roomId],
  );
  const react = useCallback(
    (id: number, emoji: string, add?: boolean) => {
      const message = get(id);
      if (!message || userId === undefined) return Promise.resolve(false);
      const adding =
        add ?? !message.reactions.some((item) => item.emoji === emoji && item.reactedByMe);
      return run(
        () => chatApi.react(roomId, id, emoji, adding),
        toggleReaction(message, emoji, userId, adding),
      );
    },
    [run, get, roomId, userId],
  );
  const vote = useCallback(
    (id: number, optionIds: number[]) => {
      const message = get(id);
      if (!message || userId === undefined) return Promise.resolve(false);
      return run(
        () => chatApi.vote(roomId, id, optionIds),
        applyVote(message, optionIds, userId),
      );
    },
    [run, get, roomId, userId],
  );
  const closePoll = useCallback(
    (id: number) => run(() => chatApi.closePoll(roomId, id)),
    [run, roomId],
  );
  const pin = useCallback(
    (id: number, pinned: boolean) => run(() => chatApi.pin(roomId, id, pinned)),
    [run, roomId],
  );

  return useMemo(
    () => ({ send, edit, remove, react, vote, closePoll, pin }),
    [send, edit, remove, react, vote, closePoll, pin],
  );
}

export type ChatActions = ReturnType<typeof useChatActions>;
