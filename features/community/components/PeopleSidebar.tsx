"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Spinner } from "@heroui/spinner";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import QueryError from "@/components/ui/QueryError";
import { usePeople } from "@/hooks/queries/useCommunityQueries";
import { useInfiniteSentinel } from "../hooks/useInfiniteSentinel";
import type { Viewer } from "../hooks/useViewer";
import { profileHref } from "../format";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";

export default function PeopleSidebar({
  userId,
  username,
  kind,
  viewer,
  onClose,
}: {
  userId: number;
  username: string;
  kind: "followers" | "following";
  viewer: Viewer;
  onClose: () => void;
}) {
  const sidebar = useSidebar(onClose);
  const people = usePeople(userId, kind);
  const list = useMemo(() => people.data?.pages.flatMap((page) => page.data) ?? [], [people.data]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = people;
  const sentinel = useInfiniteSentinel(
    () => void (!isFetchingNextPage && !isError && fetchNextPage()),
    !!hasNextPage,
  );
  return (
    <Sidebar
      ref={sidebar.ref}
      title={kind === "followers" ? "Followers" : "Following"}
      description={kind === "followers" ? `People who follow ${username}.` : `People ${username} follows.`}
      onClose={onClose}
    >
      {people.isPending ? (
        <Spinner label="Loading people" />
      ) : people.isError && !list.length ? (
        <QueryError error={people.error} retry={() => people.refetch()} />
      ) : !list.length ? (
        <p className="py-10 text-center text-muted">
          {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
        </p>
      ) : (
        <>
          <ul className="-mx-2 flex flex-col">
            {list.map((user) => (
              <li key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface">
                <UserAvatar user={user} className="h-10 w-10" />
                <Link href={profileHref(user.id)} onClick={sidebar.close} className="min-w-0 flex-1 truncate font-semibold hover:underline">
                  {user.username}
                </Link>
                <FollowButton userId={user.id} viewer={viewer} size="sm" />
              </li>
            ))}
          </ul>
          <div ref={sentinel} className="flex justify-center py-4">
            {isFetchingNextPage && <Spinner size="sm" />}
            {!isFetchingNextPage && isError && hasNextPage && (
              <button type="button" onClick={() => fetchNextPage()} className="text-sm font-semibold text-accent">
                Try again
              </button>
            )}
          </div>
        </>
      )}
    </Sidebar>
  );
}
