"use client";

import { MovieWithRatings } from "@/types";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Switch } from "@heroui/switch";
import { addToast } from "@/components/ui/toast";
import { useState } from "react";
import { useUpdateMovie } from "@/hooks/queries/useRoomQueries";
import { CUSTOM_MOVIE_LIMITS } from "@/lib/movies/custom-movie";

export default function EditMovieDialog({
  movie,
  onClose,
  roomId,
}: {
  movie: MovieWithRatings;
  onClose: () => void;
  roomId: string;
}) {
  const initialYear = /^\d{4}/.test(movie.release_date || "")
    ? movie.release_date!.slice(0, 4)
    : "";
  const [title, setTitle] = useState(movie.title);
  const [year, setYear] = useState(initialYear);
  const [isWatchedTogether, setIsWatchedTogether] = useState(
    movie.isWatchedTogether,
  );
  const [errors, setErrors] = useState<{ title?: string; year?: string }>({});
  const { execute, isPending } = useUpdateMovie(roomId, {
    onSuccess: () => {
      addToast({ title: `${movie.title} was updated`, color: "success" });
      onClose();
    },
    onError: (error) =>
      addToast({ title: error.message, color: "danger" }),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    const trimmed = title.trim();
    if (!trimmed) nextErrors.title = "Enter the movie title";
    else if (trimmed.length > CUSTOM_MOVIE_LIMITS.title)
      nextErrors.title = `Title must be at most ${CUSTOM_MOVIE_LIMITS.title} characters`;
    const { minYear, maxYear } = CUSTOM_MOVIE_LIMITS;
    if (
      year !== initialYear &&
      (!/^\d{4}$/.test(year) || +year < minYear || +year > maxYear)
    )
      nextErrors.year = `Enter a year between ${minYear} and ${maxYear}`;
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.year) return;

    const patch = {
      ...(trimmed !== movie.title ? { title: trimmed } : {}),
      ...(year !== initialYear ? { release_date: year } : {}),
      ...(isWatchedTogether !== movie.isWatchedTogether
        ? { isWatchedTogether }
        : {}),
    };
    if (Object.keys(patch).length === 0) return onClose();
    execute({ roomId, movieId: movie.id, ...patch });
  }

  return (
    <Modal
      placement="bottom-center"
      size="xl"
      isOpen={true}
      onClose={onClose}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      hideCloseButton={isPending}
    >
      <ModalContent className="rounded-2xl border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_45%)] backdrop-blur-xl [&_header]:text-2xl [&_header]:font-semibold [&_header]:tracking-[-0.04em] [&_[data-slot=body]]:text-base">
        {() => (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col">
            <ModalHeader className="mb-2 flex flex-col gap-1">
              Edit Movie
              <span className="text-sm font-normal tracking-normal text-muted">
                Changes apply to this movie everywhere it appears.
              </span>
            </ModalHeader>
            <ModalBody>
              <Input
                autoFocus
                isRequired
                variant="bordered"
                label="Title"
                labelPlacement="outside"
                validationBehavior="aria"
                isDisabled={isPending}
                value={title}
                onValueChange={setTitle}
                maxLength={CUSTOM_MOVIE_LIMITS.title}
                isInvalid={!!errors.title}
                errorMessage={errors.title}
              />
              <Input
                variant="bordered"
                label="Release year"
                labelPlacement="outside"
                placeholder="2004"
                inputMode="numeric"
                maxLength={4}
                validationBehavior="aria"
                isDisabled={isPending}
                value={year}
                onValueChange={setYear}
                isInvalid={!!errors.year}
                errorMessage={errors.year}
              />
              <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Watched together</span>
                  <span className="text-xs text-muted">
                    Mark this movie as one the room watched together.
                  </span>
                </div>
                <Switch
                  color="secondary"
                  size="sm"
                  aria-label="Watched together"
                  isDisabled={isPending}
                  isSelected={isWatchedTogether}
                  onValueChange={setIsWatchedTogether}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                color="danger"
                variant="light"
                isDisabled={isPending}
                onPress={onClose}
              >
                Close
              </Button>
              <Button
                type="submit"
                color="secondary"
                isLoading={isPending}
                isDisabled={isPending}
              >
                Save
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
