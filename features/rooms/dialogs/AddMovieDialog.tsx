"use client";

import { DbMovie } from "@/types/movies";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { ArrowLeft, PencilLine, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  useAddCustomMovie,
  useAddMovie,
  useMovieSearch,
} from "@/hooks/queries/useRoomQueries";
import QueryError from "@/components/ui/QueryError";
import { BffError } from "@/lib/api/client";
import {
  CUSTOM_MOVIE_LIMITS,
  parseCustomMovie,
  type CustomMovieErrors,
  type CustomMovieField,
} from "@/lib/movies/custom-movie";
import MoviePoster from "../components/MoviePoster";

const emptyManualMovie: Record<CustomMovieField, string> = {
  title: "",
  year: "",
  imdbLink: "",
  overview: "",
};

export default function AddMovieDialog({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<DbMovie | null>(null);
  const [manualMovie, setManualMovie] = useState(emptyManualMovie);
  const [errors, setErrors] = useState<CustomMovieErrors>({});
  const [debouncedQuery] = useDebounce(query, 500);
  const search = useMovieSearch(debouncedQuery);
  const results = search.data?.results || [];
  const hasNoResults =
    search.isSuccess &&
    !search.isFetching &&
    results.length === 0 &&
    query.trim() === debouncedQuery.trim();

  function onAdded() {
    addToast({ title: "Movie added to room successfully", color: "success" });
    onClose();
  }
  const { execute, isPending: isAddingSearched } = useAddMovie(roomId, {
    onSuccess: onAdded,
  });
  const { execute: executeCustom, isPending: isAddingCustom } =
    useAddCustomMovie(roomId, {
      onSuccess: onAdded,
      onError: (error) => {
        if (error instanceof BffError && error.status === 409)
          addToast({
            title: "This movie is already in the room",
            color: "danger",
          });
        else if (error instanceof BffError && error.fieldErrors)
          setErrors(error.fieldErrors);
        else addToast({ title: error.message, color: "danger" });
      },
    });
  const isAdding = isAddingSearched || isAddingCustom;

  function handleAddMovieToRoom() {
    if (selectedMovie) execute({ dbId: selectedMovie.id, roomId });
  }
  function openManualForm() {
    const title = query.trim();
    if (title) setManualMovie((movie) => ({ ...movie, title }));
    setErrors({});
    setMode("manual");
  }
  function handleAddCustomMovie(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = parseCustomMovie({
      ...manualMovie,
      year: manualMovie.year.trim() ? Number(manualMovie.year) : undefined,
    });
    if (parsed.errors) return setErrors(parsed.errors);
    executeCustom({ roomId, ...parsed.body });
  }
  const field = (name: CustomMovieField) => ({
    name,
    variant: "underlined" as const,
    validationBehavior: "aria" as const,
    isDisabled: isAdding,
    value: manualMovie[name],
    onValueChange: (value: string) => {
      setManualMovie((movie) => ({ ...movie, [name]: value }));
      if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    },
    isInvalid: !!errors[name],
    errorMessage: errors[name],
  });

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
        {() =>
          mode === "manual" ? (
            <form
              noValidate
              onSubmit={handleAddCustomMovie}
              className="flex flex-col"
            >
              <ModalHeader className="flex items-center gap-2 mb-4">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label="Back to search"
                  isDisabled={isAdding}
                  onPress={() => setMode("search")}
                >
                  <ArrowLeft size={20} />
                </Button>
                <div className="flex flex-col">
                  Add Movie Manually
                  <span className="text-sm font-normal tracking-normal text-muted">
                    For movies you can&apos;t find on TMDb.
                  </span>
                </div>
              </ModalHeader>
              <ModalBody>
                <Input
                  {...field("title")}
                  autoFocus
                  isRequired
                  label="Title"
                  maxLength={CUSTOM_MOVIE_LIMITS.title}
                />
                <div className="grid gap-x-4 sm:grid-cols-[8rem,_1fr]">
                  <Input
                    {...field("year")}
                    isRequired
                    label="Year"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="2004"
                  />
                  <Input
                    {...field("imdbLink")}
                    label="IMDb link or ID"
                    placeholder="tt0133093"
                    maxLength={CUSTOM_MOVIE_LIMITS.imdbLink}
                  />
                </div>
                <Textarea
                  {...field("overview")}
                  label="Short description"
                  minRows={2}
                  maxLength={CUSTOM_MOVIE_LIMITS.overview}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  type="button"
                  color="danger"
                  variant="light"
                  isDisabled={isAdding}
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  isLoading={isAdding}
                  isDisabled={isAdding}
                  color="secondary"
                >
                  Add Movie
                </Button>
              </ModalFooter>
            </form>
          ) : (
            <>
              <ModalHeader className="flex flex-col gap-1 mb-4">
                Add Movie
              </ModalHeader>
              <ModalBody>
                <Autocomplete
                  isDisabled={isAdding}
                  isLoading={search.isFetching}
                  allowsEmptyCollection={false}
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
                          <MoviePoster
                            path={movie.poster_path}
                            title={movie.title}
                            width={40}
                            height={56}
                            className="w-10 rounded-md h-14"
                          />
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
                {selectedMovie ? (
                  <div className="w-full">
                    <div
                      className="grid grid-cols-[40px,_1fr,_auto] gap-2 p-2
                                                     rounded-lg text-left border items-center border-secondary-500 text-secondary-500"
                    >
                      <MoviePoster
                        path={selectedMovie.poster_path}
                        width={40}
                        height={56}
                        className="w-10 rounded-md h-14"
                      />
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
                ) : hasNoResults ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-4 py-5 text-center">
                    <div>
                      <p className="font-semibold">
                        No results for &ldquo;{debouncedQuery.trim()}&rdquo;
                      </p>
                      <p className="text-sm text-muted">
                        Can&apos;t find it on TMDb? Add it with a title and
                        year.
                      </p>
                    </div>
                    <Button
                      color="secondary"
                      variant="flat"
                      startContent={<PencilLine size={16} />}
                      isDisabled={isAdding}
                      onPress={openManualForm}
                    >
                      Add manually
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    Can&apos;t find it?{" "}
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={openManualForm}
                      className="font-semibold text-secondary-500 underline-offset-4 hover:underline disabled:opacity-50"
                    >
                      Add manually
                    </button>
                  </p>
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
          )
        }
      </ModalContent>
    </Modal>
  );
}
