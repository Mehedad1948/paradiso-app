import type { ReactNode } from "react";
import { PostOverlayProvider } from "@/features/community/hooks/usePostOverlay";

/** `modal` overlays a post on the feed when it's opened from inside the community. */
export default function CommunityLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <PostOverlayProvider>
      {children}
      {modal}
    </PostOverlayProvider>
  );
}
