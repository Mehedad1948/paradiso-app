"use client";
import { useMemo, type CSSProperties } from "react";
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
import { PenNewSquareIcon, SortFromBottomToTopIcon, SortFromTopToBottomIcon, SortVerticalIcon, StarIcon, TrashBinMinimalisticIcon, UsersGroupTwoRoundedIcon } from "@solar-icons/react/linear";
import UserAvatar from "@/components/ui/UserAvatar";
import MoviePoster from "./MoviePoster";
import MovieLink from "@/features/movies/MovieLink";
import { ratingHue } from "../lib/ratingColor";
import ControversyCell from "./ControversyCell";
// Positions and timing live in CSS (nth-child); this only sets the count.
const PILL_SPARKLES = Array.from({ length: 6 });
/** Row tint keyed to the average: red through green, gold for 9 and up. */
function ratingTint(average: number | null) {
  if (average == null) return {};
  const rate = Number(average);
  return {
    className: "rating-row",
    "data-tier": rate >= 9 ? "gold" : undefined,
    style: { "--row-hue": ratingHue(rate) } as CSSProperties,
  };
}
/** Column header that sorts; the active one is tinted and shows its direction. */
function SortButton({
  label,
  description,
  avatar,
  active,
  order,
  onPress,
}: {
  label: string;
  description: string;
  /** Shown beside the label on large screens only. */
  avatar?: { name: string; src?: string | null };
  active: boolean;
  order?: "asc" | "desc" | null;
  onPress: () => void;
}) {
  const ascending = order === "asc";
  const Icon = !active
    ? SortVerticalIcon
    : ascending
      ? SortFromBottomToTopIcon
      : SortFromTopToBottomIcon;
  return (
    <Button
      size="sm"
      variant="light"
      className={`group gap-1.5 px-2.5 font-semibold transition-colors ${
        active
          ? "bg-accent/10 text-accent data-[hover=true]:bg-accent/15"
          : "text-muted data-[hover=true]:text-ink"
      }`}
      aria-label={
        active
          ? `Sorted by ${description}, ${ascending ? "lowest" : "highest"} first. Press to reverse.`
          : `Sort by ${description}`
      }
      startContent={
        avatar && (
          <UserAvatar
            name={avatar.name}
            src={avatar.src}
            size={22}
            className="max-lg:hidden"
            title={undefined}
          />
        )
      }
      endContent={
        <Icon
          size={15}
          aria-hidden="true"
          className={
            active
              ? undefined
              : "opacity-50 transition-opacity group-data-[hover=true]:opacity-100"
          }
        />
      }
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
export default function RoomRatingTable({
  result,
  room,
  user,
  isMember,
  filters,
  disabled,
  onSort,
  onSortAverage,
  onSortControversy,
  onVote,
  onDelete,
  onEdit,
}: {
  result: PaginatedResponse<MovieWithRatings>;
  room: Room;
  user?: User;
  /** Members are nudged about watched-together films they have not rated. */
  isMember: boolean;
  filters: RoomRatingFilters;
  disabled: boolean;
  onSort: (userId: number) => void;
  onSortAverage: () => void;
  onSortControversy: () => void;
  onVote: (movieId: string) => void;
  onDelete: (movieId: string) => void;
  onEdit: (movieId: string) => void;
}) {
  const columns = useMemo(
    () => [
      {
        label: `TITLE (${result.meta.totalItems || 0})`,
        key: "title",
        userId: undefined as number | undefined,
        avatar: undefined as { name: string; src?: string | null } | undefined,
      },
      ...room.users.map((member) => ({
        label: member.username,
        key: String(member.id),
        userId: member.id,
        avatar: { name: member.username, src: member.avatar },
      })),
      {
        label: "AVG",
        key: "average",
        userId: undefined as number | undefined,
      },
      {
        label: "DEBATE",
        key: "controversy",
        userId: undefined as number | undefined,
      },
      {
        label: "ACTION",
        key: "action",
        userId: undefined as number | undefined,
      },
    ],
    // Sort state is a dependency so the header collection, which caches cells by
    // column object, rebuilds and shows the newly active column.
    [room.users, result.meta.totalItems, filters.sortBy, filters.sortByUserId, filters.sortOrder],
  );
  const rows = useMemo(
    () =>
      result.data.map((movie) => ({
        ...movie,
        rates: new Map(
          movie.ratings.map((rating) => [String(rating.user.id), rating.rate]),
        ),
        awaitingMe: isMember && movie.isWatchedTogether && !movie.hasVoted,
      })),
    [result.data, isMember],
  );
  return (
    <Table
      aria-label="Movies with ratings"
      classNames={{ wrapper: "rounded-[10px] border border-line bg-elevated p-3 shadow-none [&_table]:min-w-[860px] [&_th]:bg-surface [&_th]:py-3.5 [&_th]:text-sm [&_th]:font-semibold [&_th]:text-muted [&_td]:border-b [&_td]:border-line [&_td]:py-4 [&_td]:text-[15px] [&_td]:font-medium [&_td:first-child]:min-w-[260px] [&_td:first-child]:max-w-[440px] [&_tr:last-child_td]:border-b-0" }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>
            {column.userId !== undefined ? (
              <SortButton
                label={column.label}
                avatar={column.avatar}
                description={`${column.label}'s rating`}
                active={
                  filters.sortBy === "userRate" &&
                  filters.sortByUserId === String(column.userId)
                }
                order={filters.sortOrder}
                onPress={() => onSort(column.userId!)}
              />
            ) : column.key === "average" ? (
              <SortButton
                label={column.label}
                description="average rating"
                active={filters.sortBy === "rate"}
                order={filters.sortOrder}
                onPress={onSortAverage}
              />
            ) : column.key === "controversy" ? (
              <SortButton
                label={column.label}
                description="controversy (how much raters disagree)"
                active={filters.sortBy === "controversy"}
                order={filters.sortOrder}
                onPress={onSortControversy}
              />
            ) : (
              column.label
            )}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={rows}
        emptyContent={
          filters.hasVoted === false &&
          !filters.search &&
          !filters.startDate &&
          !filters.endDate
            ? filters.isWatchTogether
              ? "All caught up. You have rated every film you watched together."
              : "All caught up. You have rated every film in this room."
            : filters.search ||
                filters.startDate ||
                filters.endDate ||
                filters.isWatchTogether !== undefined ||
                filters.hasVoted !== undefined
              ? "No movies match the current filters."
              : "No movies have been added yet."
        }
      >
        {(movie) => (
          <TableRow key={movie.id} {...ratingTint(movie.averageRate)}>
            {(columnKey) => (
              <TableCell>
                {columnKey === "title" ? (
                  <div className="flex items-center gap-3">
                    <MovieLink
                      movie={movie}
                      aria-label={`${movie.title} details`}
                      className="group/poster relative shrink-0 rounded-lg outline-offset-2"
                    >
                      <MoviePoster
                        path={movie.poster_path}
                        size="w92"
                        width={36}
                        height={54}
                        className="rounded-lg transition-[transform,box-shadow] duration-300 group-hover/poster:-translate-y-0.5 group-hover/poster:scale-[1.06] group-hover/poster:shadow-[0_10px_24px_-8px_rgb(0_0_0_/_55%)]"
                      />
                    </MovieLink>
                    <span>
                      <MovieLink
                        movie={movie}
                        className="underline-offset-4 decoration-accent/50 hover:underline"
                      >
                        {movie.title}
                      </MovieLink>
                      {/* Manual movies store only the year; TMDb ones a full date. */}
                      {/^\d{4}/.test(movie.release_date || "") && (
                        <span className="text-primary-500 text-sm">
                          {" "}
                          - {movie.release_date?.slice(0, 4)}
                        </span>
                      )}
                      {movie.isWatchedTogether && (
                        <span
                          className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${
                            movie.awaitingMe ? "text-accent" : "text-muted"
                          }`}
                        >
                          <UsersGroupTwoRoundedIcon size={13} aria-hidden="true" />
                          Watched together
                          {movie.awaitingMe && " · awaiting your rating"}
                        </span>
                      )}
                    </span>
                  </div>
                ) : columnKey === "average" ? (
                  movie.averageRate != null ? (
                    <span className="rating-pill">
                      {Number(movie.averageRate).toFixed(1)}
                      {Number(movie.averageRate) >= 9 && (
                        <span className="rating-pill-sparkles" aria-hidden="true">
                          {PILL_SPARKLES.map((_, index) => (
                            <span key={index} />
                          ))}
                        </span>
                      )}
                    </span>
                  ) : (
                    "-"
                  )
                ) : columnKey === "controversy" ? (
                  <ControversyCell variance={movie.rateVariance ?? null} />
                ) : columnKey === "action" ? (
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant={movie.hasVoted ? "flat" : "solid"}
                      color="secondary"
                      className={`font-semibold ${
                        movie.awaitingMe
                          ? "ring-2 ring-secondary/40 ring-offset-2 ring-offset-content1"
                          : ""
                      }`}
                      startContent={
                        <StarIcon
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
                          <>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            aria-label={`Edit ${movie.title}`}
                            title="Edit movie"
                            isDisabled={disabled}
                            onPress={() => onEdit(movie.id)}
                          >
                            <PenNewSquareIcon size={16} aria-hidden="true" />
                          </Button>
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
                            <TrashBinMinimalisticIcon size={16} aria-hidden="true" />
                          </Button>
                          </>
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
