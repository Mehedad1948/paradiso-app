"use client";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Tooltip } from "@heroui/tooltip";
import { Spinner } from "@heroui/spinner";
import { ArrowRightIcon, EyeClosedIcon, PenIcon, ShieldCrossIcon, StarsMinimalisticIcon, TrashBinMinimalisticIcon } from "@solar-icons/react/linear";
import QueryError from "@/components/ui/QueryError";
import UserAvatar from "@/components/ui/UserAvatar";
import { useMe } from "@/hooks/queries/useMe";
import {
  useCreateMovieComment,
  useDeleteMovieComment,
  useEditMovieComment,
  useMovieComments,
} from "@/hooks/queries/useMovieQueries";
import { commentTextError } from "@/lib/community/validation";
import { COMMUNITY_LIMITS } from "@/types/community";
import type { MovieComment, MovieCommentInput } from "@/types/movies";
import { ago, fullDate, isEdited, plural, profileHref } from "@/features/community/format";
import ConfirmDialog from "@/features/community/components/ConfirmDialog";
import SignInLink from "@/features/community/components/SignInLink";

const LIMIT = COMMUNITY_LIMITS.comment;

/** A ring that fills as the comment nears its limit; the count appears once it's close. */
function LengthMeter({ length }: { length: number }) {
  const ratio = Math.min(length / LIMIT, 1);
  if (ratio < 0.7) return null;
  const over = length > LIMIT;
  const circumference = 2 * Math.PI * 8;
  return (
    <span className={clsx("flex items-center gap-1.5 text-xs font-semibold tabular-nums", over ? "text-danger" : "text-muted")}>
      <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5" className="stroke-line" />
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={clsx("transition-[stroke-dashoffset] duration-300", over ? "stroke-danger" : ratio > 0.9 ? "stroke-warning" : "stroke-accent")}
        />
      </svg>
      {LIMIT - length}
    </span>
  );
}

function SpoilerToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      title="Hide the text until readers choose to see it"
      className={clsx(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors",
        on
          ? "border-warning/40 bg-warning/15 text-warning-600 dark:text-warning-400"
          : "border-line text-muted hover:bg-surface hover:text-ink",
      )}
    >
      <EyeClosedIcon size={14} aria-hidden="true" />
      {on ? "Marked as spoiler" : "Spoiler"}
    </button>
  );
}

/** Writing a new comment or editing one: grows with the text, ⌘/Ctrl+Enter sends, Escape cancels. */
function CommentEditor({
  initial = { text: "", spoiler: false },
  placeholder,
  submitLabel,
  busy,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  initial?: MovieCommentInput;
  placeholder: string;
  submitLabel: string;
  busy?: boolean;
  autoFocus?: boolean;
  /** `restore` puts the draft back if sending fails. */
  onSubmit: (input: Required<MovieCommentInput>, restore: (input: Required<MovieCommentInput>) => void) => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState(initial.text);
  const [spoiler, setSpoiler] = useState(!!initial.spoiler);
  const [focused, setFocused] = useState(!!autoFocus);
  const length = text.trim().length;
  const error = commentTextError(text);
  const unchanged = text.trim() === initial.text.trim() && spoiler === !!initial.spoiler;
  const open = focused || !!text || !!onCancel;

  function submit() {
    if (error || busy || (onCancel && unchanged)) return;
    const draft = { text: text.trim(), spoiler };
    onSubmit(draft, (back) => {
      setText(back.text);
      setSpoiler(back.spoiler);
    });
    if (!onCancel) {
      setText("");
      setSpoiler(false);
    }
  }

  function keys(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
    if (event.key === "Escape" && onCancel) {
      // Keep the dialog around the comments open.
      event.stopPropagation();
      onCancel();
    }
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border bg-surface/40 transition-[border-color,box-shadow,background-color] duration-300",
        focused ? "border-accent/50 bg-elevated shadow-[0_0_0_4px_hsl(var(--heroui-primary-500)/0.12)]" : "border-line",
      )}
    >
      <textarea
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        rows={1}
        maxLength={LIMIT + 200}
        onChange={(event) => setText(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={keys}
        className="block max-h-60 min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-[1.6] text-ink outline-none placeholder:text-muted [field-sizing:content]"
      />
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 pb-3">
              <SpoilerToggle on={spoiler} onToggle={() => setSpoiler((value) => !value)} />
              <span className="ml-auto" />
              <LengthMeter length={length} />
              <kbd className="hidden text-xs text-muted/80 [@media(hover:hover)]:inline">⌘↵</kbd>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-9 rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                // Keep focus in the box so a quick follow-up doesn't collapse it.
                onMouseDown={(event) => event.preventDefault()}
                onClick={submit}
                disabled={!!error || busy || (!!onCancel && unchanged)}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-canvas transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy && <Spinner size="sm" color="current" />}
                {submitLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Spoilers stay blurred until the reader asks; comments past six lines fold. */
function CommentText({ comment, mine }: { comment: MovieComment; mine: boolean }) {
  const [revealed, setRevealed] = useState(mine);
  const [expanded, setExpanded] = useState(false);
  const [long, setLong] = useState(false);
  const body = useRef<HTMLParagraphElement>(null);
  const hidden = comment.spoiler && !revealed;

  // Measured while folded, so "Read more" only shows when there really is more.
  useEffect(() => {
    const text = body.current;
    if (!text || expanded) return;
    const measure = () => setLong(text.scrollHeight > text.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    return () => observer.disconnect();
  }, [comment.text, expanded]);

  return (
    <div className="relative mt-1">
      <p
        ref={body}
        aria-hidden={hidden}
        className={clsx(
          "whitespace-pre-wrap break-words text-[15px] leading-[1.65] text-ink/90 transition-[filter,opacity] duration-500",
          hidden && "pointer-events-none select-none opacity-70 blur-[7px]",
          !expanded && "line-clamp-6",
        )}
      >
        {comment.text}
      </p>
      {hidden && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="group/reveal absolute inset-0 flex items-center justify-center rounded-xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-elevated/85 px-3.5 py-1.5 text-[13px] font-semibold text-ink shadow-lg backdrop-blur-md transition-transform group-hover/reveal:scale-[1.04]">
            <EyeClosedIcon size={14} className="text-warning" aria-hidden="true" />
            Spoiler · tap to reveal
          </span>
        </button>
      )}
      {(long || expanded) && !hidden && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-sm font-semibold text-accent hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

const iconButton =
  "inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors";

function CommentItem({
  comment,
  movieId,
  meId,
  admin,
}: {
  comment: MovieComment;
  movieId: string;
  meId?: number;
  admin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const edit = useEditMovieComment(movieId);
  const remove = useDeleteMovieComment(movieId);
  const reduce = useReducedMotion();
  const pending = comment.id < 0;
  const mine = comment.author.id === meId;
  const canDelete = !pending && (mine || admin);

  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24, transition: { duration: 0.22 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={clsx("group/comment grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 py-4", pending && "opacity-60")}
    >
      <UserAvatar name={comment.author.username} src={comment.author.avatar} size={36} href={profileHref(comment.author.id)} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5 text-[14px] leading-snug">
          <Link href={profileHref(comment.author.id)} className="truncate font-semibold hover:underline">
            {comment.author.username}
          </Link>
          {mine && <span className="shrink-0 rounded-full bg-accent/10 px-2 text-[11px] font-semibold text-accent">You</span>}
          <span aria-hidden="true" className="text-muted">·</span>
          {pending ? (
            <span className="shrink-0 text-muted">Posting…</span>
          ) : (
            <Tooltip content={fullDate(comment.createdAt)} delay={500} closeDelay={0} size="sm">
              <time dateTime={comment.createdAt} className="shrink-0 text-muted">
                {ago(comment.createdAt)}
              </time>
            </Tooltip>
          )}
          {isEdited(comment) && <span className="shrink-0 text-xs text-muted/80">· edited</span>}
          {comment.spoiler && !editing && (
            <span className="shrink-0 rounded-full bg-warning/15 px-2 text-[11px] font-semibold text-warning-600 dark:text-warning-400">
              Spoiler
            </span>
          )}
          {!editing && (mine || canDelete) && !pending && (
            <span className="ml-auto flex shrink-0 items-center gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/comment:opacity-100 [@media(hover:hover)]:group-hover/comment:opacity-100">
              {mine && (
                <button type="button" aria-label="Edit comment" title="Edit" onClick={() => setEditing(true)} className={clsx(iconButton, "hover:bg-surface hover:text-ink")}>
                  <PenIcon size={15} aria-hidden="true" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  aria-label={mine ? "Delete comment" : "Remove comment as a moderator"}
                  title={mine ? "Delete" : "Remove (moderation)"}
                  onClick={() => setConfirming(true)}
                  className={clsx(iconButton, "hover:bg-danger/10 hover:text-danger")}
                >
                  {mine ? <TrashBinMinimalisticIcon size={15} aria-hidden="true" /> : <ShieldCrossIcon size={15} aria-hidden="true" />}
                </button>
              )}
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-2">
            <CommentEditor
              initial={{ text: comment.text, spoiler: comment.spoiler }}
              placeholder="Edit your comment"
              submitLabel="Save"
              autoFocus
              busy={edit.isPending}
              onCancel={() => setEditing(false)}
              onSubmit={(input) => {
                setEditing(false);
                edit.mutate({ commentId: comment.id, ...input }, { onError: () => setEditing(true) });
              }}
            />
          </div>
        ) : (
          <CommentText comment={comment} mine={mine} />
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title={mine ? "Delete your comment?" : "Remove this comment?"}
          confirmLabel={mine ? "Delete" : "Remove"}
          busy={remove.isPending}
          onClose={() => setConfirming(false)}
          onConfirm={() => remove.mutate(comment.id, { onSuccess: () => setConfirming(false) })}
        >
          <p className="line-clamp-3 rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-muted">{comment.text}</p>
          <p className="text-sm text-muted">
            {mine ? "This can't be undone." : `It was written by ${comment.author.username}. This can't be undone.`}
          </p>
        </ConfirmDialog>
      )}
    </motion.li>
  );
}

function CommentSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 py-4">
      <span className="size-9 rounded-full bg-surface motion-safe:animate-pulse" />
      <span className="space-y-2.5 pt-1">
        <span className="block h-3.5 w-32 rounded-full bg-surface motion-safe:animate-pulse" />
        <span className="block h-3.5 w-full rounded-full bg-surface motion-safe:animate-pulse" />
        <span className="block h-3.5 w-2/3 rounded-full bg-surface motion-safe:animate-pulse" />
      </span>
    </div>
  );
}

/** What people thought of the film: a flat conversation, newest first, with spoilers kept under wraps. */
export default function MovieComments({ movieId, title }: { movieId: string; title: string }) {
  const headingId = useId();
  const viewer = useMe();
  const me = viewer.data;
  const admin = me?.role === "admin";
  const comments = useMovieComments(movieId);
  const create = useCreateMovieComment(movieId);
  const list = useMemo(() => comments.data?.pages.flatMap((page) => page.data) ?? [], [comments.data]);
  const total = comments.data?.pages[0]?.total ?? 0;
  const remaining = Math.max(0, total - list.length);

  return (
    <section id="comments" aria-labelledby={headingId} className="mt-12 scroll-mt-6">
      <div className="mb-4 flex items-baseline gap-2.5">
        <h3 id={headingId} className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
          Conversation
        </h3>
        {total > 0 && (
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-ink/80">
            {total.toLocaleString()}
          </span>
        )}
      </div>

      {viewer.isPending ? (
        <div aria-hidden="true" className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3">
          <span className="size-9 rounded-full bg-surface motion-safe:animate-pulse" />
          <span className="h-[54px] rounded-2xl border border-line bg-surface/40" />
        </div>
      ) : me ? (
        <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3">
          <UserAvatar name={me.username} src={me.avatar} size={36} />
          <CommentEditor
            placeholder="Add a comment…"
            submitLabel="Post"
            onSubmit={(input, restore) => create.mutate(input, { onError: () => restore(input) })}
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-accent/10 via-surface/40 to-transparent p-5 max-sm:p-4">
          <div className="flex items-center justify-between gap-5 max-sm:flex-col max-sm:items-stretch max-sm:gap-4">
            <div className="flex items-center gap-3.5">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10 text-accent"
              >
                <StarsMinimalisticIcon size={18} />
              </span>
              <p className="text-[15px] leading-snug">
                <span className="block font-semibold tracking-[-0.01em]">Seen it?</span>
                <span className="text-muted">Sign in to say what you thought.</span>
              </p>
            </div>
            <SignInLink
              reason="Sign in to say what you thought"
              className="group !min-h-[46px] !rounded-full border border-ink/80 !px-6 tracking-[0.01em] transition-colors duration-200 hover:!opacity-100 hover:border-accent hover:bg-accent hover:text-canvas max-sm:w-full"
            >
              Sign in
              <ArrowRightIcon size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </SignInLink>
          </div>
        </div>
      )}

      <div className="mt-2">
        {comments.isPending ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.isError && !list.length ? (
          <QueryError error={comments.error} retry={() => void comments.refetch()} />
        ) : !list.length ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span aria-hidden="true" className="font-serif text-[72px] leading-[0.6] text-accent/30">
              &ldquo;
            </span>
            <p className="mt-3 text-[17px] font-semibold tracking-[-0.02em]">No one has said a word yet</p>
            <p className="mt-1 max-w-[320px] text-[15px] text-muted">Start the conversation about {title}.</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {list.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} movieId={movieId} meId={me?.id} admin={admin} />
                ))}
              </AnimatePresence>
            </ul>
            {comments.hasNextPage && (
              <div className="flex justify-center border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => void comments.fetchNextPage()}
                  disabled={comments.isFetchingNextPage}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold transition-colors hover:bg-surface disabled:opacity-60"
                >
                  {comments.isFetchingNextPage && <Spinner size="sm" color="current" />}
                  {comments.isFetchNextPageError
                    ? "Couldn't load more. Try again"
                    : `Show older comments${remaining ? ` (${plural(remaining, "more", "more")})` : ""}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
