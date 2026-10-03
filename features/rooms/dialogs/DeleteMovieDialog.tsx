"use client";

import { MovieWithRatings } from "@/types";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { useRemoveMovie } from "@/hooks/queries/useRoomQueries";

export default function DeleteMovieDialog({
  movie,
  onClose,
  roomId,
}: {
  movie: MovieWithRatings;
  onClose: () => void;
  roomId: string;
}) {
  const { execute, isPending: isLoading } = useRemoveMovie(roomId, {
    onSuccess: () => {
      addToast({
        title: `${movie.title} was removed from the room`,
        color: "success",
      });
      onClose();
    },
  });

  function handleDelete() {
    execute({ movieId: movie.id, roomId });
  }

  return (
    <Modal
      placement="bottom-center"
      size="xl"
      isOpen={true}
      onClose={onClose}
      isDismissable={!isLoading}
      isKeyboardDismissDisabled={isLoading}
      hideCloseButton={isLoading}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)] [&_header]:text-2xl [&_header]:font-semibold [&_header]:tracking-[-0.04em] [&_[data-slot=body]]:text-base">
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 mb-4">
              Delete movie from room
            </ModalHeader>
            <ModalBody
              className="flex flex-col-reverse md:grid
                              md:grid-cols-[1fr,_0.4fr] gap-4"
            >
              <div className="flex flex-col gap-2 h-full justify-between">
                <ModalHeader className="px-0 text-primary-500">
                  Delete {movie.title}
                </ModalHeader>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2"></div>
                </div>
              </div>
              {movie.poster_path && (
                <img
                  className="nd:w-full h-32 md:h-auto rounded-xl md:aspect-[1/1.6] object-contain md:object-cover"
                  src={
                    process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL +
                    "w500" +
                    movie.poster_path
                  }
                  alt={movie.title}
                />
              )}
            </ModalBody>

            <ModalFooter className="flex flex-col">
              <Alert color="danger">All users votes will be removed!</Alert>
              <div className="flex items-center justify-between">
                <Button
                  color="danger"
                  variant="light"
                  isDisabled={isLoading}
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button
                  isLoading={isLoading}
                  isDisabled={isLoading}
                  color="danger"
                  onPress={() => handleDelete()}
                >
                  Delete
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
