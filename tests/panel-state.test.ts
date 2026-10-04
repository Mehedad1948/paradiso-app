// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
import {
  useAddMovie,
  useRoomRatings,
  useVote,
} from "@/hooks/queries/useRoomQueries";
import { useDebouncedSearch } from "@/features/rooms/hooks/useDebouncedSearch";
vi.mock("@heroui/toast", () => ({ addToast: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client, children });
  return { client, wrapper };
}
describe("panel mutation state", () => {
  it("invalidates only affected room data after adding a movie", async () => {
    vi.spyOn(panelApi, "addMovie").mockResolvedValue({ message: "Added", movieId: "movie-1", apiVersion: "1" });
    const { client, wrapper } = setup();
    const keys = [
      panelKeys.room("1"),
      [...panelKeys.ratings("1"), { page: 1 }],
      [...panelKeys.invitations("1"), 1],
      [...panelKeys.links("1"), 1],
      panelKeys.room("2"),
    ];
    keys.forEach((key) => client.setQueryData(key, { fixture: true }));
    const hook = renderHook(() => useAddMovie("1"), { wrapper });
    act(() => hook.result.current.execute({ roomId: "1", dbId: 7 }));
    await waitFor(() =>
      expect(client.getQueryState(keys[0])?.isInvalidated).toBe(true),
    );
    expect(client.getQueryState(keys[1])?.isInvalidated).toBe(true);
    for (const key of keys.slice(2))
      expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });
  it("prevents immediate duplicate votes and waits for invalidation before closing", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof panelApi.vote>>) => void;
    const vote = vi.spyOn(panelApi, "vote").mockImplementation(
      () =>
        new Promise((complete) => {
          resolve = complete;
        }),
    );
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const close = vi.fn();
    const hook = renderHook(() => useVote("1", { onSuccess: close }), {
      wrapper,
    });
    act(() => {
      hook.result.current.execute({ roomId: "1", movieId: "movie-1", rate: 0 });
      hook.result.current.execute({ roomId: "1", movieId: "movie-1", rate: 0 });
    });
    await waitFor(() => expect(hook.result.current.isPending).toBe(true));
    expect(vote).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    await act(async () => resolve({} as Awaited<ReturnType<typeof panelApi.vote>>));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(invalidate.mock.invocationCallOrder[0]).toBeLessThan(
      close.mock.invocationCallOrder[0],
    );
    await waitFor(() => expect(hook.result.current.isPending).toBe(false));
  });
  it("still invalidates server data after leaving a dialog, without a late close callback", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof panelApi.vote>>) => void;
    vi.spyOn(panelApi, "vote").mockImplementation(
      () =>
        new Promise((complete) => {
          resolve = complete;
        }),
    );
    const { client, wrapper } = setup();
    const key = [...panelKeys.ratings("1"), { page: 1 }];
    client.setQueryData(key, { fixture: true });
    const close = vi.fn();
    const hook = renderHook(() => useVote("1", { onSuccess: close }), {
      wrapper,
    });
    act(() =>
      hook.result.current.execute({ roomId: "1", movieId: "movie-1", rate: 4 }),
    );
    await waitFor(() => expect(hook.result.current.isPending).toBe(true));
    hook.unmount();
    resolve({} as Awaited<ReturnType<typeof panelApi.vote>>);
    await waitFor(() =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(true),
    );
    expect(close).not.toHaveBeenCalled();
  });
});
describe("panel query identity", () => {
  it("keeps rows for pagination within a room but never carries them into another room", async () => {
    const first = {
      data: [{ id: "first-room-movie" }],
      meta: { totalPages: 2 },
    } as Awaited<ReturnType<typeof panelApi.ratings>>;
    vi.spyOn(panelApi, "ratings")
      .mockResolvedValueOnce(first)
      .mockImplementation(() => new Promise(() => {}));
    const { wrapper } = setup();
    const hook = renderHook(({ id, page }) => useRoomRatings(id, { page }), {
      wrapper,
      initialProps: { id: "1", page: 1 },
    });
    await waitFor(() => expect(hook.result.current.data).toEqual(first));
    hook.rerender({ id: "1", page: 2 });
    expect(hook.result.current.data).toEqual(first);
    expect(hook.result.current.isPlaceholderData).toBe(true);
    hook.rerender({ id: "2", page: 1 });
    expect(hook.result.current.data).toBeUndefined();
    expect(hook.result.current.isPending).toBe(true);
  });
});
describe("search draft lifecycle", () => {
  it("debounces typing, clears immediately, and cancels pending changes on navigation", () => {
    vi.useFakeTimers();
    const commit = vi.fn();
    const hook = renderHook(({ value }) => useDebouncedSearch(value, commit), {
      initialProps: { value: "" },
    });
    act(() => {
      hook.result.current.change("one");
      hook.result.current.change("two");
    });
    expect(commit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(400));
    expect(commit).toHaveBeenLastCalledWith("two");
    act(() => hook.result.current.change(""));
    expect(commit).toHaveBeenLastCalledWith("");
    act(() => hook.result.current.change("pending"));
    hook.rerender({ value: "from-back-navigation" });
    expect(hook.result.current.draft).toBe("from-back-navigation");
    act(() => vi.advanceTimersByTime(500));
    expect(commit).toHaveBeenCalledTimes(2);
    act(() => hook.result.current.change("after-leaving"));
    hook.unmount();
    act(() => vi.advanceTimersByTime(500));
    expect(commit).toHaveBeenCalledTimes(2);
  });
});
