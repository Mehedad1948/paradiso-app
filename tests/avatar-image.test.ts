import { describe, expect, it } from "vitest";
import { NEUTRAL, adjustPixels, cssFilter } from "@/features/profile/lib/avatar-image";

const pixel = (...rgba: number[]) => new Uint8ClampedArray(rgba);

describe("avatar adjustments", () => {
  it("leaves pixels untouched at neutral", () => {
    expect(Array.from(adjustPixels(pixel(10, 120, 240, 255), NEUTRAL))).toEqual([10, 120, 240, 255]);
  });
  it("fully desaturates to a single grey and keeps alpha", () => {
    const [r, g, b, a] = Array.from(adjustPixels(pixel(200, 40, 90, 128), { ...NEUTRAL, saturation: -100 }));
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(a).toBe(128);
  });
  it("brightens and clamps at white", () => {
    expect(Array.from(adjustPixels(pixel(100, 250, 0, 255), { ...NEUTRAL, brightness: 100 }))).toEqual([
      150, 255, 0, 255,
    ]);
  });
  it("matches the CSS preview amounts", () => {
    expect(cssFilter({ brightness: 100, contrast: -100, saturation: 50 })).toBe(
      "brightness(1.5) contrast(0.5) saturate(1.5)",
    );
  });
});
