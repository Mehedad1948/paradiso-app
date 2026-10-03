"use client";

import { useVote } from "@/hooks/queries/useRoomQueries";
import { MovieWithRatings } from "@/types";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { useState } from "react";

export default function VoteMovieDialog({
  movie,
  onClose,
  roomId,
  userId,
}: {
  movie: MovieWithRatings;
  onClose: () => void;
  roomId: string;
  userId: number;
}) {
  const [rate, setRate] = useState(
    String(movie.ratings.find((r) => r.user.id === userId)?.rate ?? 7),
  );
  const { execute, isPending: isAdding } = useVote(roomId, {
    onSuccess: () => {
      addToast({ title: "Rated!", color: "success" });
      onClose();
    },
  });
  function handleVote() {
    execute({ roomId, movieId: movie.id, rate: Number(rate) });
  }
  return (
    <Modal
      placement="bottom-center"
      size="xl"
      isOpen={true}
      isDismissable={!isAdding}
      isKeyboardDismissDisabled={isAdding}
      hideCloseButton={isAdding}
      onClose={onClose}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)] [&_header]:text-2xl [&_header]:font-semibold [&_header]:tracking-[-0.04em] [&_[data-slot=body]]:text-base !p-0 overflow-hidden rounded-large">
        {(onClose) => (
          <>
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  rate.trim() &&
                  Number.isFinite(Number(rate)) &&
                  Number(rate) >= 0 &&
                  Number(rate) <= 10
                )
                  handleVote();
              }}
            >
              <ModalBody
                className="flex flex-col-reverse md:grid
                              md:grid-cols-[1fr,_0.7fr] gap-4"
              >
                <div className="flex flex-col gap-2 h-full justify-between">
                  <ModalHeader className="px-0">Rate {movie.title}</ModalHeader>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={rate}
                        onValueChange={setRate}
                        isDisabled={isAdding}
                        aria-label="Your rating"
                        min={0}
                        max={10}
                        step="any"
                        type="number"
                        className="w-full text-center"
                      />
                      <Button
                        type="submit"
                        color="secondary"
                        isLoading={isAdding}
                        isDisabled={
                          isAdding ||
                          !rate.trim() ||
                          !Number.isFinite(Number(rate)) ||
                          Number(rate) < 0 ||
                          Number(rate) > 10
                        }
                      >
                        Submit
                      </Button>
                    </div>
                    <Button
                      type="button"
                      color="primary"
                      isDisabled={isAdding}
                      onPress={onClose}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                {movie.poster_path && (
                  <img
                    className="nd:w-full h-64 md:h-auto rounded-xl md:aspect-[1/1.6] object-contain md:object-cover"
                    src={
                      process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL +
                      "w500" +
                      movie.poster_path
                    }
                    alt={movie.title}
                  />
                )}
              </ModalBody>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
