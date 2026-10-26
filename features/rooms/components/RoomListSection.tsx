"use client";
import { useEffect } from "react";
import CreateRoomCard from "./CreateRoomCard";
import { useRooms } from "@/hooks/queries/useRoomQueries";
import QueryError from "@/components/ui/QueryError";
import { Spinner } from "@heroui/spinner";
import RoomCard from "./RoomCard";
import ChromaGrid from "./ChromaGrid";
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
  console.log('. query.data', query.data);
  
  return (
    <section
      className="[&+section]:mt-12"
      aria-busy={query.isFetching}
      aria-label={usersRoom ? "My rooms" : "All rooms"}
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 [&>h2]:text-[clamp(24px,2.3vw,32px)] [&>p]:text-sm [&>p]:text-muted">
        <h2>{usersRoom ? "Your rooms" : "Discover rooms"}</h2>
        <p>
          {usersRoom
            ? "Your people. Your watchlists."
            : "Find a circle that shares your taste."}
        </p>
      </div>
      {query.isError && (
        <QueryError error={query.error} retry={() => query.refetch()} />
      )}
      {query.isPending ? (
        <Spinner label="Loading rooms" />
      ) : (
        query.data && (
          <>
            <ChromaGrid className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-5">
              {usersRoom && (
                <div className="chroma-card">
                  <CreateRoomCard onCreate={onCreate} />
                </div>
              )}
              {query.data.data.map((room) => (
                <div key={room.id} className="chroma-card">
                  <RoomCard
                    room={room}
                    canVisit={
                      usersRoom ||
                      !!room.users?.some((user) => user.id === userId)
                    }
                  />
                </div>
              ))}
            </ChromaGrid>
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
