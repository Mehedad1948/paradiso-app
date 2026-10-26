"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { useUnreadNotificationCount } from "@/hooks/queries/useNotificationQueries";
import { notificationKeys } from "@/lib/query/notification-keys";

const loadPanel = () => import("./NotificationPanel");
// The list and its mutations load on first hover or open, keeping the header light.
const NotificationPanel = dynamic(loadPanel, {
  ssr: false,
  loading: () => <div className="h-72 w-[min(420px,calc(100vw-24px))]" />,
});

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/** Mirrors the unread count on the installed app's icon, where the platform supports it. */
function useAppBadge(count: number | undefined) {
  useEffect(() => {
    if (count === undefined) return;
    const nav = navigator as BadgeNavigator;
    const update = count > 0 ? nav.setAppBadge?.(count) : nav.clearAppBadge?.();
    update?.catch(() => {});
  }, [count]);
}

export default function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const reduce = useReducedMotion();
  const [bell, animate] = useAnimate<HTMLSpanElement>();
  const { data: count } = useUnreadNotificationCount();
  const unread = count ?? 0;
  const previous = useRef<number | undefined>(undefined);
  useAppBadge(count);

  // Something new arrived: ring the bell and let any loaded list know it's behind.
  useEffect(() => {
    const before = previous.current;
    previous.current = count;
    if (before === undefined || count === undefined || count <= before) return;
    client.invalidateQueries({ queryKey: notificationKeys.lists });
    if (!reduce && bell.current)
      animate(bell.current, { rotate: [0, -18, 15, -11, 8, -4, 0] }, { duration: 0.8, ease: "easeInOut" });
  }, [count, client, reduce, animate, bell]);

  const close = useCallback(() => setOpen(false), []);
  const label = unread > 99 ? "99+" : String(unread);

  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      placement="bottom-end"
      offset={14}
      shouldBlockScroll={false}
      classNames={{
        content:
          "overflow-hidden rounded-[22px] border border-line bg-elevated p-0 text-ink shadow-[0_24px_70px_-12px_rgb(0_0_0_/_28%)]",
      }}
    >
      <PopoverTrigger>
        <button
          type="button"
          onPointerEnter={loadPanel}
          onFocus={loadPanel}
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          title="Notifications"
          className={clsx(
            "relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-transparent text-ink outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent max-[480px]:size-10",
            open && "bg-surface",
            className,
          )}
        >
          <span ref={bell} className="inline-flex origin-[50%_15%]">
            <Bell size={20} aria-hidden="true" strokeWidth={unread ? 2.25 : 2} />
          </span>
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                aria-hidden="true"
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={reduce ? { opacity: 0 } : { scale: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 26 }}
                className="absolute -right-1 -top-1 flex h-[20px] min-w-[20px] items-center justify-center overflow-hidden rounded-full bg-accent px-1.5 text-[11px] font-bold leading-none tabular-nums text-on-accent ring-[2.5px] ring-canvas"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={label}
                    initial={reduce ? false : { y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { y: 10, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {label}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent aria-labelledby="notifications-title">
        {open && <NotificationPanel unread={unread} onClose={close} />}
      </PopoverContent>
    </Popover>
  );
}
