"use client";
import { useMemo } from "react";
import { useMe } from "@/hooks/queries/useMe";
import { useMyRooms } from "@/hooks/queries/useCommunityQueries";
import type { CommunityComment, CommunityPost } from "@/types/community";

/**
 * Who is reading, and what they may do. The backend sends no permission flags,
 * so these mirror its rules; it still enforces them on every write.
 */
export function useViewer() {
  const me = useMe();
  const user = me.data;
  const rooms = useMyRooms(user?.id);
  return useMemo(() => {
    const list = rooms.data ?? [];
    const owned = list.filter((room) => room.owner.id === user?.id);
    const ownedIds = new Set(owned.map((room) => room.id));
    // The "my rooms" listing is every room the viewer owns or has joined.
    const memberIds = new Set(list.map((room) => room.id));
    const owns = (roomId: number) => ownedIds.has(roomId);
    const isMember = (roomId: number) => memberIds.has(roomId);
    const isAuthor = (authorId: number) => !!user && user.id === authorId;
    return {
      me: user,
      /** The viewer as other members see them. */
      self: user ? { id: user.id, username: user.username, avatar: user.avatar ?? null } : undefined,
      signedIn: !!user,
      /** Still finding out whether anyone is signed in. */
      checking: me.isPending,
      rooms: list,
      ownedRooms: owned,
      owns,
      isMember,
      canEdit: (post: CommunityPost) => isAuthor(post.author.id),
      canDelete: (post: CommunityPost) =>
        isAuthor(post.author.id) || (!!post.room && owns(post.room.id)),
      canDeleteComment: (comment: CommunityComment, post: CommunityPost) =>
        isAuthor(comment.author.id) ||
        isAuthor(post.author.id) ||
        (!!post.room && owns(post.room.id)),
      canComment: (post: CommunityPost) => !!user && (!post.room || isMember(post.room.id)),
    };
  }, [user, me.isPending, rooms.data]);
}

export type Viewer = ReturnType<typeof useViewer>;
