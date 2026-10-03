"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { patchQuery, readRoomFilters, type QueryPatch } from "../state/filters";

export function useRoomUrl() {
  const params = useSearchParams();
  const pathname = usePathname();
  const filters = useMemo(() => readRoomFilters(params), [params]);
  const update = useCallback(
    (patch: QueryPatch, replace = false) => {
      // A queued search from an inactive page must not modify the current route.
      if (window.location.pathname !== pathname) return;
      const query = patchQuery(window.location.search, patch);
      const url = `${pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      if (
        url ===
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      )
        return;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [pathname],
  );
  const setPage = useCallback(
    (page: number) => update({ page: page === 1 ? null : page }),
    [update],
  );
  const setSearch = useCallback(
    (search: string) =>
      update({ search: search.trim() || null, page: null }, true),
    [update],
  );
  const sortByUser = useCallback(
    (userId: number) =>
      update({
        sortBy: "userRate",
        sortByUserId: userId,
        page: null,
        sortOrder:
          filters.sortBy === "userRate" &&
          filters.sortByUserId === String(userId) &&
          filters.sortOrder !== "asc"
            ? "asc"
            : "desc",
      }),
    [update, filters.sortBy, filters.sortByUserId, filters.sortOrder],
  );
  return { params, filters, update, setPage, setSearch, sortByUser };
}
