// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { Activity, createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { startCooldown, useCooldown } from "@/hooks/auth/useCooldown";
import { useAuthLimit } from "@/hooks/auth/useAuthLimit";
import { BffError } from "@/lib/api/client";
import type { AuthResult } from "@/types/auth";

const client = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}
beforeEach(() => {
  window.sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("auth request state", () => {
  it("guards repeated submissions and stays pending until the response arrives", async () => {
    let resolve!: (result: AuthResult) => void;
    const operation = vi.fn(
      () =>
        new Promise<AuthResult>((complete) => {
          resolve = complete;
        }),
    );
    const success = vi.fn();
    const { result } = renderHook(() => useAuthForm(operation), {
      wrapper: wrapper(client()),
    });
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit(undefined, success);
      void result.current.submit(undefined, success);
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(operation).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve({ message: "Done" });
      await pending;
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(success).toHaveBeenCalledTimes(1);
  });
  it("exits pending state and shows a recoverable error after a thrown request", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(
        new BffError("Unable to connect. Please try again.", 0),
      )
      .mockResolvedValueOnce({ message: "Done" });
    const success = vi.fn();
    const { result } = renderHook(() => useAuthForm(operation), {
      wrapper: wrapper(client()),
    });
    await act(() => result.current.submit(undefined, success));
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toContain("Unable to connect");
    });
    expect(success).not.toHaveBeenCalled();
    act(() => result.current.clearError());
    await waitFor(() => expect(result.current.error).toBeUndefined());
    await act(() => result.current.submit(undefined, success));
    expect(success).toHaveBeenCalledTimes(1);
  });
  it("cancels in-flight private queries before clearing identity-dependent cached data", async () => {
    const queryClient = client();
    queryClient.setQueryData(["me"], { id: "previous-user" });
    const cancel = vi.spyOn(queryClient, "cancelQueries");
    const clear = vi.spyOn(queryClient, "clear");
    const { result } = renderHook(
      () =>
        useAuthForm(
          async () => ({ message: "Signed in", authenticated: true }),
          true,
        ),
      { wrapper: wrapper(queryClient) },
    );
    await act(() => result.current.submit(undefined, () => {}));
    expect(cancel).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      clear.mock.invocationCallOrder[0],
    );
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
  });
  it("does not redirect or notify after leaving the form while a request is pending", async () => {
    let resolve!: (result: AuthResult) => void;
    const operation = () =>
      new Promise<AuthResult>((complete) => {
        resolve = complete;
      });
    const success = vi.fn();
    const { result, unmount } = renderHook(() => useAuthForm(operation), {
      wrapper: wrapper(client()),
    });
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit(undefined, success);
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    unmount();
    resolve({ message: "Done" });
    await pending;
    expect(success).not.toHaveBeenCalled();
  });
  it("clears errors when a retained auth page becomes visible again", async () => {
    let mode: "visible" | "hidden" = "visible";
    const queryClient = client();
    const retainedWrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Activity, { mode, children }),
      );
    const hook = renderHook(
      () =>
        useAuthForm(async () => {
          throw new BffError("Old sign-in error", 401);
        }),
      { wrapper: retainedWrapper },
    );
    await act(() => hook.result.current.submit(undefined, () => {}));
    await waitFor(() =>
      expect(hook.result.current.error).toBe("Old sign-in error"),
    );
    mode = "hidden";
    hook.rerender();
    mode = "visible";
    hook.rerender();
    await waitFor(() => expect(hook.result.current.error).toBeUndefined());
  });
  it("ignores an earlier request after hiding and re-entering a retained page", async () => {
    let mode: "visible" | "hidden" = "visible";
    let resolve!: (result: AuthResult) => void;
    const queryClient = client();
    const retainedWrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Activity, { mode, children }),
      );
    const hook = renderHook(
      () =>
        useAuthForm(
          () =>
            new Promise<AuthResult>((complete) => {
              resolve = complete;
            }),
        ),
      { wrapper: retainedWrapper },
    );
    const success = vi.fn();
    let pending!: Promise<void>;
    act(() => {
      pending = hook.result.current.submit(undefined, success);
    });
    await waitFor(() => expect(hook.result.current.isPending).toBe(true));
    mode = "hidden";
    hook.rerender();
    mode = "visible";
    hook.rerender();
    await act(async () => {
      resolve({ message: "Done" });
      await pending;
    });
    expect(success).not.toHaveBeenCalled();
  });
});
describe("reset-code cooldown", () => {
  it("restores the same deadline after navigation and expires without restarting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    startCooldown("reset-code", "User@example.test", 120);
    const first = renderHook(() => useCooldown("reset-code", "user@example.test"));
    expect(first.result.current.secondsLeft).toBe(120);
    act(() => vi.advanceTimersByTime(45_000));
    expect(first.result.current.secondsLeft).toBe(75);
    first.unmount();
    const second = renderHook(() => useCooldown("reset-code", "user@example.test"));
    expect(second.result.current.secondsLeft).toBe(75);
    act(() => vi.advanceTimersByTime(80_000));
    expect(second.result.current.secondsLeft).toBe(0);
  });
  it("does not apply another email's cooldown and starts only after a successful request", () => {
    vi.useFakeTimers();
    startCooldown("reset-code", "first@example.test", 120);
    const hook = renderHook(({ email }) => useCooldown("reset-code", email), {
      initialProps: { email: "first@example.test" },
    });
    expect(hook.result.current.secondsLeft).toBe(120);
    hook.rerender({ email: "second@example.test" });
    expect(hook.result.current.secondsLeft).toBe(0);
    act(() => hook.result.current.start(120));
    expect(hook.result.current.secondsLeft).toBe(120);
  });
});
describe("rate-limit lockout", () => {
  const clock = (iso: string) => vi.useFakeTimers({ toFake: ["Date"] }) && vi.setSystemTime(new Date(iso));
  const elapse = (ms: number) => {
    vi.setSystemTime(Date.now() + ms);
    act(() => void window.dispatchEvent(new Event("focus")));
  };
  function limited(operation: () => Promise<AuthResult>, email = "user@example.test") {
    return renderHook(
      () => {
        const form = useAuthForm(operation);
        return { form, limit: useAuthLimit(form, "sign-in", email) };
      },
      { wrapper: wrapper(client()) },
    );
  }
  it("locks the form for Retry-After seconds, shows its own countdown, and never retries", async () => {
    clock("2026-01-01T00:00:00Z");
    const operation = vi
      .fn<() => Promise<AuthResult>>()
      .mockRejectedValue(new BffError("Too many attempts. Try again in 30 seconds.", 429, undefined, 30));
    const hook = limited(operation);
    await act(() => hook.result.current.form.submit(undefined, () => {}));
    await waitFor(() => expect(hook.result.current.limit.locked).toBe(true));
    expect(operation).toHaveBeenCalledTimes(1);
    expect(hook.result.current.limit.error).toBe("Too many attempts. Try again in 30s.");
    elapse(10_000);
    expect(hook.result.current.limit.error).toBe("Too many attempts. Try again in 20s.");
    elapse(21_000);
    expect(hook.result.current.limit.locked).toBe(false);
    expect(hook.result.current.limit.error).toBeUndefined();
    expect(operation).toHaveBeenCalledTimes(1);
  });
  it("keeps the lock across a reload and falls back to 60s without Retry-After", async () => {
    clock("2026-01-01T00:00:00Z");
    const hook = limited(() => Promise.reject(new BffError("Slow down.", 429)));
    await act(() => hook.result.current.form.submit(undefined, () => {}));
    await waitFor(() => expect(hook.result.current.limit.secondsLeft).toBe(60));
    hook.unmount();
    const reloaded = limited(async () => ({ message: "ok" }));
    expect(reloaded.result.current.limit.locked).toBe(true);
    const other = limited(async () => ({ message: "ok" }), "someone@else.test");
    expect(other.result.current.limit.locked).toBe(false);
  });
  it("does not treat a wrong password as a rate limit", async () => {
    const hook = limited(() => Promise.reject(new BffError("Your email or password is incorrect.", 401)));
    await act(() => hook.result.current.form.submit(undefined, () => {}));
    await waitFor(() =>
      expect(hook.result.current.limit.error).toBe("Your email or password is incorrect."),
    );
    expect(hook.result.current.limit.locked).toBe(false);
  });
});
