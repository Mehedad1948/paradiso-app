"use client";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarGroup } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { ArrowDown, Clapperboard, Vote, X } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import { useChatPinned, useChatUnread } from "@/hooks/queries/useChatQueries";
import { chatApi } from "@/lib/api/chat";
import type { PanelRoom } from "@/lib/api/panel";
import { patchPinned } from "@/lib/chat/timeline";
import { panelKeys } from "@/lib/query/panel-keys";
import type { ChatMessage, ChatUnread, PublicUser } from "@/types/chat";
import type { User } from "@/types/user";
import { ChatContext, type ChatContextValue, type RoomMovie } from "./ChatContext";
import { useChatTimeline } from "./hooks/useChatTimeline";
import { useChatActions } from "./hooks/useChatActions";
import { useDocumentVisible } from "./hooks/useDocumentVisible";
import { continues, dayLabel, sameDay } from "./format";
import ChatMessageItem from "./components/ChatMessageItem";
import ChatPinnedBar from "./components/ChatPinnedBar";
import ChatComposer, { type ComposerHandle } from "./components/ChatComposer";
import PollComposerDialog from "./components/PollComposerDialog";
import DeleteMessageDialog from "./components/DeleteMessageDialog";
import ChatAvatar from "./components/ChatAvatar";
import { wallpaperGlow } from "../lib/wallpaper";

// Film-base perforations along the top edge of the lobby.
const sprockets =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='10'%3E%3Crect x='5' y='2.5' width='8' height='5' rx='1.5' fill='%23f0f1f3' fill-opacity='.8'/%3E%3C/svg%3E\")";

// The spotlight wash sits under a tiled cinema doodle, in the spirit of Telegram's chat wallpapers.
const doodles = {
  maskImage: "url(/patterns/lobby-doodles.svg)",
  WebkitMaskImage: "url(/patterns/lobby-doodles.svg)",
  maskSize: "360px 360px",
  WebkitMaskSize: "360px 360px",
} as const;

function Divider({ label, tone = "muted" }: { label: string; tone?: "muted" | "new" }) {
  return (
    <div
      role="separator"
      aria-label={label}
      className="flex items-center gap-3 px-4 pb-1 pt-6 sm:px-6"
    >
      {tone === "new" && <span className="h-px flex-1 bg-danger/40" />}
      <span
        className={clsx(
          "mx-auto rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm backdrop-blur",
          tone === "new"
            ? "border-danger/30 bg-elevated/90 text-danger"
            : "border-line/70 bg-elevated/85 text-muted",
        )}
      >
        {label}
      </span>
      {tone === "new" && <span className="h-px flex-1 bg-danger/40" />}
    </div>
  );
}

export default function RoomChat({
  room,
  me,
  onClose,
  onShowInWatchlist,
}: {
  room: PanelRoom;
  me: User;
  onClose: () => void;
  onShowInWatchlist: (title: string) => void;
}) {
  const roomId = String(room.id);
  const queryClient = useQueryClient();
  const visible = useDocumentVisible();
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const [unseen, setUnseen] = useState(0);
  const [poll, setPoll] = useState<"blank" | "watch" | null>(null);
  const [deleting, setDeleting] = useState<ChatMessage | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [pendingJump, setPendingJump] = useState<number | null>(null);

  const members = useMemo(() => {
    const map = new Map<number, PublicUser>();
    map.set(room.owner.id, room.owner);
    room.users.forEach((user) => map.set(user.id, user));
    return map;
  }, [room.owner, room.users]);
  const roomMovies = useMemo(
    () => new Map<string, RoomMovie>(room.movies.map((movie) => [movie.id, movie])),
    [room.movies],
  );

  const onMessages = useCallback(
    (incoming: ChatMessage[]) =>
      queryClient.setQueryData<{ data: ChatMessage[] }>(panelKeys.chatPinned(roomId), (current) => {
        if (!current) return current;
        const data = patchPinned(current.data, incoming);
        return data === current.data ? current : { ...current, data };
      }),
    [queryClient, roomId],
  );
  const timeline = useChatTimeline(roomId, { onMessages });
  const { messages, status, hasOlder, loadingOlder, loadOlder, reveal } = timeline;
  const actions = useChatActions(roomId, timeline, me.id);
  const pinned = useChatPinned(roomId);
  const unread = useChatUnread(roomId, { live: true });

  const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const latest = messages[messages.length - 1];
  const lastEditable = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index];
      if (message.author.id === me.id && !message.deletedAt && !message.poll) return message;
    }
  }, [messages, me.id]);

  // "New" divider: where my unread messages started when the lobby opened.
  const [readBoundary, setReadBoundary] = useState<number | null>(null);
  const boundarySet = useRef(false);
  useEffect(() => {
    if (boundarySet.current || status !== "ready" || !unread.data) return;
    boundarySet.current = true;
    setReadBoundary(unread.data.lastReadMessageId);
  }, [status, unread.data]);
  const firstUnreadId = useMemo(
    () =>
      readBoundary === null
        ? undefined
        : messages.find((message) => message.id > readBoundary && message.author.id !== me.id)?.id,
    [messages, readBoundary, me.id],
  );

  // Keep the reader's place: stick to the bottom, hold position when older pages load.
  const previous = useRef({ first: 0, last: 0, height: 0 });
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const first = messages[0]?.id ?? 0;
    const last = latest?.id ?? 0;
    const before = previous.current;
    if (!before.last || atBottomRef.current) element.scrollTop = element.scrollHeight;
    else if (first < before.first) element.scrollTop += element.scrollHeight - before.height;
    else if (last > before.last) {
      const fresh = messages.filter((message) => message.id > before.last);
      if (fresh.some((message) => message.author.id === me.id)) element.scrollTop = element.scrollHeight;
      else setUnseen((count) => count + fresh.length);
    }
    previous.current = { first, last, height: element.scrollHeight };
  }, [messages, latest, me.id]);

  // The pinned bar, a growing composer or late images resize the view; stay at the bottom.
  useEffect(() => {
    const element = scroller.current;
    if (status !== "ready" || !element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, [status]);

  const onScroll = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    const bottom = element.scrollHeight - element.scrollTop - element.clientHeight < 72;
    if (bottom !== atBottomRef.current) {
      atBottomRef.current = bottom;
      setAtBottom(bottom);
    }
    if (bottom) setUnseen(0);
    if (element.scrollTop < 240 && hasOlder && !loadingOlder) loadOlder();
  }, [hasOlder, loadingOlder, loadOlder]);

  // A short first page cannot scroll, so fetch until it can.
  useEffect(() => {
    const element = scroller.current;
    if (status === "ready" && element && hasOlder && !loadingOlder && element.scrollHeight <= element.clientHeight + 8)
      loadOlder();
  }, [status, messages, hasOlder, loadingOlder, loadOlder]);

  const scrollToBottom = useCallback((smooth = true) => {
    const element = scroller.current;
    if (!element) return;
    atBottomRef.current = true;
    setAtBottom(true);
    setUnseen(0);
    element.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Mark read once the newest message has actually been on screen.
  const readUpTo = useRef(0);
  useEffect(() => {
    const lastRead = unread.data?.lastReadMessageId ?? 0;
    if (!visible || !atBottom || !latest || latest.id <= Math.max(lastRead, readUpTo.current)) return;
    const id = latest.id;
    const timer = setTimeout(() => {
      readUpTo.current = id;
      chatApi
        .markRead(roomId, id)
        .then((data) => queryClient.setQueryData<ChatUnread>(panelKeys.chatUnread(roomId), data))
        .catch(() => {
          readUpTo.current = 0;
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [visible, atBottom, latest, unread.data, roomId, queryClient]);

  const jumpTo = useCallback(
    async (id: number) => {
      if (!(await reveal(id)))
        return addToast({ title: "That message is too far back to find", color: "default" });
      setPendingJump(id);
    },
    [reveal],
  );
  useEffect(() => {
    if (pendingJump === null) return;
    const element = scroller.current?.querySelector(`[data-message-id="${pendingJump}"]`);
    if (!element) return;
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlighted(pendingJump);
    setPendingJump(null);
    const timer = setTimeout(() => setHighlighted(null), 1800);
    return () => clearTimeout(timer);
  }, [pendingJump, messages]);

  const context = useMemo<ChatContextValue>(
    () => ({
      roomId,
      me,
      ownerId: room.owner.id,
      isOwner: room.owner.id === me.id,
      members,
      roomMovies,
      actions,
      reply: (message) => composer.current?.reply(message),
      edit: (message) => composer.current?.edit(message),
      requestDelete: setDeleting,
      jumpTo,
      showInWatchlist: onShowInWatchlist,
    }),
    [roomId, me, room.owner.id, members, roomMovies, actions, jumpTo, onShowInWatchlist],
  );

  const people = Array.from(members.values());
  const pinnedMessages = pinned.data?.data ?? [];

  return (
    <ChatContext.Provider value={context}>
      <section
        aria-label="Room chat"
        className="flex h-full flex-col overflow-hidden bg-elevated"
      >
        <div aria-hidden="true" className="h-2.5 shrink-0 bg-media" style={{ backgroundImage: sprockets }} />
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line py-3.5 pl-4 pr-3 sm:pl-6 sm:pr-4">
          <div className="min-w-0">
            <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.04em]">
              The <em className="font-serif font-normal">lobby</em>
            </h2>
            <p className="truncate text-sm text-muted">Talk it over before the lights go down.</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted"
              title={visible ? "Updating every few seconds" : "Paused while this tab is hidden"}
            >
              <span className="relative flex size-2">
                {visible && status === "ready" && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                )}
                <span className={clsx("relative inline-flex size-2 rounded-full", visible && status === "ready" ? "bg-success" : "bg-muted")} />
              </span>
              {visible ? "Live" : "Paused"}
            </span>
            <AvatarGroup max={4} size="sm" className="max-sm:hidden" aria-label={`${people.length} people in the room`}>
              {people.map((person) => (
                <ChatAvatar key={person.id} user={person} className="text-sm font-semibold ring-2 ring-elevated" />
              ))}
            </AvatarGroup>
            <button
              type="button"
              aria-label="Close the lobby"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        {status === "ready" && <ChatPinnedBar pinned={pinnedMessages} />}
        <div className="relative min-h-0 flex-1 bg-canvas" style={{ backgroundImage: wallpaperGlow() }}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-ink opacity-[0.07] dark:opacity-[0.06]"
            style={doodles}
          />
          <div
            ref={scroller}
            onScroll={onScroll}
            aria-live="polite"
            aria-relevant="additions"
            className="absolute inset-0 overflow-y-auto overscroll-contain pb-5 [overflow-anchor:none]"
          >
            {status === "loading" && (
              <div className="flex h-full items-center justify-center">
                <Spinner label="Opening the lobby" />
              </div>
            )}
            {status === "error" && timeline.error && (
              <div className="p-6">
                <QueryError error={timeline.error} retry={timeline.retry} />
              </div>
            )}
            {status === "ready" && (
              <div ref={content} className={clsx(messages.length === 0 && "h-full")}>
                {loadingOlder && (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" label="Loading earlier messages" classNames={{ label: "text-sm text-muted" }} />
                  </div>
                )}
                {!hasOlder && messages.length > 0 && (
                  <div className="px-6 pb-2 pt-10 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Opening credits</p>
                    <p className="mt-2 break-words font-serif text-[clamp(26px,3vw,36px)] italic leading-tight">{room.name}</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                      This is the very beginning of the lobby. Only members of the room can read it.
                    </p>
                  </div>
                )}
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">House lights up</p>
                      <p className="mt-3 font-serif text-[clamp(30px,3.6vw,44px)] italic leading-tight">
                        The lobby is quiet.
                      </p>
                      <p className="mx-auto mt-3 max-w-md text-base text-muted">
                        Say hello, share a film you can&apos;t stop thinking about, or settle tonight&apos;s pick with a vote.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {roomMovies.size > 1 && (
                        <Button
                          className="min-h-[46px] rounded-md bg-ink text-[15px] font-semibold text-canvas"
                          startContent={<Vote size={18} aria-hidden="true" />}
                          onPress={() => setPoll("watch")}
                        >
                          What do we watch?
                        </Button>
                      )}
                      <Button
                        className="min-h-[46px] rounded-md border border-line bg-surface text-[15px] font-semibold text-ink"
                        startContent={<Clapperboard size={18} aria-hidden="true" />}
                        onPress={() => composer.current?.focus()}
                      >
                        Say hello
                      </Button>
                    </div>
                  </div>
                )}
                {messages.map((message, index) => {
                  const prior = messages[index - 1];
                  const newDay = !prior || !sameDay(prior.createdAt, message.createdAt);
                  const isFirstUnread = message.id === firstUnreadId;
                  return (
                    <Fragment key={message.id}>
                      {newDay && <Divider label={dayLabel(message.createdAt)} />}
                      {isFirstUnread && <Divider label="New messages" tone="new" />}
                      <ChatMessageItem
                        message={message}
                        original={message.replyTo ? byId.get(message.replyTo.id) : undefined}
                        continued={!newDay && !isFirstUnread && continues(prior, message)}
                        highlighted={highlighted === message.id}
                      />
                    </Fragment>
                  );
                })}
              </div>
            )}
          </div>
          {status === "ready" && !atBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className={clsx(
                "absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_10px_30px_rgb(0_0_0_/_18%)] transition-colors",
                unseen ? "border-transparent bg-ink text-canvas" : "border-line bg-elevated text-ink",
              )}
            >
              <ArrowDown size={16} aria-hidden="true" />
              {unseen ? `${unseen} new ${unseen === 1 ? "message" : "messages"}` : "Back to now"}
            </button>
          )}
        </div>
        {status === "ready" && (
          <ChatComposer
            ref={composer}
            onOpenPoll={() => setPoll("blank")}
            onSent={() => scrollToBottom(false)}
            lastEditable={lastEditable}
          />
        )}
      </section>
      {poll && (
        <PollComposerDialog
          preset={poll === "watch" ? "watch" : undefined}
          onClose={() => setPoll(null)}
          onSent={() => {
            setPoll(null);
            scrollToBottom(false);
          }}
        />
      )}
      {deleting && <DeleteMessageDialog message={deleting} onClose={() => setDeleting(null)} />}
    </ChatContext.Provider>
  );
}
