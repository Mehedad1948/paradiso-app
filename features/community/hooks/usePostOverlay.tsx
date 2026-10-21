"use client";
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

type PostOverlay = {
  /** The post URL whose overlay is closing; it's hidden ahead of the history pop. */
  closing: string | null;
  close: () => void;
};

const Context = createContext<PostOverlay>({ closing: null, close: () => {} });

/**
 * Closes the post overlay in two steps. Browser back navigations commit synchronously, and React
 * only runs view transitions for transitions, so popping history alone would cut the overlay away.
 * Instead the overlay is hidden inside a transition first, which hands its image back to the feed
 * card with a morph, and the history entry is popped once that has committed.
 */
export function PostOverlayProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [closing, setClosing] = useState<string | null>(null);
  if (closing && closing !== pathname) setClosing(null);

  useEffect(() => {
    if (closing) router.back();
  }, [closing, router]);

  const close = useCallback(() => startTransition(() => setClosing(pathname)), [pathname]);
  const value = useMemo(() => ({ closing, close }), [closing, close]);
  return <Context value={value}>{children}</Context>;
}

export function usePostOverlay() {
  return useContext(Context);
}
