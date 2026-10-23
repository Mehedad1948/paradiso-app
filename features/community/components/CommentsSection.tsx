"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { MessageCircle, Trash2 } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/queries/useCommunityQueries";
import { commentTextError } from "@/lib/community/validation";
import { COMMUNITY_LIMITS, type CommunityComment, type CommunityPost } from "@/types/community";
import { useInfiniteSentinel } from "../hooks/useInfiniteSentinel";
import type { Viewer } from "../hooks/useViewer";
import { ago, fullDate, plural, profileHref } from "../format";
import ConfirmDialog from "./ConfirmDialog";
import SignInLink from "./SignInLink";
import UserAvatar from "@/components/ui/UserAvatar";

function CommentBox({ post, viewer }: { post: CommunityPost; viewer: Viewer }) {
  const [text, setText] = useState("");
  const create = useCreateComment();
  const length = text.trim().length;
  const error = commentTextError(text);

  function submit() {
    if (error || create.isPending) return;
    create.mutate({ postId: post.id, text: text.trim() }, { onSuccess: () => setText("") });
  }

  if (!viewer.me)
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 max-sm:flex-col max-sm:items-start">
        <p className="text-[15px] text-muted">Sign in to join the conversation.</p>
        <SignInLink>Sign in</SignInLink>
      </div>
    );
  if (!viewer.canComment(post))
    return (
      <p className="px-5 py-4 text-[15px] text-muted sm:px-6">
        Only members of <span className="font-semibold text-ink">{post.room?.name}</span> can reply here.
      </p>
    );

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3.5 px-5 py-4 sm:px-6">
      <UserAvatar name={viewer.self!.username} src={viewer.self!.avatar} />
      <div>
        <Textarea
          aria-label="Add a comment"
          placeholder={`Reply to ${post.author.username}…`}
          value={text}
          onValueChange={setText}
          minRows={1}
          maxRows={8}
          isDisabled={create.isPending}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
          }}
          classNames={{ inputWrapper: "border border-line bg-surface shadow-none", input: "text-[15px] leading-[1.6]" }}
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {length > COMMUNITY_LIMITS.comment * 0.8 && (
            <span className={clsx("text-sm tabular-nums", length > COMMUNITY_LIMITS.comment ? "text-danger" : "text-muted")}>
              {length} / {COMMUNITY_LIMITS.comment}
            </span>
          )}
          <Button
            size="sm"
            isLoading={create.isPending}
            isDisabled={!!error}
            onPress={submit}
            className="min-h-[36px] rounded-full bg-ink px-5 font-semibold text-canvas"
          >
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  post,
  viewer,
}: {
  comment: CommunityComment;
  post: CommunityPost;
  viewer: Viewer;
}) {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteComment();
  return (
    <li className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3.5 px-5 py-4 sm:px-6 motion-safe:animate-community-rise">
      <UserAvatar name={comment.author.username} src={comment.author.avatar} size={40} href={profileHref(comment.author.id)} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5 text-[15px] leading-snug">
          <Link href={profileHref(comment.author.id)} className="truncate font-semibold hover:underline">
            {comment.author.username}
          </Link>
          {comment.author.id === post.author.id && (
            <span className="shrink-0 rounded-full bg-accent/10 px-2 text-xs font-semibold text-accent">Author</span>
          )}
          <span aria-hidden="true" className="text-muted">·</span>
          <Tooltip content={fullDate(comment.createdAt)} delay={500} closeDelay={0} size="sm">
            <time dateTime={comment.createdAt} className="shrink-0 text-muted">
              {ago(comment.createdAt)}
            </time>
          </Tooltip>
          {viewer.canDeleteComment(comment, post) && (
            <button
              type="button"
              aria-label="Delete comment"
              onClick={() => setConfirming(true)}
              className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-[1.6]">{comment.text}</p>
      </div>
      {confirming && (
        <ConfirmDialog
          title="Delete comment?"
          busy={remove.isPending}
          onClose={() => setConfirming(false)}
          onConfirm={() =>
            remove.mutate(
              { postId: post.id, commentId: comment.id },
              { onSuccess: () => setConfirming(false) },
            )
          }
        >
          <p className="line-clamp-3 rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-muted">
            {comment.text}
          </p>
          <p className="text-sm text-muted">This can&apos;t be undone.</p>
        </ConfirmDialog>
      )}
    </li>
  );
}

/** A flat conversation under a post: newest first, no threads. */
export default function CommentsSection({ post, viewer }: { post: CommunityPost; viewer: Viewer }) {
  const comments = useComments(post.id);
  const list = useMemo(() => comments.data?.pages.flatMap((page) => page.data) ?? [], [comments.data]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = comments;
  const sentinel = useInfiniteSentinel(
    () => void (!isFetchingNextPage && !isError && fetchNextPage()),
    !!hasNextPage,
  );

  return (
    <section id="comments" aria-label="Comments" className="scroll-mt-32">
      <h2 className="border-b border-line px-5 py-3.5 text-lg tracking-[-0.03em] sm:px-6">
        {post.commentCount ? plural(post.commentCount, "reply", "replies") : "Conversation"}
      </h2>
      <div className="border-b border-line">
        <CommentBox post={post} viewer={viewer} />
      </div>
      {comments.isPending ? (
        <div className="flex justify-center py-10">
          <Spinner size="sm" label="Loading comments" classNames={{ label: "text-sm text-muted" }} />
        </div>
      ) : comments.isError && !list.length ? (
        <div className="px-5 sm:px-6">
          <QueryError error={comments.error} retry={() => comments.refetch()} />
        </div>
      ) : !list.length ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <MessageCircle size={26} className="text-muted" aria-hidden="true" />
          <p className="font-semibold">No replies yet</p>
          <p className="text-[15px] text-muted">Seen it too? Say what you thought.</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {list.map((comment) => (
              <CommentItem key={comment.id} comment={comment} post={post} viewer={viewer} />
            ))}
          </ul>
          <div ref={sentinel} className="flex min-h-[56px] items-center justify-center border-t border-line py-4 text-sm">
            {isFetchingNextPage ? (
              <Spinner size="sm" />
            ) : hasNextPage ? (
              <button type="button" onClick={() => fetchNextPage()} className="font-semibold text-accent hover:underline">
                {isError ? "Couldn't load more. Try again" : "Show older replies"}
              </button>
            ) : (
              <span className="text-muted">That&apos;s the whole conversation.</span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
