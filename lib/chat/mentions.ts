import type { PublicUser } from "@/types/chat";

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A mention ends where a username could not continue.
const boundary = "(?![\\w.-])";

/** The `@query` being typed at the caret, if any. */
export function mentionQueryAt(text: string, caret: number) {
  const match = /(^|\s)@([\w.-]{0,30})$/.exec(text.slice(0, caret));
  if (!match) return null;
  return { query: match[2], start: caret - match[2].length - 1 };
}

export function insertMention(
  text: string,
  start: number,
  caret: number,
  username: string,
) {
  const inserted = `@${username} `;
  const rest = text.slice(caret).replace(/^\S*\s?/, "");
  return {
    text: `${text.slice(0, start)}${inserted}${rest}`,
    caret: start + inserted.length,
  };
}

/** Ids are what count server-side; collect every member still named in the text. */
export function mentionedUserIds(text: string, members: readonly PublicUser[]) {
  return members
    .filter((member) =>
      new RegExp(`(^|[^\\w.-])@${escape(member.username)}${boundary}`, "i").test(text),
    )
    .map((member) => member.id);
}

export type TextSegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; user: PublicUser }
  | { type: "link"; value: string };

/** Splits message text into plain runs, `@mentions` and links for rendering. */
export function segmentText(text: string, mentions: readonly PublicUser[]): TextSegment[] {
  const names = [...mentions]
    .sort((a, b) => b.username.length - a.username.length)
    .map((user) => escape(user.username));
  const pattern = new RegExp(
    [
      "(https?:\\/\\/[^\\s<]+[^\\s<.,:;\"')\\]!?])",
      ...(names.length ? [`(?<![\\w.-])@(${names.join("|")})${boundary}`] : []),
    ].join("|"),
    "gi",
  );
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of Array.from(text.matchAll(pattern))) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ type: "text", value: text.slice(last, index) });
    if (match[1]) segments.push({ type: "link", value: match[1] });
    else {
      const user = mentions.find(
        (item) => item.username.toLowerCase() === match[2].toLowerCase(),
      );
      if (user) segments.push({ type: "mention", value: match[0], user });
      else segments.push({ type: "text", value: match[0] });
    }
    last = index + match[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}
