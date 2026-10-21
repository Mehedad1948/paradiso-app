"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Film } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import { BffError } from "@/lib/api/client";
import { usePost } from "@/hooks/queries/useCommunityQueries";
import { useViewer } from "./hooks/useViewer";
import PostCard from "./components/PostCard";
import PostSkeleton from "./components/PostSkeleton";
import CommentsSection from "./components/CommentsSection";

export default function PostRoute() {
  const { postId } = useParams<{ postId: string }>();
  return <PostPage key={postId} postId={Number(postId)} />;
}

function PostPage({ postId }: { postId: number }) {
  const router = useRouter();

  function back() {
    // Return to wherever the reader came from, keeping their scroll position in the feed.
    if (window.history.length > 1) router.back();
    else router.push("/community");
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <button
        type="button"
        onClick={back}
        className="mb-6 inline-flex items-center gap-2 text-[15px] text-muted hover:text-accent"
      >
        <ArrowLeft size={18} aria-hidden="true" /> Back
      </button>
      <PostDetail postId={postId} onDeleted={() => router.replace("/community")} />
    </div>
  );
}

/** The post and its discussion, shared by the standalone page and the feed's overlay. */
export function PostDetail({
  postId,
  framed = true,
  onDeleted,
}: {
  postId: number;
  /** Draw the card's own border; the overlay supplies its own frame. */
  framed?: boolean;
  onDeleted: () => void;
}) {
  const viewer = useViewer();
  const post = usePost(postId);
  const loaded = !!post.data;
  const missing =
    !Number.isSafeInteger(postId) ||
    (post.error instanceof BffError && (post.error.status === 404 || post.error.status === 400));

  // "Discuss" links land on the comments, which only exist once the post has loaded.
  useEffect(() => {
    if (loaded && window.location.hash === "#comments") {
      document.getElementById("comments")?.scrollIntoView({ block: "start" });
    }
  }, [loaded]);

  if (missing) {
    return (
      <div
        className={clsx(
          "flex flex-col items-center gap-3 px-6 py-16 text-center",
          framed && "rounded-[10px] border border-line bg-elevated",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-accent">
          <Film size={24} aria-hidden="true" />
        </span>
        <h1 className="text-2xl">This recommendation isn&apos;t showing</h1>
        <p className="max-w-[420px] text-[15px] text-muted">
          It may have been deleted, or it was shared in a private room you&apos;re not part of.
        </p>
        <Link href="/community" className="mt-2 rounded-md bg-ink px-5 py-2.5 text-[15px] font-semibold text-canvas">
          Back to the community
        </Link>
      </div>
    );
  }
  if (post.isError && !post.data) {
    return (
      <div className={clsx(!framed && "p-6")}>
        <QueryError error={post.error} retry={() => post.refetch()} />
      </div>
    );
  }
  return (
    <div className={clsx(framed && "overflow-hidden rounded-[10px] border border-line bg-elevated")}>
      {post.data ? (
        <>
          <PostCard post={post.data} viewer={viewer} variant="detail" onDeleted={onDeleted} />
          <CommentsSection post={post.data} viewer={viewer} />
        </>
      ) : (
        <PostSkeleton />
      )}
    </div>
  );
}
