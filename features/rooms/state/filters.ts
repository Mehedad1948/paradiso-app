import type { RoomRatingFilters } from "@/types/rooms";

export function positivePage(
  value: string | null,
  fallback = 1,
  max = Number.MAX_SAFE_INTEGER,
) {
  const number = Number(value);
  return /^[1-9]\d*$/.test(value || "") &&
    Number.isSafeInteger(number) &&
    number <= max
    ? number
    : fallback;
}
function validDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}
export function readRoomFilters(
  params: Pick<URLSearchParams, "get">,
): RoomRatingFilters & { page: number; limit: number } {
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");
  let startDate = validDate(params.get("startDate"));
  let endDate = validDate(params.get("endDate"));
  if (startDate && endDate && startDate > endDate) {
    startDate = undefined;
    endDate = undefined;
  }
  const together = params.get("isWatchTogether");
  const userId = params.get("sortByUserId");
  return {
    page: positivePage(params.get("page")),
    limit: positivePage(params.get("limit"), 10, 100),
    search: params.get("search")?.trim().slice(0, 200) || undefined,
    sortBy: sortBy === "rate" || sortBy === "userRate" ? sortBy : undefined,
    sortOrder:
      sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
    sortByUserId:
      sortBy === "userRate" && userId && positivePage(userId, 0)
        ? userId
        : undefined,
    startDate,
    endDate,
    isWatchTogether:
      together === "true" ? true : together === "false" ? false : undefined,
  };
}
export type QueryPatch = Record<string, string | number | null | undefined>;
export function patchQuery(source: string, patch: QueryPatch) {
  const params = new URLSearchParams(source);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "")
      params.delete(key);
    else params.set(key, String(value));
  }
  return params.toString();
}
