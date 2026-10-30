"use client";
import { memo, useId, useMemo, useRef, useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Tooltip } from "@heroui/tooltip";
import { LockIcon, RepeatIcon, UsersGroupRoundedIcon } from "@solar-icons/react/linear";
import type { CommunityPost, CommunityUser } from "@/types/community";
import { useDeletePost, usePost } from "@/hooks/queries/useCommunityQueries";
import type { Viewer } from "../hooks/useViewer";
import { useNearViewport } from "../hooks/useNearViewport";
import { ago, fullDate, isEdited, postHref, profileHref } from "../format";
import UserAvatar from "@/components/ui/UserAvatar";
import PostMedia from "./PostMedia";
import PostActions from "./PostActions";
import PromotionCard from "./PromotionCard";
import PostMenu from "./PostMenu";

// Only mounted when the author opens them, so they stay out of the feed's first load.
const PostComposer = dynamic(() => import("./PostComposer"), { ssr: false });
const ConfirmDialog = dynamic(() => import("./ConfirmDialog"), { ssr: false });

const LONG_TEXT = 520;
const interactive = "a, button, input, textarea, [role='menu']";

type CardProps = {
  post: CommunityPost;
  viewer: Viewer;
  variant?: "feed" | "detail";
  onDeleted?: () => void;
};

/** A repost carries only a snapshot of the original; this stands in until the full post loads. */
function snapshot(repost: CommunityPost, viewer: Viewer): CommunityPost {
  const original = repost.quotedPost!;
  return {
    ...original,
    kind: "post",
    updatedAt: original.createdAt,
    room: repost.room,
    quotedPostId: null,
    quotedPost: null,
    promotion: null,
    commentCount: 0,
    likeCount: 0,
    dislikeCount: 0,
    repostCount: 0,
    quoteCount: 0,
    myReaction: null,
    reposted: repost.author.id === viewer.me?.id,
  };
}

/** Shows the original post, live, under a "reposted" line; likes and replies go to the original. */
function Repost({ post, viewer, ...props }: CardProps) {
  const stand = useMemo(() => snapshot(post, viewer), [post, viewer]);
  // In a feed, the original is fetched only as the repost scrolls near, not for every repost on the page.
  const [ref, near] = useNearViewport<HTMLDivElement>();
  const original = usePost(post.quotedPost!.id, stand, near || props.variant === "detail");
  return (
    <div ref={ref}>
      <PostCard {...props} post={original.data ?? stand} viewer={viewer} repostedBy={post.author} />
    </div>
  );
}

function PostEntry(props: CardProps) {
  return props.post.kind === "repost" && props.post.quotedPost ? <Repost {...props} /> : <PostCard {...props} />;
}

function PostCard({
  post,
  viewer,
  variant = "feed",
  onDeleted,
  repostedBy,
}: CardProps & { repostedBy?: CommunityUser }) {
  const labelId = useId();
  const router = useRouter();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [expanded, setExpanded] = useState(false);
  // A click that dismisses the menu lands on the card; it shouldn't also open the post.
  const menuClosedAt = useRef(0);
  const detail = variant === "detail";
  const href = postHref(post.id);
  const long =
    !detail &&
    (post.text.length > LONG_TEXT || post.text.split("\n").length > 8);

  // The whole card opens the post, except where the reader is clicking a control or selecting text.
  function open(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (detail || target.closest(interactive)) return;
    if (
      window.getSelection()?.toString() ||
      Date.now() - menuClosedAt.current < 400
    )
      return;
    // A click on the embedded post opens that post instead.
    const to = target.closest<HTMLElement>("[data-quote-href]")?.dataset.quoteHref ?? href;
    // Inside the community a post opens as an overlay, so the feed underneath must not scroll.
    // Read at click time: subscribing to the pathname would re-render every card on each navigation.
    const overlay = window.location.pathname.startsWith("/community");
    if (event.metaKey || event.ctrlKey) window.open(to, "_blank", "noopener");
    else router.push(to, { scroll: !overlay });
  }

  return (
    <>
      <article
        onClick={open}
        aria-labelledby={labelId}
        className={clsx(
          "block px-0 py-4 sm:px-6 sm:py-5",
          !detail &&
            "cursor-pointer transition-colors hover:bg-surface/40 motion-safe:animate-community-rise",
        )}
      >
        {repostedBy && (
          <p className="mb-2.5 flex items-center gap-1.5 pl-[30px] text-[13px] font-semibold text-muted">
            <RepeatIcon size={15} aria-hidden="true" className="-ml-[22px]" />
            <Link href={profileHref(repostedBy.id)} className="truncate hover:underline">
              {repostedBy.id === viewer.me?.id ? "You" : repostedBy.username}
            </Link>
            reposted
          </p>
        )}
        <header className="flex min-w-0 items-center gap-3">
          <Link
            href={profileHref(post.author.id)}
            className="group flex min-w-0 flex-1 items-center gap-3"
          >
            <UserAvatar name={post.author.username} src={post.author.avatar} />
            <div className="flex min-w-0 flex-1 flex-col leading-snug">
              <span id={labelId} className="truncate text-[15px] font-semibold group-hover:underline">
                {post.author.username}
              </span>
              <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
                <Tooltip
                  content={fullDate(post.createdAt)}
                  delay={500}
                  closeDelay={0}
                  size="sm"
                >
                  <time dateTime={post.createdAt} className="shrink-0">
                    {ago(post.createdAt)}
                  </time>
                </Tooltip>
                {isEdited(post) && (
                  <Tooltip
                    content={`Edited ${fullDate(post.updatedAt)}`}
                    delay={500}
                    closeDelay={0}
                    size="sm"
                  >
                    <span className="shrink-0">· edited</span>
                  </Tooltip>
                )}
              </div>
            </div>
          </Link>
          {(viewer.canEdit(post) || viewer.canDelete(post)) && (
            <span className="shrink-0 pl-2">
              <PostMenu
                post={post}
                viewer={viewer}
                onEdit={() => setDialog("edit")}
                onDelete={() => setDialog("delete")}
                onClosed={() => (menuClosedAt.current = Date.now())}
              />
            </span>
          )}
        </header>

        <div className="mt-2 min-w-0">

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

          <PostMedia post={post} size={detail ? "lg" : "md"} />
          {post.quotedPost && (
            <div
              data-quote-href={postHref(post.quotedPost.id)}
              className="post-quote"
            >
              <span className="post-quote__author">{post.quotedPost.author.username}</span>
              {post.quotedPost.text && (
                <p className="post-quote__text line-clamp-4 whitespace-pre-wrap break-words">
                  {post.quotedPost.text}
                </p>
              )}
              <PostMedia post={post.quotedPost} size="md" />
            </div>
          )}
          {/* One fixed place for the actions, whatever the post carries. */}
          <div className="mt-2 flex">
            <PostActions post={post} viewer={viewer} />
          </div>
          {post.promotion && (
            <PromotionCard promotion={post.promotion} viewer={viewer} />
          )}

          {detail && (
            <p className="mt-4 border-b border-line pb-4 text-[15px] text-muted">
              <time dateTime={post.createdAt}>{fullDate(post.createdAt)}</time>
              {isEdited(post) && <> · Edited {ago(post.updatedAt)}</>}
            </p>
          )}
        </div>
      </article>

      {dialog === "edit" && (
        <PostComposer post={post} onClose={() => setDialog(null)} />
      )}
      {dialog === "delete" && (
        <DeleteDialog
          post={post}
          viewer={viewer}
          onClose={() => setDialog(null)}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}

function DeleteDialog({
  post,
  viewer,
  onClose,
  onDeleted,
}: {
  post: CommunityPost;
  viewer: Viewer;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const remove = useDeletePost();
  const foreignRoomOwner =
    !!post.room && viewer.owns(post.room.id) && !viewer.canEdit(post);
  return (
    <ConfirmDialog
      title="Delete post?"
      busy={remove.isPending}
      onClose={onClose}
      onConfirm={() =>
        remove.mutate(post.id, {
          onSuccess: () => {
            onClose();
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
        <UsersGroupRoundedIcon size={13} aria-hidden="true" />
      ) : (
        <LockIcon size={13} aria-hidden="true" />
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

export default memo(PostEntry);
