import { NAVIGATION_START_EVENT } from "@/lib/navigation-events";

// Lets the top progress bar know an App Router navigation has begun.
export function onRouterTransitionStart(url: string) {
  window.dispatchEvent(
    new CustomEvent<string>(NAVIGATION_START_EVENT, { detail: url }),
  );
}
