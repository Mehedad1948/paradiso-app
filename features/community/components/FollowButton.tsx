"use client";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { useFollow, useFollowingIds } from "@/hooks/queries/useCommunityQueries";
import type { Viewer } from "../hooks/useViewer";
import SignInLink from "./SignInLink";

/** Follow toggle; "Following" turns into "Unfollow" on hover, like the button it answers to. */
export default function FollowButton({
  userId,
  viewer,
  size = "md",
}: {
  userId: number;
  viewer: Viewer;
  size?: "sm" | "md";
}) {
  const me = viewer.me?.id;
  const ids = useFollowingIds(me);
  const follow = useFollow(me);
  const sizing = size === "sm" ? "min-h-[34px] min-w-[96px] px-3.5 text-sm" : "min-h-[44px] min-w-[120px] px-5 text-[15px]";

  if (viewer.checking) return null;
  if (!viewer.me)
    return (
      <SignInLink className={clsx("!min-h-0", sizing)} variant="solid">
        Follow
      </SignInLink>
    );
  if (me === userId) return null;

  const following = !!ids.data?.includes(userId);
  return (
    <Button
      isDisabled={ids.isPending}
      aria-pressed={following}
      onPress={() => follow.mutate({ userId, follow: !following })}
      className={clsx(
        "group shrink-0 rounded-full font-semibold",
        sizing,
        following
          ? "border border-line bg-transparent text-ink data-[hover=true]:border-danger/50 data-[hover=true]:bg-danger/10 data-[hover=true]:text-danger"
          : "bg-ink text-canvas",
      )}
    >
      {following ? (
        <>
          <span className="group-data-[hover=true]:hidden">Following</span>
          <span className="hidden group-data-[hover=true]:inline">Unfollow</span>
        </>
      ) : (
        "Follow"
      )}
    </Button>
  );
}
