import { useState } from "react";

/**
 * Follows `value` while `live`, and otherwise keeps the last value it saw. Route hooks report the
 * URL on screen, so a page left underneath the post overlay would otherwise read the post's URL.
 */
export function useHeld<T>(value: T, live: boolean): T {
  const [held, setHeld] = useState(value);
  if (live && !Object.is(held, value)) setHeld(value);
  return live ? value : held;
}
