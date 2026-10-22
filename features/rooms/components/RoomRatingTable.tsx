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
import { ChevronDown, ChevronUp, Star, Trash2 } from "lucide-react";
import MoviePoster from "./MoviePoster";
export default function RoomRatingTable({
  result,
  room,
  user,
  filters,
  disabled,
  onSort,
  onSortAverage,
  onVote,
  onDelete,
}: {
  result: PaginatedResponse<MovieWithRatings>;
  room: Room;
  user?: User;
  filters: RoomRatingFilters;
  disabled: boolean;
  onSort: (userId: number) => void;
  onSortAverage: () => void;
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
        label: "AVG",
        key: "average",
        userId: undefined as number | undefined,
      },
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
            ) : column.key === "average" ? (
              <Button
                variant="light"
                className="font-semibold text-foreground"
                aria-label="Sort by average rating"
                endContent={
                  filters.sortBy === "rate" && filters.sortOrder === "asc" ? (
                    <ChevronUp className="w-4" />
                  ) : (
                    <ChevronDown className="w-4" />
                  )
                }
                onPress={onSortAverage}
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
                    <MoviePoster
                      path={movie.poster_path}
                      size="w92"
                      width={36}
                      height={54}
                      className="rounded-lg"
                    />
                    <span>
                      {movie.title}
                      {/* Manual movies store only the year; TMDb ones a full date. */}
                      {/^\d{4}/.test(movie.release_date || "") && (
                        <span className="text-primary-500 text-sm">
                          {" "}
                          - {movie.release_date?.slice(0, 4)}
                        </span>
                      )}
                    </span>
                  </div>
                ) : columnKey === "average" ? (
                  movie.averageRate != null ? (
                    Number(movie.averageRate).toFixed(1)
                  ) : (
                    "-"
                  )
                ) : columnKey === "action" ? (
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant={movie.hasVoted ? "flat" : "solid"}
                      color="secondary"
                      className="font-semibold"
                      startContent={
                        <Star
                          size={15}
                          aria-hidden="true"
                          className={movie.hasVoted ? "fill-current" : ""}
                        />
                      }
                      isDisabled={disabled || !user}
                      onPress={() => onVote(movie.id)}
                    >
                      {movie.hasVoted ? "Update" : "Vote"}
                    </Button>
                    {user &&
                      (user.role === "admin" ||
                        movie.addedBy?.id === user.id) && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="danger"
                            aria-label={`Remove ${movie.title}`}
                            title="Remove from room"
                            isDisabled={disabled}
                            onPress={() => onDelete(movie.id)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
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
