"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

/** Pending navigations and Server Actions retry automatically once the connection returns. */
export default function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-line bg-elevated px-4 py-2.5 text-sm font-medium text-ink shadow-lg"
    >
      <WifiOff size={16} aria-hidden="true" className="shrink-0 text-muted" />
      You're offline. We'll retry as soon as you're back.
    </div>
  );
}
