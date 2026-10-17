import {
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  isSameDay,
  isToday,
  isYesterday,
} from "date-fns";
import type { ChatMessage } from "@/types/chat";

export const timeOf = (value: string) => format(new Date(value), "HH:mm");
export const fullDateOf = (value: string) =>
  format(new Date(value), "EEEE d MMMM yyyy, HH:mm");

export function dayLabel(value: string) {
  const date = new Date(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, date.getFullYear() === new Date().getFullYear() ? "EEEE, d MMMM" : "d MMMM yyyy");
}

export const sameDay = (a: string, b: string) => isSameDay(new Date(a), new Date(b));

/** Consecutive messages from one author within five minutes share a header. */
export function continues(previous: ChatMessage | undefined, message: ChatMessage) {
  return (
    !!previous &&
    previous.author.id === message.author.id &&
    !previous.deletedAt &&
    !message.deletedAt &&
    !message.replyTo &&
    !message.poll &&
    sameDay(previous.createdAt, message.createdAt) &&
    differenceInMinutes(new Date(message.createdAt), new Date(previous.createdAt)) < 5
  );
}

export function closesIn(value: string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

/** One-line summary for quotes and the pinned bar. */
export function summarize(message: Pick<ChatMessage, "text" | "poll" | "movies" | "deletedAt">) {
  if (message.deletedAt) return "Message deleted";
  if (message.poll) return `Poll: ${message.text ?? ""}`;
  if (message.text) return message.text;
  if (message.movies.length)
    return message.movies.map((movie) => movie.title).join(", ");
  return "Message";
}
