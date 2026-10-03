"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { useMe } from "@/hooks/queries/useMe";
import { useRoom, useRoomRatings } from "@/hooks/queries/useRoomQueries";
import QueryError from "@/components/ui/QueryError";
import { useRoomUrl } from "./hooks/useRoomUrl";
import { useRoomDialog } from "./hooks/useRoomDialog";
import RoomToolbar from "./components/RoomToolbar";
import RoomRatingTable from "./components/RoomRatingTable";
import PanelPagination from "./components/PanelPagination";
import DialogLoading from "./components/DialogLoading";
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
type MovieAction = { type: "vote" | "delete"; movieId: string } | null;
export default function RoomRoute() {
  const { roomId } = useParams<{ roomId: string }>();
  return <RoomPage key={roomId} roomId={roomId} />;
}
function RoomPage({ roomId }: { roomId: string }) {
  const { filters, setPage, setSearch, sortByUser } = useRoomUrl();
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
  return (
    <div
      className="min-h-fit p-4"
      aria-busy={ratings.isFetching || room.isFetching}
    >
      <h1 className="text-2xl font-semibold mb-4">
        {room.data?.name || "Room"}
      </h1>
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
      {room.data && dialog === "add-movie" && (
        <AddMovieDialog roomId={roomId} onClose={close} />
      )}
      {room.data && dialog === "invite" && (
        <InviteDialog key={roomId} roomId={roomId} onClose={close} />
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
