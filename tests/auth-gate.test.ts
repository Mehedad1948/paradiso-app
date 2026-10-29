// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { AuthGate, AuthGateProvider, useAuthAction } from "@/components/auth/gate";
import { syncSession } from "@/lib/auth/sync-session";
import { panelKeys } from "@/lib/query/panel-keys";

let user: { id: number } | undefined;
const dialogs = vi.fn();
const push = vi.fn();

vi.mock("@/hooks/queries/useMe", () => ({
  useMe: () => ({ data: user, isPending: false }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/auth/gate/AuthDialog", () => ({
  default: (props: { isOpen: boolean; reason?: string; onClose: () => void }) => {
    dialogs(props);
    return props.isOpen
      ? createElement(
          "div",
          { role: "dialog" },
          props.reason,
          createElement("button", { onClick: props.onClose }, "dismiss"),
        )
      : null;
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => createElement(AuthGateProvider, { children });

beforeEach(() => {
  user = undefined;
});
afterEach(() => cleanup());

describe("useAuthAction", () => {
  it("runs straight away for a signed-in viewer and never loads the dialog", () => {
    user = { id: 1 };
    const action = vi.fn();
    const { result } = renderHook(() => useAuthAction(action), { wrapper });
    act(() => result.current("a"));
    expect(action).toHaveBeenCalledWith("a");
    expect(dialogs).not.toHaveBeenCalled();
  });

  it("asks a signed-out viewer to sign in, then runs once they have", async () => {
    const action = vi.fn();
    const { result, rerender } = renderHook(() => useAuthAction(action, { reason: "Sign in to like" }), { wrapper });
    act(() => result.current("liked"));
    expect(action).not.toHaveBeenCalled();
    expect(await screen.findByRole("dialog")).toHaveProperty("textContent", expect.stringContaining("Sign in to like"));

    user = { id: 1 };
    rerender();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith("liked");
  });

  it("replays with the latest action, not the signed-out render's", async () => {
    let label = "before";
    const seen: string[] = [];
    const { result, rerender } = renderHook(() => useAuthAction(() => seen.push(label)), { wrapper });
    act(() => result.current());
    await screen.findByRole("dialog");
    label = "after";
    user = { id: 1 };
    rerender();
    await waitFor(() => expect(seen).toEqual(["after"]));
  });

  it("forgets the action when the dialog is dismissed", async () => {
    const action = vi.fn();
    const { result, rerender } = renderHook(() => useAuthAction(action), { wrapper });
    act(() => result.current());
    fireEvent.click(await screen.findByText("dismiss"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    user = { id: 1 };
    rerender();
    expect(action).not.toHaveBeenCalled();
  });
});

describe("AuthGate", () => {
  const press = vi.fn();
  const button = () => createElement("button", { onClick: press }, "Join");

  it("renders the child untouched when signed in", () => {
    user = { id: 1 };
    render(createElement(AuthGate, { children: button() }), { wrapper });
    fireEvent.click(screen.getByText("Join"));
    expect(press).toHaveBeenCalledTimes(1);
    expect(dialogs).not.toHaveBeenCalled();
  });

  it("intercepts the click when signed out and replays it after sign-in", async () => {
    const { rerender } = render(createElement(AuthGate, { reason: "Sign in to join", children: button() }), { wrapper });
    fireEvent.click(screen.getByText("Join"));
    expect(press).not.toHaveBeenCalled();
    await screen.findByRole("dialog");

    user = { id: 1 };
    rerender(createElement(AuthGate, { reason: "Sign in to join", children: button() }));
    await waitFor(() => expect(press).toHaveBeenCalledTimes(1));
  });

  it("follows a gated link after sign-in", async () => {
    const link = () => createElement("a", { href: "/rooms/new" }, "New room");
    const { rerender } = render(createElement(AuthGate, { children: link() }), { wrapper });
    fireEvent.click(screen.getByText("New room"));
    await screen.findByRole("dialog");
    expect(push).not.toHaveBeenCalled();

    user = { id: 1 };
    rerender(createElement(AuthGate, { children: link() }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/rooms/new"));
  });
});

describe("syncSession", () => {
  it("refetches the viewer, refreshes the route and drops caches nobody is watching", async () => {
    const client = new QueryClient();
    const me = vi.fn().mockResolvedValue({ id: 2 });
    client.setQueryData(["room", "1", "detail"], { private: true });
    const refresh = vi.fn();

    // An active observer is what keeps a query out of the inactive sweep.
    const unsubscribe = new QueryObserver(client, { queryKey: panelKeys.me, queryFn: me }).subscribe(() => {});
    await syncSession(client, refresh);
    unsubscribe();

    expect(me).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(panelKeys.me)).toEqual({ id: 2 });
    expect(client.getQueryData(["room", "1", "detail"])).toBeUndefined();
  });
});
