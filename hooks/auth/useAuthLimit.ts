"use client";
import { useEffect } from "react";
import { useCooldown, type CooldownScope } from "./useCooldown";

/**
 * Turns a 429 from an auth form into a persisted countdown. While it runs the caller keeps its
 * submit button disabled, and `error` replaces the server's message, which goes stale as time passes.
 */
export function useAuthLimit(
  form: { error?: string; retryAfter?: number },
  scope: CooldownScope,
  email: string,
) {
  const { secondsLeft, start } = useCooldown(scope, email);
  const { retryAfter } = form;
  useEffect(() => {
    if (retryAfter) start(retryAfter);
  }, [retryAfter, start]);
  const error = retryAfter
    ? secondsLeft > 0
      ? `Too many attempts. Try again in ${secondsLeft}s.`
      : undefined
    : form.error;
  return { secondsLeft, locked: secondsLeft > 0, error, start };
}
