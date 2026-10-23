import type { ReactNode } from "react";
import { PostOverlayProvider } from "@/features/community/hooks/usePostOverlay";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata(
  "Community",
  "Where Paradiso's film lovers gather: share what you're watching, trade opinions and find your next favorite.",
);

/** `modal` overlays a post on the feed when it's opened from inside the community. */
export default function CommunityLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <PostOverlayProvider>
      {children}
      {modal}
    </PostOverlayProvider>
  );
}
