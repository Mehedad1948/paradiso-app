"use client";
import { useMemo } from "react";
import type { MovieWithRatings } from "@/types";
import type { User } from "@/types/user";
import type { Room, RoomRatingFilters } from "@/types/rooms";
import type { PaginatedResponse } from "@/types/request";
import { Button } from "@heroui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
export default function RoomRatingTable({
  result,
  room,
  user,
  filters,
  disabled,
  onSort,
  onVote,
  onDelete,
}: {
  result: PaginatedResponse<MovieWithRatings>;
  room: Room;
  user?: User;
  filters: RoomRatingFilters;
  disabled: boolean;
  onSort: (userId: number) => void;
  onVote: (movieId: string) => void;
  onDelete: (movieId: string) => void;
}) {
  const columns = useMemo(
    () => [
      {
        label: `TITLE (${result.meta.totalItems || 0})`,
        key: "title",
        userId: undefined as number | undefined,
      },
      ...room.users.map((member) => ({
        label: member.username,
        key: String(member.id),
        userId: member.id,
      })),
      {
        label: "ACTION",
        key: "action",
        userId: undefined as number | undefined,
      },
    ],
    [room.users, result.meta.totalItems],
  );
  const rows = useMemo(
    () =>
      result.data.map((movie) => ({
        ...movie,
        rates: new Map(
          movie.ratings.map((rating) => [String(rating.user.id), rating.rate]),
        ),
      })),
    [result.data],
  );
  return (
    <Table
      aria-label="Movies with ratings"
      classNames={{ wrapper: "rounded-[10px] border border-line bg-elevated p-3 shadow-none [&_table]:min-w-[720px] [&_th]:bg-surface [&_th]:py-3.5 [&_th]:text-sm [&_th]:font-semibold [&_th]:text-muted [&_td]:border-b [&_td]:border-line [&_td]:py-4 [&_td]:text-[15px] [&_td]:font-medium [&_td:first-child]:min-w-[260px] [&_td:first-child]:max-w-[440px] [&_tr:last-child_td]:border-b-0" }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>
            {column.userId !== undefined ? (
              <Button
                variant="light"
                className="font-semibold text-foreground"
                aria-label={`Sort by ${column.label}'s rating`}
                endContent={
                  filters.sortByUserId === String(column.userId) &&
                  filters.sortOrder === "asc" ? (
                    <ChevronUp className="w-4" />
                  ) : (
                    <ChevronDown className="w-4" />
                  )
                }
                onPress={() => onSort(column.userId!)}
              >
                {column.label}
              </Button>
            ) : (
              column.label
            )}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={rows}
        emptyContent={
          filters.search ||
          filters.startDate ||
          filters.endDate ||
          filters.isWatchTogether !== undefined
            ? "No movies match the current filters."
            : "No movies have been added yet."
        }
      >
        {(movie) => (
          <TableRow key={movie.id}>
            {(columnKey) => (
              <TableCell>
                {columnKey === "title" ? (
                  <div className="flex items-center gap-3">
                    {movie.poster_path && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL}w92${movie.poster_path}`}
                        alt=""
                        width={36}
                        height={54}
                        loading="lazy"
                        className="rounded-lg"
                      />
                    )}
                    <span>
                      {movie.title}
                      {/^\d{4}-/.test(movie.release_date || "") && (
                        <span className="text-primary-500 text-sm">
                          {" "}
                          - {movie.release_date.slice(0, 4)}
                        </span>
                      )}
                    </span>
                  </div>
                ) : columnKey === "action" ? (
                  <div className="flex items-center gap-3">
                    <Button
                      color="secondary"
                      size="sm"
                      isDisabled={disabled || !user}
                      onPress={() => onVote(movie.id)}
                    >
                      Vote
                    </Button>
                    {user &&
                      (user.role === "admin" ||
                        room.owner.id === user.id ||
                        movie.addedBy?.id === user.id) && (
                        <Button
                          size="sm"
                          color="danger"
                          isDisabled={disabled}
                          onPress={() => onDelete(movie.id)}
                        >
                          Delete
                        </Button>
                      )}
                  </div>
                ) : (
                  (movie.rates.get(String(columnKey)) ?? "Not Voted")
                )}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
