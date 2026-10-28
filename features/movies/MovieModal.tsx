"use client";
import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { ChevronDown, Maximize2, X } from "lucide-react";
import ResponsiveDialog from "@/components/ui/ResponsiveDialog";
import { useMovieDetails } from "@/hooks/queries/useMovieQueries";
import MovieDetailsView, { HeroButton } from "./MovieDetailsView";
import { isMovieId } from "./format";
import { moviePreview } from "./preview";

/** Long enough for the dialog's exit animation before history pops. */
const EXIT_MS = 240;

/**
 * A film opened from anywhere in the app, layered over the page the reader was on. Opening the
 * same URL directly (refresh, shared link) renders the standalone film page instead.
 */
export default function MovieModal() {
  const { movieId } = useParams<{ movieId?: string }>();
  const pathname = usePathname();
  // A parallel slot keeps its last page through soft navigation, so once the reader follows a
  // link out of the film (the community feed, sign-in), the overlay has to stand down itself.
  if (!movieId || !isMovieId(movieId) || !pathname.startsWith("/movies/")) return null;
  return <MovieOverlay key={movieId} movieId={movieId} />;
}

function MovieOverlay({ movieId }: { movieId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const title = useMovieDetails(movieId).data?.title ?? moviePreview(movieId)?.title;

  // Let the dialog animate out, then step back to the page underneath.
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => router.back(), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, router]);

  const close = () => setOpen(false);

  return (
    <ResponsiveDialog
      isOpen={open}
      onClose={close}
      size="4xl"
      scrollBehavior="inside"
      backdrop="blur"
      hideCloseButton
      className="overflow-hidden border border-line bg-elevated text-ink shadow-[0_40px_120px_-20px_rgb(0_0_0_/_60%)] md:rounded-[28px]"
      drawerClassName="rounded-t-[28px] border-b-0"
    >
      <ModalContent>
        <ModalHeader className="sr-only">{title ? `${title} details` : "Film details"}</ModalHeader>
        <ModalBody className="gap-0 overflow-y-auto overscroll-contain p-0 [scrollbar-width:thin]">
          {/* A grab handle so the sheet reads as one on phones. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1.5 z-30 h-1 w-10 -translate-x-1/2 rounded-full bg-white/60 md:hidden"
          />
          <MovieDetailsView
            movieId={movieId}
            variant="modal"
            end={
              <>
                <HeroButton
                  label="Open as a page"
                  // The URL already points at the film; a reload swaps the overlay for the standalone page.
                  onPress={() => window.location.reload()}
                  className="max-md:hidden"
                >
                  <Maximize2 size={16} aria-hidden="true" />
                </HeroButton>
                <HeroButton label="Close" onPress={close}>
                  <ChevronDown size={20} aria-hidden="true" className="md:hidden" />
                  <X size={19} aria-hidden="true" className="max-md:hidden" />
                </HeroButton>
              </>
            }
          />
        </ModalBody>
      </ModalContent>
    </ResponsiveDialog>
  );
}
