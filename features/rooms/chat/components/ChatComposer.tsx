"use client";
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Clapperboard, CornerUpLeft, Pencil, SendHorizontal, Smile, Vote, X } from "lucide-react";
import { insertMention, mentionQueryAt, mentionedUserIds } from "@/lib/chat/mentions";
import { CHAT_LIMITS, type ChatMessage } from "@/types/chat";
import MoviePoster from "../../components/MoviePoster";
import { useChat } from "../ChatContext";
import { summarize } from "../format";
import ChatAvatar from "./ChatAvatar";
import EmojiPicker from "./EmojiPicker";
import MoviePicker, { type Attachment } from "./MoviePicker";

type ComposerMode = { type: "reply" | "edit"; message: ChatMessage } | null;
export type ComposerHandle = {
  focus: () => void;
  reply: (message: ChatMessage) => void;
  edit: (message: ChatMessage) => void;
};

const toolClass =
  "flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink";

export default forwardRef<
  ComposerHandle,
  {
    onOpenPoll: () => void;
    onSent: () => void;
    /** ArrowUp in an empty composer edits my latest message. */
    lastEditable?: ChatMessage;
  }
>(function ChatComposer({ onOpenPoll, onSent, lastEditable }, ref) {
  const { members, me, actions } = useChat();
  const input = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<ComposerMode>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [mention, setMention] = useState<{ query: string; start: number; index: number } | null>(null);
  // The unsent draft survives a detour into editing another message.
  const parkedDraft = useRef<string | null>(null);
  const editing = mode?.type === "edit";
  const others = Array.from(members.values()).filter((user) => user.id !== me.id);
  const candidates = mention
    ? others
        .filter((user) => user.username.toLowerCase().includes(mention.query.toLowerCase()))
        .sort(
          (a, b) =>
            Number(!a.username.toLowerCase().startsWith(mention.query.toLowerCase())) -
            Number(!b.username.toLowerCase().startsWith(mention.query.toLowerCase())),
        )
        .slice(0, 6)
    : [];

  function onModeChange(next: ComposerMode) {
    setMention(null);
    if (next?.type === "edit") {
      if (parkedDraft.current === null) parkedDraft.current = text;
      setText(next.message.text ?? "");
    } else if (parkedDraft.current !== null) {
      setText(parkedDraft.current);
      parkedDraft.current = null;
    }
    setMode(next);
  }
  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    reply: (message) => onModeChange({ type: "reply", message }),
    edit: (message) => onModeChange({ type: "edit", message }),
  }));

  useLayoutEffect(() => {
    const element = input.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [text]);
  useLayoutEffect(() => {
    if (mode) input.current?.focus();
  }, [mode]);

  function updateMention(value: string, caret: number) {
    const found = mentionQueryAt(value, caret);
    setMention(found ? { ...found, index: 0 } : null);
  }

  function pickMention(username: string) {
    const element = input.current;
    if (!element || !mention) return;
    const next = insertMention(text, mention.start, element.selectionStart, username);
    setText(next.text);
    setMention(null);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(next.caret, next.caret);
    });
  }

  function insertAtCaret(value: string) {
    const element = input.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${value}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + value.length, start + value.length);
    });
  }

  const trimmed = text.trim();
  const tooLong = text.length > CHAT_LIMITS.text;
  const canSend = !sending && !tooLong && (editing ? !!trimmed : !!trimmed || attachments.length > 0);

  async function submit() {
    if (!canSend) return;
    const ids = mentionedUserIds(trimmed, others);
    setSending(true);
    const done = editing
      ? await actions.edit(mode.message.id, { text: trimmed, mentionedUserIds: ids })
      : await actions.send({
          ...(trimmed ? { text: trimmed } : {}),
          ...(mode?.type === "reply" ? { replyToId: mode.message.id } : {}),
          ...(ids.length ? { mentionedUserIds: ids } : {}),
          ...(attachments.length ? { movies: attachments.map((item) => item.mention) } : {}),
        });
    setSending(false);
    if (!done) return;
    if (editing) onModeChange(null);
    else {
      setText("");
      setAttachments([]);
      onModeChange(null);
      onSent();
    }
    input.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && candidates.length) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setMention({ ...mention, index: (mention.index + step + candidates.length) % candidates.length });
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        pickMention(candidates[mention.index].username);
        return;
      }
    }
    if (event.key === "Escape") {
      if (mention) setMention(null);
      else if (mode) onModeChange(null);
      return;
    }
    if (event.key === "ArrowUp" && !text && !mode && lastEditable) {
      event.preventDefault();
      onModeChange({ type: "edit", message: lastEditable });
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-line bg-elevated px-3 pb-3 pt-2 sm:px-5">
      {mode && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
          {editing ? (
            <Pencil size={16} className="shrink-0 text-accent" aria-hidden="true" />
          ) : (
            <CornerUpLeft size={16} className="shrink-0 text-accent" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {editing
                ? "Editing your message"
                : `Replying to ${mode.message.author.id === me.id ? "yourself" : mode.message.author.username}`}
            </span>
            <span className="line-clamp-1 text-muted">{summarize(mode.message)}</span>
          </span>
          <button
            type="button"
            aria-label={editing ? "Cancel editing" : "Cancel reply"}
            onClick={() => onModeChange(null)}
            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!editing && attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((item) => (
            <span key={item.key} className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1 pl-1 pr-1.5 text-sm">
              <MoviePoster path={item.posterPath} size="w92" width={20} height={30} className="h-[30px] w-5 rounded-sm" />
              <span className="max-w-40 truncate font-medium">{item.title}</span>
              <button
                type="button"
                aria-label={`Remove ${item.title}`}
                onClick={() => setAttachments((current) => current.filter((entry) => entry.key !== item.key))}
                className="flex size-5 items-center justify-center rounded text-muted hover:text-ink"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative flex items-end gap-1 rounded-xl border border-line bg-surface p-1.5 transition-colors focus-within:border-muted">
        {mention && candidates.length > 0 && (
          <div
            role="listbox"
            aria-label="Mention someone"
            className="absolute bottom-full left-0 z-20 mb-2 w-64 overflow-hidden rounded-[10px] border border-line bg-elevated p-1 shadow-[0_18px_50px_rgb(0_0_0_/_18%)]"
          >
            {candidates.map((user, index) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={index === mention.index}
                onMouseDown={(event) => {
                  event.preventDefault();
                  pickMention(user.username);
                }}
                onMouseEnter={() => setMention({ ...mention, index })}
                className={clsx(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[15px]",
                  index === mention.index && "bg-surface",
                )}
              >
                <ChatAvatar user={user} className="size-6 shrink-0 text-xs font-semibold" />
                <span className="truncate font-medium">@{user.username}</span>
              </button>
            ))}
          </div>
        )}
        {!editing && (
          <>
            <MoviePicker
              selected={attachments}
              max={CHAT_LIMITS.movies}
              onToggle={(item) =>
                setAttachments((current) =>
                  current.some((entry) => entry.key === item.key)
                    ? current.filter((entry) => entry.key !== item.key)
                    : [...current, item].slice(0, CHAT_LIMITS.movies),
                )
              }
            >
              <button type="button" aria-label="Share a film" title="Share a film" className={toolClass}>
                <Clapperboard size={19} />
              </button>
            </MoviePicker>
            <Tooltip content="Start a poll" delay={400} closeDelay={0}>
              <button type="button" aria-label="Start a poll" className={toolClass} onClick={onOpenPoll}>
                <Vote size={19} />
              </button>
            </Tooltip>
          </>
        )}
        <EmojiPicker label="Insert an emoji" placement="top-start" onPick={insertAtCaret}>
          <button type="button" aria-label="Insert an emoji" className={clsx(toolClass, "max-sm:hidden")}>
            <Smile size={19} />
          </button>
        </EmojiPicker>
        <textarea
          ref={input}
          rows={1}
          value={text}
          aria-label={editing ? "Edit message" : "Message the room"}
          placeholder={mode?.type === "reply" ? "Write a reply..." : "Message the lobby..."}
          onChange={(event) => {
            setText(event.target.value);
            updateMention(event.target.value, event.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onClick={(event) => updateMention(text, event.currentTarget.selectionStart)}
          onBlur={() => setMention(null)}
          className="max-h-[180px] min-h-9 flex-1 resize-none bg-transparent px-1.5 py-[7px] text-[15px] leading-[22px] text-ink outline-none placeholder:text-muted"
        />
        <Button
          isIconOnly
          aria-label={editing ? "Save edit" : "Send message"}
          isDisabled={!canSend}
          isLoading={sending}
          onPress={submit}
          className="size-9 min-w-9 shrink-0 rounded-lg bg-ink text-canvas"
        >
          <SendHorizontal size={18} aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-1.5 flex justify-between gap-3 px-1 text-xs text-muted">
        <span className="max-sm:hidden">
          <kbd className="font-sans font-semibold">Enter</kbd> to send · <kbd className="font-sans font-semibold">Shift + Enter</kbd> for a new line · <kbd className="font-sans font-semibold">@</kbd> to mention
        </span>
        {text.length > CHAT_LIMITS.text - 200 && (
          <span className={clsx("ml-auto tabular-nums", tooLong && "font-semibold text-danger")}>
            {text.length}/{CHAT_LIMITS.text}
          </span>
        )}
      </div>
    </div>
  );
});
