"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { useMe } from "@/hooks/queries/useMe";
import { useRoom, useRoomRatings } from "@/hooks/queries/useRoomQueries";
import { useChatUnread } from "@/hooks/queries/useChatQueries";
import QueryError from "@/components/ui/QueryError";
import { useRoomUrl } from "./hooks/useRoomUrl";
import { useRoomDialog } from "./hooks/useRoomDialog";
import RoomToolbar from "./components/RoomToolbar";
import RoomRatingTable from "./components/RoomRatingTable";
import PanelPagination from "./components/PanelPagination";
import DialogLoading from "./components/DialogLoading";
import Link from "next/link";
import { ArrowLeft, Film, MessagesSquare, Pencil } from "lucide-react";
import UnreadBadge from "./chat/components/UnreadBadge";
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
const DeleteMovieDialog = dynamic(() => import("./dialogs/DeleteMovieDialog"), {
  ssr: false,
  loading: DialogLoading,
});
const RoomChat = dynamic(() => import("./chat/RoomChat"), {
  ssr: false,
  loading: () => <Spinner className="flex min-h-[480px]" label="Opening the lobby" />,
});
const EditRoomSidebar = dynamic(() => import("./sidebars/EditRoomSidebar"), {
  ssr: false,
  loading: DialogLoading,
});
type MovieAction = { type: "vote" | "delete"; movieId: string } | null;
export default function RoomRoute() {
  const { roomId } = useParams<{ roomId: string }>();
  return <RoomPage key={roomId} roomId={roomId} />;
}
function RoomPage({ roomId }: { roomId: string }) {
  const { params, update, filters, setPage, setSearch, sortByUser } = useRoomUrl();
  const { dialog, open, close } = useRoomDialog();
  const room = useRoom(roomId);
  const ratings = useRoomRatings(roomId, filters);
  const me = useMe();
  const [action, setAction] = useState<MovieAction>(null);
  useEffect(() => {
    setAction(null);
  }, []);
  const movie = ratings.data?.data.find(
    (movie) => movie.id === action?.movieId,
  );
  const totalPages = Math.max(1, ratings.data?.meta.totalPages || 1);
  useEffect(() => {
    if (ratings.data && !ratings.isPlaceholderData && filters.page > totalPages)
      setPage(totalPages);
  }, [
    ratings.data,
    ratings.isPlaceholderData,
    filters.page,
    totalPages,
    setPage,
  ]);
  const disabled = !room.data || room.isError || ratings.isPlaceholderData;
  const canManage =
    !!room.data &&
    !!me.data &&
    (me.data.role === "admin" || room.data.owner.id === me.data.id);
  // Chat is for members and the owner only, public room or not.
  const canChat =
    !!room.data &&
    !!me.data &&
    (room.data.owner.id === me.data.id ||
      room.data.users.some((user) => user.id === me.data!.id));
  const tab = canChat && params.get("tab") === "chat" ? "chat" : "watchlist";
  const unread = useChatUnread(roomId, { enabled: canChat, live: tab === "chat" });
  const showInWatchlist = useCallback(
    (title: string) => update({ tab: null, search: title.slice(0, 200), page: null }),
    [update],
  );
  const watchlist = (
    <>
      <RoomToolbar
        search={filters.search || ""}
        onSearch={setSearch}
        onInvite={() => open("invite")}
        onAddMovie={() => open("add-movie")}
        disabled={disabled}
      />
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
              filters={filters}
              disabled={disabled}
              onSort={sortByUser}
              onVote={(movieId) => setAction({ type: "vote", movieId })}
              onDelete={(movieId) => setAction({ type: "delete", movieId })}
            />
            <PanelPagination
              page={filters.page}
              totalPages={totalPages}
              onChange={setPage}
              disabled={ratings.isPlaceholderData}
            />
          </>
        )
      )}
    </>
  );
  return (
    <div
      className="min-h-fit"
      aria-busy={ratings.isFetching || room.isFetching}
    >
      <Link href="/rooms" className="mb-6 inline-flex items-center gap-2 text-[15px] text-muted hover:text-accent">
        <ArrowLeft size={18} aria-hidden="true" /> All rooms
      </Link>
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-9 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:pb-7 max-sm:[&>button]:w-full">
        <div>
          <p className="mb-3.5 text-sm font-semibold uppercase tracking-[0.09em] text-accent">The screening room</p>
          <h1 className="mb-4 break-words text-[clamp(36px,4.8vw,68px)] tracking-[-0.06em] [&_em]:font-serif [&_em]:font-normal max-sm:text-[38px]">{room.data?.name || "Room"}</h1>
          <p className="max-w-[540px] text-base text-muted">
            {room.data?.description ||
              "A shared watchlist. A few different opinions. Your next great film."}
          </p>
        </div>
        {canManage && (
          <Button
            className="min-h-[46px] shrink-0 rounded-md border border-line bg-surface text-[15px] font-semibold text-ink"
            startContent={<Pencil size={17} aria-hidden="true" />}
            isDisabled={room.isError}
            onPress={() => open("edit-room")}
          >
            Edit room
          </Button>
        )}
      </div>
      {canChat && room.data && me.data ? (
        <Tabs
          aria-label="Room sections"
          variant="underlined"
          selectedKey={tab}
          onSelectionChange={(key) =>
            update({ tab: key === "chat" ? "chat" : null }, true)
          }
          classNames={{
            base: "mb-7 w-full border-b border-line",
            tabList: "gap-7 p-0",
            cursor: "h-[2px] w-full bg-ink",
            tab: "h-12 max-w-fit px-0",
            tabContent:
              "text-[15px] font-semibold text-muted group-data-[selected=true]:text-ink",
            panel: "p-0",
          }}
        >
          <Tab
            key="watchlist"
            title={
              <span className="flex items-center gap-2">
                <Film size={17} aria-hidden="true" /> Watchlist
              </span>
            }
          >
            {watchlist}
          </Tab>
          <Tab
            key="chat"
            title={
              <span className="flex items-center gap-2">
                <MessagesSquare size={17} aria-hidden="true" /> Lobby
                {tab !== "chat" && unread.data && (
                  <UnreadBadge unread={unread.data} />
                )}
              </span>
            }
          >
            <RoomChat
              room={room.data}
              me={me.data}
              onShowInWatchlist={showInWatchlist}
            />
          </Tab>
        </Tabs>
      ) : (
        watchlist
      )}
      {room.data && dialog === "add-movie" && (
        <AddMovieDialog roomId={roomId} onClose={close} />
      )}
      {room.data && dialog === "invite" && (
        <InviteDialog key={roomId} roomId={roomId} onClose={close} />
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
