import { describe, expect, it } from "vitest";
import {
  patchQuery,
  positivePage,
  readRoomFilters,
} from "@/features/rooms/state/filters";
import { queryString } from "@/lib/api/client";
describe("room URL state", () => {
  it.each([
    "-1",
    "0",
    "1.5",
    "Infinity",
    "NaN",
    "1e3",
    "999999999999999999999",
    "",
  ])("defaults invalid page %s", (value) => {
    expect(positivePage(value)).toBe(1);
  });
  it("normalizes malformed filters before constructing a query or request", () => {
    const filters = readRoomFilters(
      new URLSearchParams(
        "page=-1&limit=1000&sortBy=invalid&sortOrder=no&startDate=broken&endDate=also-broken&isWatchTogether=maybe&sortByUserId=NaN",
      ),
    );
    expect(filters).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: undefined,
      sortOrder: undefined,
      sortByUserId: undefined,
      startDate: undefined,
      endDate: undefined,
      isWatchTogether: undefined,
    });
    expect(() => queryString(filters)).not.toThrow();
  });
  it("preserves valid encoded searches, dates, sorting and false filters", () => {
    const params = new URLSearchParams({
      page: "2",
      limit: "100",
      search: " a&b ",
      sortBy: "userRate",
      sortByUserId: "3",
      sortOrder: "asc",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      isWatchTogether: "false",
    });
    const filters = readRoomFilters(params);
    expect(filters).toMatchObject({
      page: 2,
      limit: 100,
      search: "a&b",
      sortByUserId: "3",
      isWatchTogether: false,
    });
    expect(new URLSearchParams(queryString(filters)).get("startDate")).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });
  it("ignores inverted date ranges", () => {
    const filters = readRoomFilters(
      new URLSearchParams("startDate=2026-02-01&endDate=2026-01-01"),
    );
    expect(filters.startDate).toBeUndefined();
    expect(filters.endDate).toBeUndefined();
  });
  it("updates filters atomically, removes defaults, and preserves independent list/dialog state", () => {
    const result = new URLSearchParams(
      patchQuery("page=4&search=old&dialog=invite&myPage=2&allPage=3", {
        search: "a&b",
        page: null,
      }),
    );
    expect(result.get("search")).toBe("a&b");
    expect(result.has("page")).toBe(false);
    expect(result.get("dialog")).toBe("invite");
    expect(result.get("myPage")).toBe("2");
    expect(result.get("allPage")).toBe("3");
  });
});
