"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { BellRing, CheckCheck } from "lucide-react";
import { Spinner } from "@heroui/spinner";
import {
  useMarkNotificationsRead,
  useNotificationInviteAction,
  useNotifications,
  useRemoveNotification,
} from "@/hooks/queries/useNotificationQueries";
import type { AppNotification, InlineAction } from "@/types/notifications";
import NotificationItem from "./components/NotificationItem";
import { sections } from "./describe";

type Filter = "all" | "unread";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

/** Loads the next page as the end of the list scrolls into view inside the panel. */
function Sentinel({ root, onVisible }: { root: React.RefObject<HTMLElement | null>; onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRef(onVisible);
  visible.current = onVisible;
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && visible.current(), {
      root: root.current,
      rootMargin: "240px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [root]);
  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

function Skeleton() {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-1 px-2 py-2">
      {[0, 1, 2, 3].map((index) => (
        <li key={index} className="flex animate-pulse gap-3 px-5 py-3" style={{ animationDelay: `${index * 120}ms` }}>
          <span className="size-11 shrink-0 rounded-full bg-surface" />
          <span className="flex flex-1 flex-col gap-2 pt-1">
            <span className="h-3 w-4/5 rounded-full bg-surface" />
            <span className="h-3 w-1/2 rounded-full bg-surface" />
            <span className="h-2.5 w-10 rounded-full bg-surface" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Empty({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center px-8 pb-12 pt-10 text-center">
      <span className="relative mb-5 flex size-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-accent/10" />
        <span className="absolute inset-3 rounded-full bg-accent/15" />
        <BellRing size={28} className="relative text-accent" aria-hidden="true" />
      </span>
      <p className="text-[15px] font-semibold text-ink">
        {filter === "unread" ? "You're all caught up" : "Nothing here yet"}
      </p>
      <p className="mt-1 max-w-[260px] text-sm font-normal text-muted">
        {filter === "unread"
          ? "New invites, mentions and reactions will show up here."
          : "When someone invites you, mentions you or reacts to your posts, you'll see it here."}
      </p>
    </div>
  );
}

export default function NotificationPanel({ unread, onClose }: { unread: number; onClose: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const reduce = useReducedMotion();
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const feed = useNotifications(filter);
  const markRead = useMarkNotificationsRead();
  const remove = useRemoveNotification();
  const invite = useNotificationInviteAction();

  const items = useMemo(() => feed.data?.pages.flatMap((page) => page.items) ?? [], [feed.data]);
  const grouped = useMemo(() => sections(items), [items]);

  const { mutate: read } = markRead;
  const { mutate: dismiss } = remove;
  const { mutate: answer } = invite;
  const onOpen = useCallback(
    (item: AppNotification) => {
      if (!item.read) read({ ids: [item.id] });
      onClose();
    },
    [read, onClose],
  );
  const onRemove = useCallback((item: AppNotification) => dismiss(item), [dismiss]);
  const onAction = useCallback(
    (item: AppNotification, action: InlineAction) =>
      answer(
        { item, action },
        {
          onSuccess: ({ roomId }) => {
            if (action !== "accept" || !roomId) return;
            onClose();
            router.push(`/rooms/${roomId}`);
          },
        },
      ),
    [answer, onClose, router],
  );
  const acting = invite.isPending ? invite.variables : undefined;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex max-h-[min(640px,calc(100svh-120px))] w-[min(420px,calc(100vw-24px))] flex-col">
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex items-baseline gap-2">
          <h2 id="notifications-title" className="text-lg font-semibold tracking-[-0.03em]">
            Notifications
          </h2>
          {unread > 0 && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
              {unread > 99 ? "99+" : unread} new
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => read({ all: true })}
          disabled={unread === 0}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-surface hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <CheckCheck size={16} aria-hidden="true" />
          Mark all read
        </button>
      </header>

      <div role="tablist" aria-label="Filter notifications" className="mx-5 mb-2 flex gap-1 rounded-full bg-surface p-1">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setFilter(key);
                scroller.current?.scrollTo({ top: 0 });
              }}
              className={clsx(
                "relative flex-1 rounded-full py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="notification-filter"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-full bg-elevated shadow-sm"
                />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      <div ref={scroller} role="tabpanel" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
        {feed.isPending ? (
          <Skeleton />
        ) : feed.isError && !items.length ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-8 py-10 text-center text-sm">
            <p className="text-muted">{feed.error.message}</p>
            <button
              type="button"
              onClick={() => feed.refetch()}
              className="rounded-full bg-ink px-4 py-1.5 font-semibold text-canvas transition-opacity hover:opacity-85"
            >
              Try again
            </button>
          </div>
        ) : !items.length ? (
          <Empty filter={filter} />
        ) : (
          <>
            {grouped.map((section) => (
              <section key={section.label} aria-label={section.label} className="px-2">
                <h3 className="sticky top-0 z-10 bg-elevated/90 px-5 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted backdrop-blur">
                  {section.label}
                </h3>
                <ul className="flex flex-col gap-0.5">
                  <AnimatePresence initial={false}>
                    {section.items.map((item) => (
                      <motion.li
                        key={item.id}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, x: 24 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <NotificationItem
                          item={item}
                          acting={acting?.item.id === item.id ? acting.action : undefined}
                          onOpen={onOpen}
                          onRemove={onRemove}
                          onAction={onAction}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
            {hasNextPage && <Sentinel root={scroller} onVisible={loadMore} />}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" aria-label="Loading more notifications" />
              </div>
            )}
            {!hasNextPage && items.length > 8 && (
              <p className="py-4 text-center text-xs font-semibold text-muted">That's everything</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
