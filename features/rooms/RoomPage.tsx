"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { useMe } from "@/hooks/queries/useMe";
import {
  useRoom,
  useRoomRatings,
  useRoomRatingSummary,
} from "@/hooks/queries/useRoomQueries";
import { useChatUnread } from "@/hooks/queries/useChatQueries";
import { useInvitations } from "@/hooks/queries/useInvitationQueries";
import QueryError from "@/components/ui/QueryError";
import ShinyText from "@/components/ui/ShinyText";
import { useRoomUrl } from "./hooks/useRoomUrl";
import { useRoomDialog } from "./hooks/useRoomDialog";
import RoomToolbar from "./components/RoomToolbar";
import RoomRatingTable from "./components/RoomRatingTable";
import RoomQuickFilters from "./components/RoomQuickFilters";
import UnratedBanner from "./components/UnratedBanner";
import RoomMembers from "./components/RoomMembers";
import RoomMenu from "./components/RoomMenu";
import InfiniteScrollSentinel from "./components/InfiniteScrollSentinel";
import DialogLoading from "./components/DialogLoading";
import RoomNoAccess, { isRoomAccessError } from "./components/RoomNoAccess";
import Image from "next/image";
import { posters } from "@/config/posters";
import Link from "next/link";
import { ArrowLeft, MessagesSquare, NotebookPen, Pencil } from "lucide-react";
import UnreadBadge from "./chat/components/UnreadBadge";
import { wallpaperGlow } from "./lib/wallpaper";
const AddMovieDialog = dynamic(() => import("./dialogs/AddMovieDialog"), {
  ssr: false,
  loading: DialogLoading,
});
const InviteDialog = dynamic(() => import("./dialogs/InviteDialog"), {
  ssr: false,
  loading: DialogLoading,
});
const VoteMovieDialog = dynamic(() => import("./dialogs/VoteMovieDialog"), {
  ssr: false,
  loading: DialogLoading,
});
const EditMovieDialog = dynamic(() => import("./dialogs/EditMovieDialog"), {
  ssr: false,
  loading: DialogLoading,
});
const DeleteMovieDialog = dynamic(() => import("./dialogs/DeleteMovieDialog"), {
  ssr: false,
  loading: DialogLoading,
});
const LeaveRoomDialog = dynamic(() => import("./dialogs/LeaveRoomDialog"), {
  ssr: false,
  loading: DialogLoading,
});
const ChatSidebar = dynamic(() => import("./chat/ChatSidebar"), {
  ssr: false,
  loading: DialogLoading,
});
const RoomDiscussion = dynamic(() => import("@/features/community/RoomDiscussion"), {
  ssr: false,
  loading: DialogLoading,
});
const EditRoomSidebar = dynamic(() => import("./sidebars/EditRoomSidebar"), {
  ssr: false,
  loading: DialogLoading,
});
const RoomMembersSidebar = dynamic(() => import("./sidebars/RoomMembersSidebar"), {
  ssr: false,
  loading: DialogLoading,
});
type MovieAction = { type: "vote" | "delete" | "edit"; movieId: string } | null;
export default function RoomRoute() {
  const { roomId } = useParams<{ roomId: string }>();
  return <RoomPage key={roomId} roomId={roomId} />;
}
function RoomPage({ roomId }: { roomId: string }) {
  const {
    update,
    filters,
    setSearch,
    sortByUser,
    sortByAverage,
    sortByControversy,
    setQuickFilters,
  } = useRoomUrl();
  const { dialog, open, close } = useRoomDialog();
  const room = useRoom(roomId);
  const ratings = useRoomRatings(roomId, filters);
  const me = useMe();
  const [action, setAction] = useState<MovieAction>(null);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setAction(null);
  }, []);
  const movie = ratings.data?.data.find(
    (movie) => movie.id === action?.movieId,
  );
  const disabled = !room.data || room.isError || ratings.isPlaceholderData;
  const canManage =
    !!room.data &&
    !!me.data &&
    (me.data.role === "admin" || room.data.owner.id === me.data.id);
  // Members' invitations to a private room wait for the owner; shares its cache with the sidebar queue.
  const canReview = !!room.data && !!me.data && room.data.owner.id === me.data.id && !room.data.isPublic;
  const approvals = useInvitations(roomId, 1, "awaiting_approval", { limit: 50, enabled: canReview });
  const reviewCount = canReview ? (approvals.data?.meta.totalItems ?? 0) : 0;
  // Members include the owner. Only they get chat and their own unrated counts, public room or not.
  const isMember =
    !!room.data &&
    !!me.data &&
    (room.data.owner.id === me.data.id ||
      room.data.users.some((user) => user.id === me.data!.id));
  // The owner cannot leave while there is no other admin, so the action is not offered.
  const canLeave = isMember && room.data!.owner.id !== me.data!.id;
  const chatOpen = isMember && dialog === "chat";
  const unread = useChatUnread(roomId, { enabled: isMember, live: chatOpen });
  const summary = useRoomRatingSummary(roomId, isMember);
  const watchedTogether = filters.isWatchTogether === true;
  const unrated = filters.hasVoted === false;
  const showInWatchlist = useCallback(
    (title: string) =>
      update({ dialog: null, search: title.slice(0, 200), page: null }),
    [update],
  );
  if (isRoomAccessError(room.error)) {
    return <RoomNoAccess status={room.error.status} origin={`/rooms/${roomId}`} />;
  }
  return (
    <div
      className="relative isolate min-h-fit"
      aria-busy={ratings.isFetching || room.isFetching}
    >
      {/* The lobby's spotlight wash, fixed behind the page (below the header) and kept faint. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 top-24 -z-10"
        style={{ backgroundImage: wallpaperGlow(0.75) }}
      />
      <Link href="/rooms" className="mb-6 inline-flex items-center gap-2 text-[15px] text-muted hover:text-accent">
        <ArrowLeft size={18} aria-hidden="true" /> All rooms
      </Link>
      <div className="relative isolate mb-10 flex items-end justify-between gap-6 pb-9 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:pb-7">
        {room.data && (
          <div
            aria-hidden="true"
            className="room-hero-art pointer-events-none absolute -top-20 bottom-0 right-0 -z-10 w-[72%] max-sm:-left-[5vw] max-sm:-right-[5vw] max-sm:-top-16 max-sm:w-auto"
          >
            <Image
              // Same fallback as the room's card, so the header matches the lobby.
              src={room.data.imageUrl || posters.fellowship}
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 100vw, 72vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="room-hero-text">
          <h1 className="mb-4 break-words text-[clamp(36px,4.8vw,68px)] tracking-[-0.06em] [&_em]:font-serif [&_em]:font-normal max-sm:text-[38px]">
            <ShinyText
              text={room.data?.name || "Room"}
              color="hsl(var(--heroui-foreground))"
              shineColor="hsl(var(--heroui-primary-500))"
              speed={3}
              delay={1.5}
              shineWidth={35}
              glow={0.4}
            />
          </h1>
          <p className="max-w-[540px] text-base text-muted">
            {room.data?.description ||
              "A shared watchlist. A few different opinions. Your next great film."}
          </p>
          {room.data && (
            <RoomMembers
              members={room.data.users}
              ownerId={room.data.owner.id}
              disabled={disabled}
              onInvite={() => open("invite")}
              onOpenList={() => open("members")}
              reviewCount={reviewCount}
            />
          )}
        </div>
        {room.data && (
          <div className="flex shrink-0 flex-wrap items-center gap-3 max-sm:w-full max-sm:[&>button]:flex-1">
            {canManage && (
              <Button
                className="min-h-[46px] rounded-md border border-line bg-surface/75 text-[15px] font-semibold text-ink backdrop-blur-md"
                startContent={<Pencil size={17} aria-hidden="true" />}
                isDisabled={room.isError}
                onPress={() => open("edit-room")}
              >
                Edit room
              </Button>
            )}
            <Button
              className="min-h-[46px] rounded-md border border-line bg-surface/75 text-[15px] font-semibold text-ink backdrop-blur-md"
              startContent={<NotebookPen size={17} aria-hidden="true" />}
              onPress={() => open("discussion")}
            >
              Discussion
            </Button>
            {isMember && (
              <Button
                className="min-h-[46px] rounded-md bg-ink text-[15px] font-semibold text-canvas"
                startContent={<MessagesSquare size={17} aria-hidden="true" />}
                endContent={unread.data && <UnreadBadge unread={unread.data} />}
                onPress={() => open("chat")}
              >
                Lobby
              </Button>
            )}
            {canLeave && <RoomMenu onLeave={() => setLeaving(true)} />}
          </div>
        )}
      </div>
      {isMember && summary.data && !(watchedTogether && unrated) && (
        <UnratedBanner
          roomId={roomId}
          count={summary.data.unratedWatchedTogether}
          onReview={() => setQuickFilters({ watchedTogether: true, unrated: true })}
        />
      )}
      <RoomToolbar
        search={filters.search || ""}
        onSearch={setSearch}
        onInvite={() => open("invite")}
        onAddMovie={() => open("add-movie")}
        disabled={disabled}
      />
      {room.data && (
        <RoomQuickFilters
          watchedTogether={watchedTogether}
          unrated={unrated}
          unratedCount={summary.data?.unrated}
          showUnrated={isMember}
          disabled={disabled}
          onChange={setQuickFilters}
        />
      )}
      {room.isError && (
        <QueryError error={room.error} retry={() => room.refetch()} />
      )}
      {ratings.isError && (
        <QueryError error={ratings.error} retry={() => ratings.refetch()} />
      )}
      {me.isError && <QueryError error={me.error} retry={() => me.refetch()} />}
      {room.isPending || ratings.isPending ? (
        <Spinner label="Loading room movies" />
      ) : (
        room.data &&
        ratings.data && (
          <>
            <p className="mb-3 text-sm text-default-500 sm:hidden">
              Scroll across to see every rating and action.
            </p>
            <RoomRatingTable
              result={ratings.data}
              room={room.data}
              user={me.data}
              isMember={isMember}
              filters={filters}
              disabled={disabled}
              onSort={sortByUser}
              onSortAverage={sortByAverage}
              onSortControversy={sortByControversy}
              onVote={(movieId) => setAction({ type: "vote", movieId })}
              onDelete={(movieId) => setAction({ type: "delete", movieId })}
              onEdit={(movieId) => setAction({ type: "edit", movieId })}
            />
            <InfiniteScrollSentinel
              hasMore={!!ratings.hasNextPage}
              loading={ratings.isFetchingNextPage}
              onLoadMore={() => ratings.fetchNextPage()}
            />          </>
        )
      )}
      {room.data && chatOpen && me.data && (
        <ChatSidebar
          room={room.data}
          me={me.data}
          onClose={close}
          onShowInWatchlist={showInWatchlist}
        />
      )}
      {room.data && canLeave && leaving && (
        <LeaveRoomDialog
          roomId={roomId}
          roomName={room.data.name}
          onClose={() => setLeaving(false)}
        />
      )}
      {room.data && dialog === "discussion" && (
        <RoomDiscussion room={room.data} canPost={isMember} onClose={close} />
      )}
      {room.data && dialog === "add-movie" && (
        <AddMovieDialog roomId={roomId} onClose={close} />
      )}
      {room.data && dialog === "invite" && (
        <InviteDialog
          key={roomId}
          roomId={roomId}
          isOwner={!!me.data && room.data.owner.id === me.data.id}
          meId={me.data?.id}
          onClose={close}
        />
      )}
      {room.data && dialog === "members" && (
        <RoomMembersSidebar
          key={roomId}
          room={room.data}
          meId={me.data?.id}
          canManage={canManage}
          canReview={canReview}
          onInvite={() => open("invite")}
          onClose={close}
        />
      )}
      {room.data && canManage && dialog === "edit-room" && (
        <EditRoomSidebar key={roomId} room={room.data} onClose={close} />
      )}
      {movie && action?.type === "vote" && me.data && (
        <VoteMovieDialog
          key={movie.id}
          roomId={roomId}
          movie={movie}
          userId={me.data.id}
          onClose={() => setAction(null)}
        />
      )}
      {movie && action?.type === "edit" && (
        <EditMovieDialog
          key={movie.id}
          roomId={roomId}
          movie={movie}
          onClose={() => setAction(null)}
        />
      )}
      {movie && action?.type === "delete" && (
        <DeleteMovieDialog
          key={movie.id}
          roomId={roomId}
          movie={movie}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  );
}
