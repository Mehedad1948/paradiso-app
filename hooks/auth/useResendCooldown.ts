"use client";
import { useCallback, useEffect, useState } from "react";

const WAIT_SECONDS = 120;
const keyFor = (email: string) =>
  `paradiso:reset-code:${email.trim().toLowerCase()}`;
export function startResetCooldown(email: string) {
  const until = Date.now() + WAIT_SECONDS * 1000;
  try {
    window.sessionStorage.setItem(keyFor(email), String(until));
  } catch {
    /* Storage may be disabled. */
  }
  return until;
}
export function useResendCooldown(email: string) {
  const [deadline, setDeadline] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    let stored = 0;
    try {
      stored = Number(window.sessionStorage.getItem(keyFor(email))) || 0;
    } catch {
      /* Use the in-memory countdown. */
    }
    setDeadline(stored);
  }, [email]);
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
    () => setDeadline(startResetCooldown(email)),
    [email],
  );
  return { secondsLeft, start };
}
