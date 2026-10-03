"use client";
import { useEffect } from "react";
import CreateRoomCard from "./CreateRoomCard";
import { useRooms } from "@/hooks/queries/useRoomQueries";
import QueryError from "@/components/ui/QueryError";
import { Spinner } from "@heroui/spinner";
import RoomCard from "./RoomCard";
import PanelPagination from "./PanelPagination";
export default function RoomListSection({
  usersRoom,
  page,
  onPage,
  onCreate,
  userId,
}: {
  usersRoom: boolean;
  page: number;
  onPage: (page: number) => void;
  onCreate: () => void;
  userId?: number;
}) {
  const query = useRooms(usersRoom, page);
  const totalPages = Math.max(1, query.data?.meta.totalPages || 1);
  useEffect(() => {
    if (query.data && !query.isPlaceholderData && page > totalPages)
      onPage(totalPages);
  }, [query.data, query.isPlaceholderData, page, totalPages, onPage]);
  return (
    <section
      aria-busy={query.isFetching}
      aria-label={usersRoom ? "My rooms" : "All rooms"}
    >
      <h2 className="py-4">{usersRoom ? "My Rooms" : "All Rooms"}</h2>
      {query.isError && (
        <QueryError error={query.error} retry={() => query.refetch()} />
      )}
      {query.isPending ? (
        <Spinner label="Loading rooms" />
      ) : (
        query.data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {usersRoom && <CreateRoomCard onCreate={onCreate} />}
              {query.data.data.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  canVisit={
                    usersRoom ||
                    !!room.users?.some((user) => user.id === userId)
                  }
                />
              ))}
              {query.data.data.length === 0 && (
                <div>
                  <p className="text-base text-center text-foreground-500 aspect-square flex items-center justify-center p-4 border border-default-300 rounded-3xl w-full h-full">
                    No Rooms were found.
                  </p>
                </div>
              )}
            </div>
            <PanelPagination
              page={page}
              totalPages={totalPages}
              onChange={onPage}
              disabled={query.isPlaceholderData}
            />
          </>
        )
      )}
    </section>
  );
}
