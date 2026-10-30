import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addToast, dismissToast } from "@/components/ui/toast";
import { getSnapshot } from "@/components/ui/toast/store";

const open = () => getSnapshot().filter((item) => !item.closing);

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  getSnapshot().forEach((item) => dismissToast(item.id));
  vi.runAllTimers();
  vi.useRealTimers();
});

describe("toast store", () => {
  it("keeps a toast closing until its exit has played, then removes it", () => {
    const id = addToast({ title: "Saved", color: "success" });
    dismissToast(id);
    expect(getSnapshot().find((item) => item.id === id)?.closing).toBe("default");
    vi.advanceTimersByTime(400);
    expect(getSnapshot().some((item) => item.id === id)).toBe(false);
  });

  it("refreshes an identical message instead of stacking it", () => {
    const first = addToast({ title: "Link copied", color: "success" });
    const second = addToast({ title: "Link copied", color: "success" });
    expect(second).toBe(first);
    expect(open()).toHaveLength(1);
    expect(open()[0].rev).toBe(1);
  });

  it("stacks messages that differ in color or text", () => {
    addToast({ title: "Link copied", color: "success" });
    addToast({ title: "Link copied", color: "danger" });
    addToast({ title: "Another" });
    expect(open()).toHaveLength(3);
  });

  it("never stacks more than four, retiring the oldest first", () => {
    const ids = Array.from({ length: 6 }, (_, index) => addToast({ title: `Toast ${index}` }));
    expect(open().map((item) => item.id)).toEqual(ids.slice(2));
  });

  it("gives problems and longer messages more time, and honors an explicit timeout", () => {
    const quick = addToast({ title: "Saved" });
    const failure = addToast({ title: "Boom", color: "danger" });
    const wordy = addToast({ title: "x".repeat(200) });
    const sticky = addToast({ title: "Reload", timeout: 0 });
    const byId = (id: number) => getSnapshot().find((item) => item.id === id)!;
    expect(byId(quick).timeout).toBe(4000);
    expect(byId(failure).timeout).toBe(5500);
    expect(byId(wordy).timeout).toBe(9000);
    expect(byId(sticky).timeout).toBe(0);
  });

  it("ignores dismissing a toast twice", () => {
    const id = addToast({ title: "Once" });
    dismissToast(id, "swipe");
    dismissToast(id);
    expect(getSnapshot().find((item) => item.id === id)?.closing).toBe("swipe");
  });
});
