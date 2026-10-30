"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addToast } from "@/components/ui/toast";
import { chatApi } from "@/lib/api/chat";
import { BffError } from "@/lib/api/client";
import {
  initialCursor,
  mergeMessages,
  sortedMessages,
  syncDelay,
  type MergeSource,
} from "@/lib/chat/timeline";
import type { ChatMessage } from "@/types/chat";

type Status = "loading" | "ready" | "error";
const aborted = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

/**
 * Local message store for one room. History pages extend it backwards and a
 * visibility-aware sync loop keeps it current; every write is an upsert by id.
 */
export function useChatTimeline(
  roomId: string,
  { onMessages }: { onMessages?: (messages: ChatMessage[]) => void } = {},
) {
  const store = useRef(new Map<number, ChatMessage>());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // In-flight optimistic versions; the server response replaces them.
  const [overlays, setOverlays] = useState(() => new Map<number, ChatMessage>());
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const olderCursor = useRef<number | null>(null);
  const loadingOlderRef = useRef(false);
  const syncCursor = useRef<string | null>(null);
  const wake = useRef<() => void>(() => {});
  const observer = useRef(onMessages);
  useEffect(() => {
    observer.current = onMessages;
  }, [onMessages]);

  const upsert = useCallback(
    (incoming: ChatMessage[], source: MergeSource = "mutation") => {
      if (!incoming.length) return false;
      observer.current?.(incoming);
      const changed = mergeMessages(
        store.current,
        incoming,
        source,
        olderCursor.current === null,
      );
      if (changed) setMessages(sortedMessages(store.current));
      return changed;
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const loadedAt = Date.now();
    chatApi
      .messages(roomId, {}, controller.signal)
      .then((page) => {
        store.current = new Map();
        olderCursor.current = page.nextCursor;
        setHasOlder(page.nextCursor !== null);
        syncCursor.current = initialCursor(page.data, loadedAt);
        upsert(page.data, "history");
        setMessages(sortedMessages(store.current));
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (aborted(reason)) return;
        setError(reason instanceof Error ? reason : new Error("Chat failed to load"));
        setStatus("error");
      });
    return () => controller.abort();
  }, [roomId, attempt, upsert]);

  useEffect(() => {
    if (status !== "ready") return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle = 0;
    let running = false;
    const visible = () => document.visibilityState === "visible";
    const schedule = (delay = syncDelay(idle)) => {
      clearTimeout(timer);
      if (!controller.signal.aborted && visible()) timer = setTimeout(tick, delay);
    };
    async function tick() {
      if (running || !syncCursor.current) return;
      running = true;
      try {
        let changed = false;
        for (let round = 0; round < 10; round++) {
          const page = await chatApi.sync(roomId, syncCursor.current, controller.signal);
          syncCursor.current = page.cursor;
          if (upsert(page.data, "sync")) changed = true;
          if (!page.hasMore) break;
        }
        idle = changed ? 0 : idle + 1;
      } catch (reason) {
        if (aborted(reason)) return;
        // Losing access ends the session; anything else just slows the loop.
        if (reason instanceof BffError && (reason.status === 401 || reason.status === 403)) {
          setError(reason);
          setStatus("error");
          return;
        }
        idle += 1;
      } finally {
        running = false;
      }
      schedule();
    }
    const resume = () => {
      if (!visible()) return clearTimeout(timer);
      idle = 0;
      schedule(0);
    };
    wake.current = () => {
      idle = 0;
      schedule();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    schedule();
    return () => {
      controller.abort();
      clearTimeout(timer);
      wake.current = () => {};
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
    };
  }, [roomId, status, upsert]);

  const loadOlder = useCallback(
    async (limit = 30) => {
      const before = olderCursor.current;
      if (before === null || loadingOlderRef.current) return false;
      loadingOlderRef.current = true;
      setLoadingOlder(true);
      try {
        const page = await chatApi.messages(roomId, { before, limit });
        olderCursor.current = page.nextCursor;
        setHasOlder(page.nextCursor !== null);
        upsert(page.data, "history");
        return true;
      } catch (reason) {
        addToast({
          title: reason instanceof Error ? reason.message : "Couldn't load older messages",
          color: "danger",
        });
        return false;
      } finally {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      }
    },
    [roomId, upsert],
  );

  /** Pages back until `id` is loaded, so a reply quote can scroll to it. */
  const reveal = useCallback(
    async (id: number) => {
      for (let round = 0; round < 20 && !store.current.has(id); round++)
        if (!(await loadOlder(100))) break;
      return store.current.has(id);
    },
    [loadOlder],
  );

  const setOverlay = useCallback((message: ChatMessage | null, id?: number) => {
    setOverlays((current) => {
      const next = new Map(current);
      if (message) next.set(message.id, message);
      else if (id !== undefined) next.delete(id);
      return next;
    });
  }, []);

  const visibleMessages = useMemo(
    () =>
      overlays.size
        ? messages.map((message) => overlays.get(message.id) ?? message)
        : messages,
    [messages, overlays],
  );
  const get = useCallback(
    (id: number) => overlays.get(id) ?? store.current.get(id),
    [overlays],
  );
  const retry = useCallback(() => {
    setError(null);
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);
  const nudge = useCallback(() => wake.current(), []);

  return {
    messages: visibleMessages,
    status,
    error,
    retry,
    hasOlder,
    loadingOlder,
    loadOlder,
    reveal,
    upsert,
    setOverlay,
    get,
    nudge,
  };
}

export type ChatTimeline = ReturnType<typeof useChatTimeline>;
