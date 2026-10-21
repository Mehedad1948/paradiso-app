/**
 * Tiny hand-off between the landing page's heavy scenes and its loading
 * screen. The wordmark reports when it is interactive; the loader then lifts
 * and announces the reveal, which is what starts the entrance animations and
 * the secondary backdrop. Module state survives client navigations, so the
 * loader only ever plays on the first load.
 */
type Listener = () => void;

const listeners: Record<"ready" | "revealed", Set<Listener>> = {
  ready: new Set(),
  revealed: new Set(),
};
const done = { ready: false, revealed: false };

function signal(kind: keyof typeof done) {
  if (done[kind]) return;
  done[kind] = true;
  listeners[kind].forEach((listener) => listener());
  listeners[kind].clear();
}

function subscribe(kind: keyof typeof done, listener: Listener) {
  if (done[kind]) {
    listener();
    return () => {};
  }
  listeners[kind].add(listener);
  return () => listeners[kind].delete(listener);
}

/** The wordmark is on screen and responding (or has given up on WebGL). */
export const markLandingReady = () => signal("ready");
export const onLandingReady = (listener: Listener) => subscribe("ready", listener);

/** The loading screen has lifted. */
export const markLandingRevealed = () => signal("revealed");
export const onLandingRevealed = (listener: Listener) => subscribe("revealed", listener);
export const isLandingRevealed = () => done.revealed;
