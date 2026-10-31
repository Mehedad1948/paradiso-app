"use client";
import { useCallback, useEffect, useState } from "react";

/** Each scope matches one server-side limit, so a lockout from any route in it disables them all. */
export type CooldownScope =
  | "sign-in"
  | "register"
  | "verify-email"
  | "verify-resend"
  | "reset-code"
  | "reset-password";

const keyFor = (scope: CooldownScope, email: string) =>
  `paradiso:${scope}:${email.trim().toLowerCase()}`;

/** Starts (or extends, never shortens) a cooldown that survives navigation and reloads. */
export function startCooldown(scope: CooldownScope, email: string, seconds: number) {
  let until = Date.now() + seconds * 1000;
  try {
    const stored = Number(window.sessionStorage.getItem(keyFor(scope, email))) || 0;
    until = Math.max(until, stored);
    window.sessionStorage.setItem(keyFor(scope, email), String(until));
  } catch {
    /* Storage may be disabled. */
  }
  return until;
}

export function useCooldown(scope: CooldownScope, email: string) {
  const [deadline, setDeadline] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    let stored = 0;
    try {
      stored = Number(window.sessionStorage.getItem(keyFor(scope, email))) || 0;
    } catch {
      /* Use the in-memory countdown. */
    }
    setDeadline(stored);
  }, [scope, email]);
  useEffect(() => {
    const update = () =>
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    if (deadline <= Date.now()) return;
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [deadline]);
  const start = useCallback(
    (seconds: number) => setDeadline(startCooldown(scope, email, seconds)),
    [scope, email],
  );
  return { secondsLeft, start };
}

/** The courtesy wait between "send another code" clicks; the server limit is stricter. */
export const RESEND_WAIT_SECONDS = 120;
