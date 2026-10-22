"use client";

import { useVote } from "@/hooks/queries/useRoomQueries";
import { MovieWithRatings } from "@/types";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { useState } from "react";
import { Star } from "lucide-react";
import ElasticSlider from "@/components/ui/ElasticSlider";
import SlideToConfirm from "@/components/ui/SlideToConfirm";
import MoviePoster from "../components/MoviePoster";
import { ratingHue } from "../lib/ratingColor";

const rateLabel = (rate: number) =>
  rate >= 9 ? "Masterpiece" : rate >= 7.5 ? "Great" : rate >= 6 ? "Good" : rate >= 4 ? "Meh" : rate >= 2 ? "Poor" : "Awful";

// [left %, top px, delay s, size px] for the sparkles shown at a perfect 10.
const SPARKLES = [
  [4, -10, 0, 8], [18, 16, 0.5, 6], [33, -14, 1.1, 10], [49, 18, 0.3, 7],
  [63, -12, 0.8, 9], [77, 17, 1.4, 6], [90, -9, 0.2, 10], [97, 14, 0.9, 7],
] as const;

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
    movie.ratings.find((r) => r.user.id === userId)?.rate ?? 7,
  );
  const perfect = rate >= 10;
  const { executeAsync, isPending: isAdding } = useVote(roomId);
  return (
    <Modal
      placement="bottom-center"
      size="xl"
      isOpen={true}
      isDismissable={!isAdding}
      isKeyboardDismissDisabled={isAdding}
      hideCloseButton={isAdding}
      onClose={onClose}
      classNames={{
        closeButton:
          "z-20 bg-black/40 text-white backdrop-blur hover:bg-black/60 active:bg-black/70",
      }}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)] [&_header]:text-2xl [&_header]:font-semibold [&_header]:tracking-[-0.04em] [&_[data-slot=body]]:text-base !p-0 overflow-hidden rounded-large">
        {(onClose) => (
          <>
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => event.preventDefault()}
            >
              <ModalBody
                className="flex flex-col-reverse gap-0 p-0 md:grid md:min-h-[340px] md:grid-cols-[minmax(0,1fr)_230px]"
              >
                <div className="flex h-full flex-col justify-between gap-2 p-6 max-md:pt-2">
                  <ModalHeader className="px-0">Rate {movie.title}</ModalHeader>

                  <div className="flex flex-col gap-5">
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-6xl font-semibold tabular-nums tracking-[-0.06em] ${perfect ? "rate-gold-text" : ""}`}
                        >
                          {rate.toFixed(1)}
                        </span>
                        <span className="text-lg text-muted">/ 10</span>
                      </div>
                      <span
                        className={`pb-2 text-sm font-semibold uppercase tracking-[0.09em] ${perfect ? "rate-gold-text" : "text-muted"}`}
                      >
                        {rateLabel(rate)}
                      </span>
                    </div>
                    <div className="relative" data-perfect={perfect || undefined}>
                    {perfect && (
                      <span className="rate-sparkles" aria-hidden="true">
                        {SPARKLES.map(([left, top, delay, size], index) => (
                          <span
                            key={index}
                            style={{
                              left: `${left}%`,
                              top: `${top}px`,
                              animationDelay: `${delay}s`,
                              width: size,
                              height: size,
                            }}
                          />
                        ))}
                      </span>
                    )}
                    <ElasticSlider
                      className={`!w-full ${perfect ? "rate-gold" : ""}`}
                      value={rate}
                      onChange={setRate}
                      startingValue={0}
                      maxValue={10}
                      isStepped
                      stepSize={0.1}
                      ticks
                      valuePosition="bubble"
                      thickness={14}
                      activeThickness={22}
                      restOpacity={0.85}
                      maxStretch={40}
                      rangeColor={
                        perfect
                          ? "linear-gradient(100deg, #b8860b, #ffd700 30%, #fff6c2 50%, #ffd700 70%, #b8860b)"
                          : `hsl(${ratingHue(rate)} 80% 55%)`
                      }
                      iconPlacement="inside"
                      leftIcon={<Star size={16} aria-hidden="true" />}
                      rightIcon={
                        <Star size={16} className="fill-current" aria-hidden="true" />
                      }
                      disabled={isAdding}
                      ariaLabel="Your rating"
                    />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="light"
                        isDisabled={isAdding}
                        onPress={onClose}
                      >
                        Cancel
                      </Button>
                      <SlideToConfirm
                        className="ml-auto shrink-0"
                        label={perfect ? "Slide to crown it" : "Slide to rate"}
                        handleColor={perfect ? "#ffd700" : undefined}
                        doneLabel="Rated"
                        errorLabel="Couldn't rate"
                        onConfirm={() =>
                          executeAsync({ roomId, movieId: movie.id, rate })
                        }
                        onDone={onClose}
                      />
                    </div>
                  </div>
                </div>
                <div className="relative h-44 overflow-hidden md:h-auto">
                  <MoviePoster
                    path={movie.poster_path}
                    title={movie.title}
                    className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
                  />
                  {/* Blend the poster into the panel instead of floating it. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-elevated via-elevated/20 to-transparent md:bg-gradient-to-r md:via-elevated/10"
                  />
                </div>
              </ModalBody>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
