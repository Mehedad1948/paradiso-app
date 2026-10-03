"use client";

import { DbMovie } from "@/types/movies";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { Popcorn, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useAddMovie, useMovieSearch } from "@/hooks/queries/useRoomQueries";
import QueryError from "@/components/ui/QueryError";

export default function AddMovieDialog({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<DbMovie | null>(null);
  const [debouncedQuery] = useDebounce(query, 500);
  const search = useMovieSearch(debouncedQuery);
  const results = search.data?.results || [];
  const { execute, isPending: isAdding } = useAddMovie(roomId, {
    onSuccess: () => {
      addToast({ title: "Movie added to room successfully", color: "success" });
      onClose();
    },
  });
  function handleAddMovieToRoom() {
    if (selectedMovie) execute({ dbId: selectedMovie.id, roomId });
  }

  return (
    <Modal
      placement="bottom-center"
      size="xl"
      isOpen={true}
      onClose={onClose}
      isDismissable={!isAdding}
      isKeyboardDismissDisabled={isAdding}
      hideCloseButton={isAdding}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)] [&_header]:text-2xl [&_header]:font-semibold [&_header]:tracking-[-0.04em] [&_[data-slot=body]]:text-base">
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 mb-4">
              Add Movie
            </ModalHeader>
            <ModalBody>
              <Autocomplete
                isDisabled={isAdding}
                isLoading={search.isFetching}
                startContent={
                  <SearchIcon
                    className="text-default-400"
                    size={20}
                    strokeWidth={2.5}
                  />
                }
                variant="underlined"
                label="Search movies"
                inputValue={query}
                onInputChange={(value) => {
                  setQuery(value);
                  if (selectedMovie && value !== selectedMovie.title)
                    setSelectedMovie(null);
                }}
                onSelectionChange={(key) => {
                  const selected = results.find(
                    (r) => r.id.toString() === String(key),
                  );
                  setSelectedMovie(selected || null);
                }}
              >
                {results.map((movie) => {
                  return (
                    <AutocompleteItem key={movie.id} textValue={movie.title}>
                      <div className="!grid !grid-cols-[40px,_1fr] gap-2 ">
                        {movie.poster_path ? (
                          <img
                            width={50}
                            height={75}
                            src={`${process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL}w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-10 rounded-md h-14 object-cover"
                          />
                        ) : (
                          <div
                            className="w-10 h-14 rounded-md text-blue-400
                                                flex items-center justify-center bg-blue-900 "
                          >
                            <Popcorn />
                          </div>
                        )}
                        <p className="w-full  line-clamp-1">{movie.title}</p>
                      </div>
                    </AutocompleteItem>
                  );
                })}
              </Autocomplete>
              {search.isError && (
                <QueryError
                  error={search.error}
                  retry={() => search.refetch()}
                />
              )}
              {selectedMovie && (
                <div className="w-full">
                  <div>
                    <div
                      className="grid grid-cols-[40px,_1fr,_auto] gap-2 p-2
                                                     rounded-lg text-left border items-center border-secondary-500 text-secondary-500"
                    >
                      {selectedMovie.poster_path && (
                        <img
                          width={50}
                          height={75}
                          src={`${process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL}w500${selectedMovie.poster_path}`}
                          alt={""}
                          className="w-10 rounded-md h-14 object-cover"
                        />
                      )}
                      <p className="font-semibold">{selectedMovie.title}</p>
                      <Button
                        isDisabled={isAdding}
                        size="sm"
                        onPress={() => setSelectedMovie(null)}
                        color="danger"
                        variant="light"
                        className="font-semibold"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                isDisabled={isAdding}
                onPress={onClose}
              >
                Close
              </Button>
              <Button
                isLoading={isAdding}
                isDisabled={isAdding || !selectedMovie}
                color="secondary"
                onPress={() => handleAddMovieToRoom()}
              >
                Add Movie
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
