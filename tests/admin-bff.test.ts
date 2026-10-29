import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: {
    featuredDays: vi.fn(),
    setFeaturedDay: vi.fn(),
    removeFeaturedDay: vi.fn(),
    candidates: vi.fn(),
    saveCandidate: vi.fn(),
    removeCandidate: vi.fn(),
    searchPeople: vi.fn(),
    previewPerson: vi.fn(),
    syncGenres: vi.fn(),
    renameGenre: vi.fn(),
    removeGenre: vi.fn(),
  },
  movies: { searchDbMovies: vi.fn(), resolve: vi.fn() },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/services/admin", () => ({ default: mocks.admin }));
vi.mock("@/services/movies", () => ({ moviesServices: mocks.movies }));

import { handleAdminToolsRequest } from "@/lib/bff/admin";
import { InputError } from "@/lib/bff/validation";

const ok = (result: unknown) => ({ result, response: { ok: true, status: 200, statusText: "OK" } });
const call = (
  path: string,
  method = "GET",
  { query = "", body = {} }: { query?: string; body?: Record<string, unknown> } = {},
) =>
  handleAdminToolsRequest({
    path: path.split("/"),
    method,
    query: new URLSearchParams(query),
    data: async () => body,
    signal: new AbortController().signal,
  });

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(mocks.admin)) fn.mockResolvedValue(ok({}));
  mocks.movies.resolve.mockResolvedValue(ok({ id: "x" }));
});

describe("admin featured days", () => {
  it("lists a range of days", async () => {
    await call("featured/days", "GET", { query: "from=2026-10-01&to=2026-11-01" });
    expect(mocks.admin.featuredDays).toHaveBeenCalledWith("2026-10-01", "2026-11-01", expect.anything());
  });

  it("rejects a bad or over-long range", async () => {
    await expect(call("featured/days", "GET", { query: "from=nope&to=2026-11-01" })).rejects.toBeInstanceOf(InputError);
    await expect(call("featured/days", "GET", { query: "from=2026-01-01&to=2026-12-31" })).rejects.toThrow("Range too long");
  });

  it("schedules a person with a trimmed tagline", async () => {
    await call("featured/days/2026-10-30", "PUT", { body: { tmdbPersonId: 525, tagline: "  A master  " } });
    expect(mocks.admin.setFeaturedDay).toHaveBeenCalledWith("2026-10-30", 525, "A master");
  });

  it("refuses a tagline over 140 characters and a bad person", async () => {
    await expect(
      call("featured/days/2026-10-30", "PUT", { body: { tmdbPersonId: 525, tagline: "x".repeat(141) } }),
    ).rejects.toBeInstanceOf(InputError);
    await expect(call("featured/days/2026-10-30", "PUT", { body: { tmdbPersonId: "abc" } })).rejects.toBeInstanceOf(InputError);
    expect(mocks.admin.setFeaturedDay).not.toHaveBeenCalled();
  });

  it("removes a day", async () => {
    await call("featured/days/2026-10-30", "DELETE");
    expect(mocks.admin.removeFeaturedDay).toHaveBeenCalledWith("2026-10-30");
  });
});

describe("admin candidates", () => {
  it("lists with filters and paging defaults", async () => {
    await call("featured/candidates", "GET", { query: "blocked=true" });
    expect(mocks.admin.candidates).toHaveBeenCalledWith(
      { boosted: undefined, blocked: true, page: 1, limit: 20 },
      expect.anything(),
    );
  });

  it("sends only the fields that were given", async () => {
    await call("featured/candidates/525", "PUT", { body: { boost: 3 } });
    expect(mocks.admin.saveCandidate).toHaveBeenCalledWith(525, { boost: 3 });
  });

  it("validates boost, blocked and note", async () => {
    await expect(call("featured/candidates/525", "PUT", { body: { boost: 11 } })).rejects.toBeInstanceOf(InputError);
    await expect(call("featured/candidates/525", "PUT", { body: { blocked: "yes" } })).rejects.toBeInstanceOf(InputError);
    await expect(call("featured/candidates/525", "PUT", { body: { note: "n".repeat(501) } })).rejects.toBeInstanceOf(InputError);
  });
});

describe("admin people, genres and TMDb", () => {
  it("searches people and previews one", async () => {
    await call("featured/people", "GET", { query: "query=nolan&page=2" });
    expect(mocks.admin.searchPeople).toHaveBeenCalledWith("nolan", 2, expect.anything());
    await call("featured/people/525/preview", "GET");
    expect(mocks.admin.previewPerson).toHaveBeenCalledWith(525, expect.anything());
  });

  it("renames and deletes a genre by uuid only", async () => {
    const id = "3f1c2a9e-8d7b-4c6a-9e5f-0a1b2c3d4e5f";
    await call(`genres/${id}`, "PATCH", { body: { name: "Sci-fi" } });
    expect(mocks.admin.renameGenre).toHaveBeenCalledWith(id, "Sci-fi");
    await call(`genres/${id}`, "DELETE");
    expect(mocks.admin.removeGenre).toHaveBeenCalledWith(id);
    await expect(call("genres/not-a-uuid", "DELETE")).rejects.toBeInstanceOf(InputError);
  });

  it("imports a TMDb film into the library", async () => {
    await call("library/import", "POST", { body: { tmdbId: 603 } });
    expect(mocks.movies.resolve).toHaveBeenCalledWith(603);
  });

  it("leaves unknown routes to the caller", async () => {
    expect(await call("nothing/here")).toBeNull();
  });
});
