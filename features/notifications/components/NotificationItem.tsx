"use client";
import { memo, type ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check, X } from "lucide-react";
import { Spinner } from "@heroui/spinner";
import UserAvatar from "@/components/ui/UserAvatar";
import { ago, fullDate } from "@/features/community/format";
import type { AppNotification, InlineAction } from "@/types/notifications";
import { describe, others, sentence } from "../describe";

type Props = {
  item: AppNotification;
  /** The inline action in flight for this item, if any. */
  acting?: InlineAction;
  onOpen: (item: AppNotification) => void;
  onRemove: (item: AppNotification) => void;
  onAction: (item: AppNotification, action: InlineAction) => void;
};

function NotificationItem({ item, acting, onOpen, onRemove, onAction }: Props) {
  const view = describe(item);
  const Icon = view.icon;
  const actions = view.actions;
  const busy = !!acting;
  const row = clsx(
    "relative flex w-full items-start gap-3 rounded-2xl py-3 pl-5 pr-10 text-left outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
    item.read ? "hover:bg-surface/70" : "bg-accent/[0.06] hover:bg-accent/10",
  );

  const body: ReactNode = (
    <>
      {!item.read && (
        <span aria-hidden="true" className="absolute left-1.5 top-1/2 size-2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_3px_hsl(var(--heroui-primary-500)/0.18)]" />
      )}

      <span className="relative mt-0.5 shrink-0">
        {item.actorCount > 1 && (
          // A second ring behind the face hints that more than one person is behind this.
          <span aria-hidden="true" className="absolute -right-1.5 -top-1 size-11 rounded-full border border-line bg-surface" />
        )}
        <UserAvatar name={item.actor.username} src={item.actor.avatarUrl} size={44} alt="" className="relative" />
        <span
          aria-hidden="true"
          className={clsx(
            "absolute -bottom-1 -right-1 flex size-[22px] items-center justify-center rounded-full text-white ring-[2.5px] ring-elevated",
            view.tone,
          )}
        >
          <Icon size={12} strokeWidth={2.6} />
        </span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-[14px] font-normal leading-snug text-ink/80">
          <span className="font-semibold text-ink">{item.actor.username}</span>
          {others(item.actorCount)} {view.verb}
          {view.target && <span className="font-semibold text-ink"> {view.target}</span>}
        </span>
        {view.excerpt && (
          <span className="line-clamp-1 border-l-2 border-line pl-2 text-[13px] font-normal text-muted">
            {view.excerpt}
          </span>
        )}
        <time
          dateTime={item.updatedAt}
          title={fullDate(item.updatedAt)}
          className={clsx("text-xs font-semibold", item.read ? "text-muted" : "text-accent")}
        >
          {ago(item.updatedAt)}
        </time>
        {actions && (
          <span className="mt-1.5 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(item, actions.primary.action)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-canvas transition-opacity hover:opacity-85 disabled:opacity-60"
            >
              {acting === actions.primary.action ? (
                <Spinner size="sm" color="current" classNames={{ wrapper: "size-3.5" }} />
              ) : (
                <Check size={14} aria-hidden="true" />
              )}
              {actions.primary.label}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(item, actions.secondary.action)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-60"
            >
              {acting === actions.secondary.action && (
                <Spinner size="sm" color="current" classNames={{ wrapper: "size-3.5" }} />
              )}
              {actions.secondary.label}
            </button>
          </span>
        )}
      </span>

      {view.thumbnail && (
        <img
          src={view.thumbnail.src}
          alt=""
          loading="lazy"
          decoding="async"
          className={clsx(
            "mt-0.5 shrink-0 border border-line object-cover",
            view.thumbnail.shape === "poster" ? "h-[60px] w-10 rounded-md" : "size-11 rounded-xl",
          )}
        />
      )}
    </>
  );

  return (
    <div className="group relative">
      {view.href && !actions ? (
        <Link href={view.href} onClick={() => onOpen(item)} aria-label={sentence(item)} className={row}>
          {body}
        </Link>
      ) : (
        <div className={row}>{body}</div>
      )}
      {!actions && (
        <button
          type="button"
          onClick={() => onRemove(item)}
          aria-label="Dismiss notification"
          title="Dismiss"
          className="absolute right-2 top-2.5 rounded-full p-1.5 text-muted outline-none transition-[opacity,color,background-color] hover:bg-surface hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default memo(NotificationItem);
