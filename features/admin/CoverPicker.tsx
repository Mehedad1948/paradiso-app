"use client";
import { Button } from "@heroui/button";
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import QueryError from "@/components/ui/QueryError";
import ResponsiveDialog from "@/components/ui/ResponsiveDialog";
import { useMoviePosters } from "@/hooks/queries/useCurationQueries";
import type { CuratedMovie, MoviePoster } from "@/types/curations";
import { Thumb } from "./shared";

/**
 * The film's TMDb posters, best rated first. `current` is the pick's cover (null: its own poster);
 * choosing one returns its w500 URL, and "Use default poster" returns null.
 */
export default function CoverPicker({
  film,
  current,
  onChoose,
  onClose,
}: {
  film: CuratedMovie;
  current: string | null;
  onChoose: (imageUrl: string | null) => void;
  onClose: () => void;
}) {
  const query = useMoviePosters(film.id);
  const posters = query.data?.data ?? [];
  // With no cover set, the poster flagged as the film's current one is the one in use.
  const selected = (poster: MoviePoster) => (current ? poster.imageUrl === current : poster.isDefault);

  return (
    <ResponsiveDialog isOpen onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span>Cover for {film.title}</span>
              <span className="text-sm font-normal text-muted">Shown on the home page instead of the default poster.</span>
            </ModalHeader>
            <ModalBody>
              {query.isPending ? (
                <Spinner className="p-8" aria-label="Loading posters" />
              ) : query.error ? (
                <QueryError error={query.error} retry={() => query.refetch()} />
              ) : posters.length ? (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {posters.map((poster) => {
                    const active = selected(poster);
                    return (
                      <li key={poster.imageUrl}>
                        <button
                          type="button"
                          aria-pressed={active}
                          aria-label={`${poster.language ? `${poster.language.toUpperCase()} poster` : "Poster"}${poster.isDefault ? ", default" : ""}`}
                          // Picking the default poster means no cover at all.
                          onClick={() => onChoose(poster.isDefault ? null : poster.imageUrl)}
                          className={`relative block w-full overflow-hidden rounded-md border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                            active ? "border-primary" : "border-transparent hover:border-line"
                          }`}
                        >
                          <Thumb src={poster.thumbnailUrl} alt="" className="aspect-[2/3] w-full" />
                          {active || poster.isDefault ? (
                            <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-0.5 text-left text-xs text-white">
                              {active ? "Selected" : "Default"}
                              {active && poster.isDefault ? " · default" : ""}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted">This film has no TMDb posters to choose from.</p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" isDisabled={current === null} onPress={() => onChoose(null)}>
                Use default poster
              </Button>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </ResponsiveDialog>
  );
}
