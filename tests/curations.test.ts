import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: {
    landingGrid: vi.fn(),
    saveLandingGrid: vi.fn(),
    editorsPicks: vi.fn(),
    saveEditorsPicks: vi.fn(),
    moviePosters: vi.fn(),
    searchLibrary: vi.fn(),
  },
  revalidateTag: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock("@/services/curations/admin", () => ({ default: mocks.admin }));
vi.mock("@/services/backend", () => ({ backendRequest: vi.fn() }));

import { dailyPicks, utcDay } from "@/lib/curations/daily";
import { GRID_SLOTS, gridCells } from "@/lib/curations/grid";
import { handleAdminRequest } from "@/lib/bff/curations";
import { InputError } from "@/lib/bff/validation";
import type { LandingGridItem } from "@/types/curations";

const movieId = "3f1c2a9e-8d7b-4c6a-9e5f-0a1b2c3d4e5f";
const otherId = "4a2d3b0f-9e8c-4d7b-8f60-1b2c3d4e5f60";
const thirdId = "5b3e4c10-0f9d-4e8c-9071-2c3d4e5f6071";
const ok = (result: unknown) => ({ result, response: { ok: true, status: 200, statusText: "OK" } });
const movie = (id: string, poster: string | null = "/p.jpg") => ({
  id,
  dbId: 1,
  title: `Film ${id}`,
  poster_path: poster,
  release_date: null,
});

describe("daily picks", () => {
  const pool = Array.from({ length: 20 }, (_, i) => i);

  it("names the UTC day", () => {
    expect(utcDay(Date.parse("2026-10-29T23:59:59Z"))).toBe("2026-10-29");
    expect(utcDay(Date.parse("2026-10-30T00:00:00Z"))).toBe("2026-10-30");
  });

  it("draws the same films all day and a different draw the next", () => {
    const today = dailyPicks(pool, "2026-10-29", 10);
    expect(dailyPicks(pool, "2026-10-29", 10)).toEqual(today);
    expect(dailyPicks(pool, "2026-10-30", 10)).not.toEqual(today);
    expect(new Set(today).size).toBe(10);
    expect(today.every((item) => pool.includes(item))).toBe(true);
  });

  it("shows a small pool whole and never touches the input", () => {
    const small = [1, 2, 3];
    expect(dailyPicks(small, "2026-10-29", 10).sort()).toEqual([1, 2, 3]);
    expect(small).toEqual([1, 2, 3]);
    expect(dailyPicks([], "2026-10-29", 10)).toEqual([]);
  });
});

describe("grid cells", () => {
  it("falls back to the built-in frames when the curation can't be read", () => {
    const cells = gridCells(null);
    expect(cells).toHaveLength(GRID_SLOTS);
    expect(cells.every((cell) => cell.art && cell.tmdbId && !cell.movie)).toBe(true);
  });

  it("places stored items by slot and keeps empty frames", () => {
    const items: LandingGridItem[] = [
      { slot: 0, imageUrl: "/posters/grids/blue/tree-of-life.jpg", objectPosition: "center 40%", movie: movie("a") },
      { slot: 5, imageUrl: null, objectPosition: null, movie: movie("b") },
      { slot: 6, imageUrl: "https://elsewhere.example/x.jpg", objectPosition: null, movie: movie("c") },
      { slot: 99, imageUrl: null, objectPosition: null, movie: movie("d") },
    ];
    const cells = gridCells(items);
    expect(cells).toHaveLength(GRID_SLOTS);
    expect(cells[0]).toMatchObject({
      art: { src: "/posters/grids/blue/tree-of-life.jpg", position: "center 40%", optimizable: true },
      movie: { id: "a" },
    });
    expect(cells[5].art).toMatchObject({ src: expect.stringMatching(/w342\/p\.jpg$/), position: "center" });
    // A host next/image isn't configured for is served as is instead of failing.
    expect(cells[6].art?.optimizable).toBe(false);
    expect(cells[1]).toEqual({ slot: 1, row: 1, column: 4 });
    expect(cells.filter((cell) => cell.movie)).toHaveLength(3);
  });
});

describe("admin curations BFF", () => {
  const request = (path: string, method: string, data: Record<string, unknown> = {}, query = "") =>
    handleAdminRequest({
      path: path.split("/"),
      method,
      query: new URLSearchParams(query),
      data: async () => data,
      signal: new AbortController().signal,
    });

  beforeEach(() => {
    for (const fn of Object.values(mocks.admin)) fn.mockResolvedValue(ok({ data: [] }));
  });

  it("saves a grid with blanks as null and expires the landing's copy", async () => {
    await request("curations/landing-grid", "PUT", {
      items: [{ slot: 3, movieId, imageUrl: "  ", objectPosition: " center 35% " }],
    });
    expect(mocks.admin.saveLandingGrid).toHaveBeenCalledWith([
      { slot: 3, movieId, imageUrl: null, objectPosition: "center 35%" },
    ]);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("curation:landing-grid", { expire: 0 });
  });

  it("leaves the cache alone when the backend refuses the save", async () => {
    mocks.admin.saveEditorsPicks.mockResolvedValue({
      result: null,
      response: { ok: false, status: 422, statusText: "", message: "no poster" },
    });
    const result = await request("curations/editors-picks", "PUT", { items: [{ movieId }] });
    expect(result.response.status).toBe(422);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it.each([
    [{ items: [{ slot: GRID_SLOTS, movieId }] }],
    [{ items: [{ slot: 1.5, movieId }] }],
    [{ items: [{ slot: 0, movieId: "nope" }] }],
    [{ items: [{ slot: 0, movieId, imageUrl: "//evil.example/x.jpg" }] }],
    [{ items: [{ slot: 0, movieId, imageUrl: "http://plain.example/x.jpg" }] }],
    [{ items: "all" }],
  ])("rejects a malformed grid before the backend: %j", async (data) => {
    await expect(request("curations/landing-grid", "PUT", data)).rejects.toBeInstanceOf(InputError);
    expect(mocks.admin.saveLandingGrid).not.toHaveBeenCalled();
  });

  it("caps the picks pool", async () => {
    await expect(
      request("curations/editors-picks", "PUT", { items: Array(41).fill({ movieId }) }),
    ).rejects.toBeInstanceOf(InputError);
  });

  it("saves picks with their covers, blanks as null, and never sends movieIds", async () => {
    const cover = "https://image.tmdb.org/t/p/w500/abc123.jpg";
    await request("curations/editors-picks", "PUT", {
      items: [{ movieId, imageUrl: cover }, { movieId: otherId, imageUrl: "  " }, { movieId: thirdId }],
    });
    expect(mocks.admin.saveEditorsPicks).toHaveBeenCalledWith([
      { movieId, imageUrl: cover },
      { movieId: otherId, imageUrl: null },
      { movieId: thirdId, imageUrl: null },
    ]);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("curation:editors-picks", { expire: 0 });
  });

  it.each([
    [{ movieIds: [movieId] }],
    [{ items: [{ movieId, imageUrl: "https://evil.example/t/p/w500/x.jpg" }] }],
    [{ items: [{ movieId, imageUrl: "http://image.tmdb.org/t/p/w500/x.jpg" }] }],
    [{ items: [{ movieId, imageUrl: "/t/p/w500/x.jpg" }] }],
    [{ items: [{ movieId: "nope" }] }],
  ])("rejects malformed picks before the backend: %j", async (data) => {
    await expect(request("curations/editors-picks", "PUT", data)).rejects.toBeInstanceOf(InputError);
    expect(mocks.admin.saveEditorsPicks).not.toHaveBeenCalled();
  });

  it("lists a film's posters by its library id", async () => {
    await request(`curations/movies/${movieId}/posters`, "GET");
    expect(mocks.admin.moviePosters).toHaveBeenCalledWith(movieId, expect.anything());
    await expect(request("curations/movies/nope/posters", "GET")).rejects.toBeInstanceOf(InputError);
  });

  it("searches the library only for a real term and keeps the fields the pickers need", async () => {
    expect((await request("library", "GET", {}, "search=%20")).result).toEqual([]);
    expect(mocks.admin.searchLibrary).not.toHaveBeenCalled();
    mocks.admin.searchLibrary.mockResolvedValue(ok({ data: [{ ...movie(movieId), overview: "long" }] }));
    const result = await request("library", "GET", {}, "search=dune");
    expect(mocks.admin.searchLibrary).toHaveBeenCalledWith("dune", 1, expect.anything());
    expect(result.result).toEqual([movie(movieId)]);
  });

  it("refuses unknown admin routes", async () => {
    await expect(request("curations/other", "GET")).rejects.toMatchObject({ status: 404 });
  });
});
