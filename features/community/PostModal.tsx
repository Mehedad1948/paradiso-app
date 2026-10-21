"use client";
import { useParams, usePathname } from "next/navigation";
import { Modal, ModalContent, ModalHeader } from "@heroui/modal";
import { ArrowLeft, Maximize2, X } from "lucide-react";
import { PostDetail } from "./PostPage";
import { usePostOverlay } from "./hooks/usePostOverlay";

/**
 * A post opened from inside the community, layered over the feed so the reader keeps their place.
 * Opening the same URL directly (refresh, shared link) renders the standalone post page instead.
 */
export default function PostModal() {
  const { postId } = useParams<{ postId?: string }>();
  const pathname = usePathname();
  const { closing, close } = usePostOverlay();
  // A parallel slot keeps showing its last page through soft navigation, so once the reader
  // follows a link out of the post (a profile, the feed), the overlay has to stand down itself.
  if (!postId || !pathname.startsWith("/community/posts/") || closing === pathname) return null;
  return <PostOverlay key={postId} postId={Number(postId)} onClose={close} />;
}

function PostOverlay({ postId, onClose: close }: { postId: number; onClose: () => void }) {
  return (
    <Modal
      isOpen
      onClose={close}
      size="2xl"
      placement="top"
      scrollBehavior="outside"
      hideCloseButton
      classNames={{
        backdrop: "bg-black/55 backdrop-blur-[3px]",
        base: "max-w-[720px] rounded-[14px] border border-line bg-elevated text-ink shadow-[0_30px_80px_rgb(0_0_0_/_35%)] sm:!my-10 max-sm:m-0 max-sm:min-h-[100dvh] max-sm:rounded-none max-sm:border-0",
      }}
    >
      <ModalContent>
        <ModalHeader className="sticky top-0 z-20 flex items-center gap-2 rounded-t-[14px] border-b border-line bg-elevated/90 px-3 py-2 text-[17px] font-semibold tracking-[-0.02em] backdrop-blur-md max-sm:rounded-none">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
          >
            <ArrowLeft size={20} className="sm:hidden" aria-hidden="true" />
            <X size={20} className="max-sm:hidden" aria-hidden="true" />
          </button>
          <span className="flex-1">Recommendation</span>
          <button
            type="button"
            // The URL already points at the post; a reload swaps the overlay for the standalone page.
            onClick={() => window.location.reload()}
            aria-label="Open as a page"
            title="Open as a page"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink max-sm:hidden"
          >
            <Maximize2 size={17} aria-hidden="true" />
          </button>
        </ModalHeader>
        <PostDetail postId={postId} framed={false} onDeleted={close} />
      </ModalContent>
    </Modal>
  );
}
