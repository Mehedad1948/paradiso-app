"use client";
import { memo, useRef, useState, ViewTransition, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Tooltip } from "@heroui/tooltip";
import { Link2, Lock, MessageCircle, Users } from "lucide-react";
import type { CommunityPost } from "@/types/community";
import { useDeletePost } from "@/hooks/queries/useCommunityQueries";
import type { Viewer } from "../hooks/useViewer";
import { usePostOverlay } from "../hooks/usePostOverlay";
import { ago, fullDate, isEdited, postHref, profileHref } from "../format";
import UserAvatar from "@/components/ui/UserAvatar";
import PostMedia from "./PostMedia";
import PostActions from "./PostActions";
import PromotionCard from "./PromotionCard";
import PostMenu, { copyPostLink } from "./PostMenu";
import ConfirmDialog from "./ConfirmDialog";

const PostComposer = dynamic(() => import("./PostComposer"), { ssr: false });

const LONG_TEXT = 520;
const interactive = "a, button, input, textarea, [role='menu']";

function PostCard({
  post,
  viewer,
  variant = "feed",
  onDeleted,
}: {
  post: CommunityPost;
  viewer: Viewer;
  variant?: "feed" | "detail";
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { closing } = usePostOverlay();
  // Inside the community a post opens as an overlay, so the feed underneath must not scroll.
  const overlay = pathname.startsWith("/community");
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const remove = useDeletePost();
  // A click that dismisses the menu lands on the card; it shouldn't also open the post.
  const menuClosedAt = useRef(0);
  const detail = variant === "detail";
  const href = postHref(post.id);
  // While this post is open over the feed, its image belongs to the overlay; names must be unique.
  const lent = !detail && pathname === href && closing !== pathname;
  const long =
    !detail &&
    (post.text.length > LONG_TEXT || post.text.split("\n").length > 8);
  const foreignRoomOwner =
    !!post.room && viewer.owns(post.room.id) && !viewer.canEdit(post);

  // The whole card opens the post, except where the reader is clicking a control or selecting text.
  function open(event: MouseEvent<HTMLElement>) {
    if (detail || (event.target as HTMLElement).closest(interactive)) return;
    if (
      window.getSelection()?.toString() ||
      Date.now() - menuClosedAt.current < 400
    )
      return;
    if (event.metaKey || event.ctrlKey) window.open(href, "_blank", "noopener");
    else router.push(href, { scroll: !overlay });
  }

  return (
    <>
      <article
        onClick={open}
        aria-labelledby={`post-${post.id}-author`}
        className={clsx(
          "grid grid-cols-[44px_minmax(0,1fr)] gap-x-3.5 px-5 py-5 sm:px-6",
          !detail &&
            "cursor-pointer transition-colors hover:bg-surface/40 motion-safe:animate-community-rise",
        )}
      >
        <UserAvatar name={post.author.username} src={post.author.avatar} href={profileHref(post.author.id)} />
        <div className="min-w-0">
          <header className="flex min-w-0 items-center gap-1.5 text-[15px] leading-snug">
            <Link
              id={`post-${post.id}-author`}
              href={profileHref(post.author.id)}
              className="truncate font-semibold hover:underline"
            >
              {post.author.username}
            </Link>
            <span aria-hidden="true" className="text-muted">
              ·
            </span>
            <Tooltip
              content={fullDate(post.createdAt)}
              delay={500}
              closeDelay={0}
              size="sm"
            >
              <Link href={href} scroll={!overlay} className="shrink-0 text-muted hover:underline">
                <time dateTime={post.createdAt}>{ago(post.createdAt)}</time>
              </Link>
            </Tooltip>
            {isEdited(post) && (
              <Tooltip
                content={`Edited ${fullDate(post.updatedAt)}`}
                delay={500}
                closeDelay={0}
                size="sm"
              >
                <span className="shrink-0 text-sm text-muted">· edited</span>
              </Tooltip>
            )}
            <span className="ml-auto pl-2">
              <PostMenu
                post={post}
                viewer={viewer}
                onEdit={() => setDialog("edit")}
                onDelete={() => setDialog("delete")}
                onClosed={() => (menuClosedAt.current = Date.now())}
              />
            </span>
          </header>

          {post.room && (
            <RoomScope
              room={post.room}
              member={viewer.isMember(post.room.id)}
            />
          )}

          <p
            className={clsx(
              "mt-1.5 whitespace-pre-wrap break-words",
              detail
                ? "text-[19px] leading-[1.6]"
                : "text-[15.5px] leading-[1.62]",
              long && !expanded && "line-clamp-[8]",
            )}
          >
            {post.text}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-1 text-[15px] font-semibold text-accent hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}

          {/* The image flies between the feed and the open post. Swapping the key when it's lent
              unmounts the named boundary, which is what lets React pair it with the other side. */}
          <ViewTransition
            key={lent ? "lent" : "own"}
            name={lent ? undefined : `post-media-${post.id}`}
            share="morph"
            default="none"
          >
            <PostMedia
              post={post}
              size={detail ? "lg" : "md"}
              actions={<PostActions post={post} viewer={viewer} />}
            />
          </ViewTransition>
          {post.quotedPost && (
            <div className="mt-3 rounded-2xl border border-line p-3">
              <span className="text-sm font-semibold">{post.quotedPost.author.username}</span>
              {post.quotedPost.text && (
                <p className="mt-1 line-clamp-4 whitespace-pre-wrap break-words text-[15px]">
                  {post.quotedPost.text}
                </p>
              )}
              <PostMedia post={post.quotedPost} size="md" />
            </div>
          )}
          {!post.movie && !post.imageUrl && (
            <div className="mt-3 flex">
              <PostActions post={post} viewer={viewer} />
            </div>
          )}
          {post.promotion && (
            <PromotionCard promotion={post.promotion} viewer={viewer} />
          )}

          {detail ? (
            <p className="mt-4 border-b border-line pb-4 text-[15px] text-muted">
              <time dateTime={post.createdAt}>{fullDate(post.createdAt)}</time>
              {isEdited(post) && <> · Edited {ago(post.updatedAt)}</>}
            </p>
          ) : (
            <footer className="-ml-2.5 mt-2.5 flex items-center gap-1 text-muted">
              <Link
                href={`${href}#comments`}
                scroll={!overlay}
                aria-label={`${post.commentCount} comments`}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors hover:bg-sky-500/10 hover:text-sky-500"
              >
                <MessageCircle size={18} aria-hidden="true" />
                <span className="tabular-nums">
                  {post.commentCount > 0
                    ? post.commentCount.toLocaleString()
                    : "Discuss"}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => copyPostLink(post.id)}
                aria-label="Copy link to post"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
              >
                <Link2 size={18} aria-hidden="true" />
              </button>
            </footer>
          )}
        </div>
      </article>

      {dialog === "edit" && (
        <PostComposer post={post} onClose={() => setDialog(null)} />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete recommendation?"
          busy={remove.isPending}
          onClose={() => setDialog(null)}
          onConfirm={() =>
            remove.mutate(post.id, {
              onSuccess: () => {
                setDialog(null);
                onDeleted?.();
              },
            })
          }
        >
          <p className="text-[15px] text-muted">
            {foreignRoomOwner
              ? `As the room owner you can remove ${post.author.username}'s post from ${post.room!.name}. Its comments go with it.`
              : "The post and every comment on it will be removed. This can't be undone."}
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}

function RoomScope({
  room,
  member,
}: {
  room: { id: number; name: string };
  member: boolean;
}) {
  const content = (
    <>
      {member ? (
        <Users size={13} aria-hidden="true" />
      ) : (
        <Lock size={13} aria-hidden="true" />
      )}
      <span className="truncate">In {room.name}</span>
    </>
  );
  const className =
    "mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[13px] font-semibold text-accent";
  return member ? (
    <Link
      href={`/rooms/${room.id}`}
      className={clsx(className, "transition-colors hover:bg-accent/20")}
    >
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}

export default memo(PostCard);
