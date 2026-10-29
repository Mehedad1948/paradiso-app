"use client";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useAuthGate, type AuthGateView } from "./AuthGateProvider";

/**
 * Wraps an action that needs an account. Signed in, it runs as usual. Signed out, it opens the
 * sign-in dialog and runs after the viewer signs in, using the latest `action` (so it sees
 * fresh props and state, not the signed-out render's).
 *
 * The replay is "do what they clicked", not "toggle whatever is true now": prefer actions that set
 * a value over ones that flip it.
 *
 *   const like = useAuthAction(() => react.mutate({ postId, value: 1 }), { reason: "Sign in to like posts" });
 *   <button onClick={like}>Like</button>
 */
export function useAuthAction<Args extends unknown[]>(
  action: (...args: Args) => void,
  { reason, view }: { reason?: string; view?: AuthGateView } = {},
) {
  const { signedIn, open } = useAuthGate();
  const latest = useRef(action);
  useLayoutEffect(() => {
    latest.current = action;
  });
  return useCallback(
    (...args: Args) => {
      if (signedIn) return latest.current(...args);
      open({ reason, view, run: () => latest.current(...args) });
    },
    [signedIn, open, reason, view],
  );
}
