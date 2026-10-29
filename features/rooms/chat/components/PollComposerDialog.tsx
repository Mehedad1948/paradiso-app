"use client";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Switch } from "@heroui/switch";
import { AddIcon, CheckIcon, CloseIcon } from "@solar-icons/react/linear";
import { CHAT_LIMITS, type ChatPollInputs } from "@/types/chat";
import MoviePoster from "../../components/MoviePoster";
import { useChat } from "../ChatContext";

type Option = { key: number; text: string; movieId?: string };

const DURATIONS = [
  { label: "No end", hours: 0 },
  { label: "1 hour", hours: 1 },
  { label: "Tonight", hours: 6 },
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
];
const { min, max } = CHAT_LIMITS.pollOptions;
let nextKey = 0;
const option = (text = "", movieId?: string): Option => ({ key: ++nextKey, text, movieId });

export default function PollComposerDialog({
  preset,
  replyToId,
  onClose,
  onSent,
}: {
  /** "watch" starts a "what do we watch?" poll from the room's movies. */
  preset?: "watch";
  replyToId?: number;
  onClose: () => void;
  onSent: () => void;
}) {
  const { roomMovies, actions } = useChat();
  const movies = Array.from(roomMovies.values());
  const watch = preset === "watch" && movies.length > 0;
  const [question, setQuestion] = useState(watch ? "What do we watch tonight?" : "");
  const [options, setOptions] = useState<Option[]>(() =>
    watch ? movies.slice(0, 3).map((movie) => option("", movie.id)) : [option(), option()],
  );
  const [allowsMultiple, setAllowsMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [hours, setHours] = useState(watch ? 6 : 0);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const filled = options.filter((item) => item.movieId || item.text.trim());
  const questionError = submitted && !question.trim() ? "Ask a question" : undefined;
  const optionsError =
    submitted && filled.length < min ? `Add at least ${min} options` : undefined;
  const used = new Set(options.map((item) => item.movieId).filter(Boolean));

  function toggleMovie(id: string) {
    setOptions((current) => {
      if (current.some((item) => item.movieId === id))
        return current.filter((item) => item.movieId !== id);
      // Replace an empty text row before growing the list.
      const blank = current.findIndex((item) => !item.movieId && !item.text.trim());
      if (blank >= 0) return current.map((item, index) => (index === blank ? option("", id) : item));
      return current.length >= max ? current : [...current, option("", id)];
    });
  }

  async function submit() {
    setSubmitted(true);
    if (!question.trim() || filled.length < min) return;
    const poll: ChatPollInputs = {
      options: filled.map((item) =>
        item.movieId ? { movieId: item.movieId } : { text: item.text.trim() },
      ),
      allowsMultiple,
      anonymous,
      ...(hours ? { closesAt: new Date(Date.now() + hours * 3_600_000).toISOString() } : {}),
    };
    setSending(true);
    const sent = await actions.send({ text: question.trim(), poll, ...(replyToId ? { replyToId } : {}) });
    setSending(false);
    if (sent) onSent();
  }

  return (
    <Modal
      isOpen
      size="xl"
      placement="center"
      scrollBehavior="inside"
      onClose={onClose}
      isDismissable={!sending}
      hideCloseButton={sending}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)]">
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tracking-[-0.04em]">
            {watch ? "Put it to a vote" : "Start a poll"}
          </span>
          <span className="text-sm font-normal text-muted">
            Everyone in the room can vote. Results update live.
          </span>
        </ModalHeader>
        <ModalBody className="gap-5 text-base">
          <Input
            autoFocus
            label="Question"
            variant="underlined"
            value={question}
            onValueChange={setQuestion}
            maxLength={CHAT_LIMITS.text}
            isInvalid={!!questionError}
            errorMessage={questionError}
            validationBehavior="aria"
          />
          {movies.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-muted">Pick from the watchlist</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {movies.map((movie) => {
                  const chosen = used.has(movie.id);
                  return (
                    <button
                      key={movie.id}
                      type="button"
                      aria-pressed={chosen}
                      aria-label={movie.title}
                      title={movie.title}
                      onClick={() => toggleMovie(movie.id)}
                      className={clsx(
                        "relative shrink-0 overflow-hidden rounded-md ring-offset-2 ring-offset-elevated transition-all",
                        chosen ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100",
                      )}
                    >
                      <MoviePoster path={movie.poster_path} size="w92" width={56} height={84} className="h-[84px] w-14" />
                      {chosen && (
                        <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-accent text-on-accent">
                          <CheckIcon size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-muted">
              Options <span className="font-normal">({filled.length}/{max})</span>
            </p>
            {options.map((item, index) => {
              const movie = item.movieId ? roomMovies.get(item.movieId) : undefined;
              return (
                <div key={item.key} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-sm tabular-nums text-muted">{index + 1}</span>
                  {item.movieId ? (
                    <div className="flex h-12 flex-1 items-center gap-3 rounded-lg border border-line bg-surface px-2">
                      <MoviePoster path={movie?.poster_path} size="w92" width={24} height={36} className="h-9 w-6 rounded" />
                      <span className="line-clamp-1 text-[15px] font-medium">{movie?.title ?? "Room movie"}</span>
                    </div>
                  ) : (
                    <Input
                      aria-label={`Option ${index + 1}`}
                      placeholder={`Option ${index + 1}`}
                      value={item.text}
                      maxLength={CHAT_LIMITS.pollOptionText}
                      onValueChange={(text) =>
                        setOptions((current) =>
                          current.map((entry) => (entry.key === item.key ? { ...entry, text } : entry)),
                        )
                      }
                      classNames={{ inputWrapper: "h-12 border border-line bg-surface shadow-none" }}
                    />
                  )}
                  <button
                    type="button"
                    aria-label={`Remove option ${index + 1}`}
                    disabled={options.length <= min}
                    onClick={() => setOptions((current) => current.filter((entry) => entry.key !== item.key))}
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              );
            })}
            {optionsError && <p className="text-sm text-danger">{optionsError}</p>}
            {options.length < max && (
              <Button
                size="sm"
                variant="light"
                className="w-fit font-semibold"
                startContent={<AddIcon size={16} />}
                onPress={() => setOptions((current) => [...current, option()])}
              >
                Add option
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
            <Switch size="sm" isSelected={allowsMultiple} onValueChange={setAllowsMultiple}>
              <span className="text-[15px]">Allow several choices</span>
            </Switch>
            <Switch size="sm" isSelected={anonymous} onValueChange={setAnonymous}>
              <span className="text-[15px]">Anonymous voting <span className="text-sm text-muted">· counts stay visible</span></span>
            </Switch>
            <div>
              <p className="mb-2 text-sm text-muted">Closes</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Poll closes">
                {DURATIONS.map((duration) => (
                  <button
                    key={duration.hours}
                    type="button"
                    role="radio"
                    aria-checked={hours === duration.hours}
                    onClick={() => setHours(duration.hours)}
                    className={clsx(
                      "h-8 rounded-full border px-3 text-sm font-semibold transition-colors",
                      hours === duration.hours
                        ? "border-ink bg-ink text-canvas"
                        : "border-line text-muted hover:border-muted hover:text-ink",
                    )}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" isDisabled={sending} onPress={onClose}>
            Cancel
          </Button>
          <Button className="bg-ink font-semibold text-canvas" isLoading={sending} onPress={submit}>
            Post poll
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
