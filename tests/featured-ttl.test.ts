import { describe, expect, it } from "vitest";
import { secondsUntilUtcMidnight, untilNextFeaturedDay } from "@/services/featured/ttl";

const at = (iso: string) => Date.parse(iso);

describe("featured artist cache lifetime", () => {
  it("counts down to the next 00:00 UTC", () => {
    expect(secondsUntilUtcMidnight(at("2026-10-29T00:00:00Z"))).toBe(86_400);
    expect(secondsUntilUtcMidnight(at("2026-10-29T12:00:00Z"))).toBe(43_200);
    expect(secondsUntilUtcMidnight(at("2026-10-29T23:59:59Z"))).toBe(1);
  });

  it("refreshes hourly but expires exactly at the rollover", () => {
    expect(untilNextFeaturedDay(at("2026-10-29T10:00:00Z"))).toEqual({
      stale: 300,
      revalidate: 3600,
      expire: 14 * 3600,
    });
    expect(untilNextFeaturedDay(at("2026-10-29T23:30:00Z"))).toEqual({
      stale: 300,
      revalidate: 1800,
      expire: 1800,
    });
  });

  it("stays above the prerender threshold in the last minutes of the day", () => {
    const life = untilNextFeaturedDay(at("2026-10-29T23:59:00Z"));
    expect(life.expire).toBe(300);
    expect(life.revalidate).toBe(300);
  });
});
