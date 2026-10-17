import "server-only";
import chat from "@/services/rooms/room-chat.service";
import type { RequestResult } from "@/types/request";
import { CHAT_LIMITS, type SendChatMessageInputs } from "@/types/chat";
import { InputError, positiveInteger, text, boolean, date } from "./validation";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Mirrors the backend's single-emoji rule closely enough to reject plain text early.
const emoji = new RegExp(
  "^(?=.*[\\p{Extended_Pictographic}\\p{Regional_Indicator}])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$",
  "u",
);

function movieId(value: unknown, name: string) {
  if (typeof value !== "string" || !uuid.test(value))
    throw new InputError(`Invalid ${name}`);
  return value;
}

function list(value: unknown, name: string, max: number) {
  if (!Array.isArray(value) || value.length > max)
    throw new InputError(`Invalid ${name}`);
  return value as unknown[];
}

function userIds(value: unknown) {
  if (value === undefined) return undefined;
  const ids = list(value, "mentionedUserIds", CHAT_LIMITS.mentions).map((id) =>
    positiveInteger(id, "mentionedUserIds"),
  );
  return Array.from(new Set(ids));
}

function optionalText(value: unknown, name: string, max: number) {
  return value === undefined || value === null || value === ""
    ? undefined
    : text(value, name, max);
}

function object(value: unknown, name: string) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new InputError(`Invalid ${name}`);
  return value as Record<string, unknown>;
}

/** Rebuilds a send body from known fields only; the backend re-validates membership. */
export function parseChatMessage(data: Record<string, unknown>): SendChatMessageInputs {
  const movies =
    data.movies === undefined
      ? undefined
      : list(data.movies, "movies", CHAT_LIMITS.movies).map((value) => {
          const movie = object(value, "movie");
          const hasMovie = movie.movieId !== undefined;
          if (hasMovie === (movie.tmdbId !== undefined))
            throw new InputError("Each movie needs exactly one of movieId or tmdbId");
          return hasMovie
            ? { movieId: movieId(movie.movieId, "movieId") }
            : { tmdbId: positiveInteger(movie.tmdbId, "tmdbId") };
        });
  let poll: SendChatMessageInputs["poll"];
  if (data.poll !== undefined) {
    const value = object(data.poll, "poll");
    const options = list(value.options, "poll options", CHAT_LIMITS.pollOptions.max);
    if (options.length < CHAT_LIMITS.pollOptions.min)
      throw new InputError("A poll needs at least two options");
    const closesAt = date(value.closesAt, "closesAt");
    poll = {
      options: options.map((item) => {
        const option = object(item, "poll option");
        const label = optionalText(option.text, "poll option", CHAT_LIMITS.pollOptionText);
        const id = option.movieId === undefined ? undefined : movieId(option.movieId, "movieId");
        if (!label && !id) throw new InputError("Each poll option needs text or a movie");
        return { ...(label ? { text: label } : {}), ...(id ? { movieId: id } : {}) };
      }),
      allowsMultiple: boolean(value.allowsMultiple, "allowsMultiple", false)!,
      anonymous: boolean(value.anonymous, "anonymous", false)!,
      ...(closesAt ? { closesAt: closesAt.toISOString() } : {}),
    };
  }
  const message = optionalText(data.text, "text", CHAT_LIMITS.text);
  if (poll && !message) throw new InputError("A poll needs its question as text");
  if (!message && !movies?.length && !poll)
    throw new InputError("A message needs text, a movie or a poll");
  const mentionedUserIds = userIds(data.mentionedUserIds);
  return {
    ...(message ? { text: message } : {}),
    ...(data.replyToId === undefined || data.replyToId === null
      ? {}
      : { replyToId: positiveInteger(data.replyToId, "replyToId") }),
    ...(mentionedUserIds?.length ? { mentionedUserIds } : {}),
    ...(movies?.length ? { movies } : {}),
    ...(poll ? { poll } : {}),
  };
}

function reaction(data: Record<string, unknown>) {
  const value = text(data.emoji, "emoji", CHAT_LIMITS.reactionEmoji);
  if (!emoji.test(value)) throw new InputError("Invalid emoji");
  return value;
}

/** Routes `/rooms/:roomId/chat/*`; `path` is the part after `chat`. */
export async function handleChatRequest({
  roomId,
  path,
  method,
  query,
  data,
  signal,
}: {
  roomId: number;
  path: string[];
  method: string;
  query: URLSearchParams;
  data: () => Promise<Record<string, unknown>>;
  signal: AbortSignal;
}): Promise<RequestResult<unknown>> {
  const [resource, rawId, action, subAction] = path;
  if (path.length === 1) {
    if (resource === "pinned" && method === "GET") return chat.pinned(roomId, signal);
    if (resource === "unread" && method === "GET") return chat.unread(roomId, signal);
    if (resource === "read" && method === "PUT") {
      const body = await data();
      return chat.markRead(roomId, positiveInteger(body.messageId, "messageId"));
    }
    if (resource === "messages") {
      if (method === "GET")
        return chat.list(
          roomId,
          positiveInteger(query.get("limit"), "limit", 30, 100),
          query.has("before") ? positiveInteger(query.get("before"), "before") : undefined,
          signal,
        );
      if (method === "POST") return chat.send(roomId, parseChatMessage(await data()));
    }
  }
  if (resource !== "messages" || !rawId)
    throw new InputError("Resource or method not found", 404);
  if (path.length === 2 && rawId === "sync" && method === "GET") {
    const since = date(query.get("since"), "since");
    if (!since) throw new InputError("Invalid since");
    return chat.sync(
      roomId,
      since.toISOString(),
      query.has("limit") ? positiveInteger(query.get("limit"), "limit", 100, 200) : undefined,
      signal,
    );
  }
  const messageId = positiveInteger(rawId, "messageId");
  if (path.length === 2) {
    if (method === "GET") return chat.get(roomId, messageId, signal);
    if (method === "DELETE") return chat.delete(roomId, messageId);
    if (method === "PATCH") {
      const body = await data();
      return chat.edit(roomId, messageId, {
        text: text(body.text, "text", CHAT_LIMITS.text),
        mentionedUserIds: userIds(body.mentionedUserIds),
      });
    }
  }
  if (path.length === 3 && action === "reactions") {
    if (method === "PUT") return chat.addReaction(roomId, messageId, reaction(await data()));
    if (method === "DELETE")
      return chat.removeReaction(roomId, messageId, reaction(await data()));
  }
  if (path.length === 3 && action === "pin") {
    if (method === "PUT") return chat.pin(roomId, messageId);
    if (method === "DELETE") return chat.unpin(roomId, messageId);
  }
  if (path.length === 4 && action === "poll") {
    if (subAction === "close" && method === "POST") return chat.closePoll(roomId, messageId);
    if (subAction === "vote" && method === "PUT") {
      const body = await data();
      const optionIds = list(body.optionIds, "optionIds", CHAT_LIMITS.pollOptions.max).map(
        (id) => positiveInteger(id, "optionIds"),
      );
      return chat.vote(roomId, messageId, Array.from(new Set(optionIds)));
    }
  }
  throw new InputError("Resource or method not found", 404);
}
