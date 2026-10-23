"use client";
import clsx from "clsx";
import { AvatarGroup } from "@heroui/avatar";
import UserAvatar from "@/components/ui/UserAvatar";
import { Check, EyeOff, Lock, Trophy, Vote } from "lucide-react";
import { isPollClosed } from "@/lib/chat/timeline";
import type { ChatMessage, ChatPoll } from "@/types/chat";
import MoviePoster from "../../components/MoviePoster";
import { useChat } from "../ChatContext";
import { closesIn } from "../format";

export default function ChatPollCard({
  message,
  poll,
}: {
  message: ChatMessage;
  poll: ChatPoll;
}) {
  const { actions, members, roomMovies, me, isOwner } = useChat();
  const closed = isPollClosed(poll);
  const voted = poll.options.filter((option) => option.votedByMe).map((option) => option.id);
  const top = Math.max(...poll.options.map((option) => option.votes));
  const canClose = !closed && (message.author.id === me.id || isOwner);

  function choose(id: number) {
    if (closed) return;
    const selected = voted.includes(id);
    const next = poll.allowsMultiple
      ? selected
        ? voted.filter((item) => item !== id)
        : [...voted, id]
      : selected
        ? []
        : [id];
    actions.vote(message.id, next);
  }

  return (
    <div className="mt-1.5 w-[420px] max-w-full overflow-hidden rounded-[10px] border border-line bg-surface text-ink">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-line px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          <Vote size={14} aria-hidden="true" /> Ballot
        </span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {poll.anonymous && (
            <span className="inline-flex items-center gap-1">
              <EyeOff size={13} aria-hidden="true" /> Anonymous
            </span>
          )}
          {closed ? (
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <Lock size={13} aria-hidden="true" /> Closed
            </span>
          ) : poll.closesAt ? (
            <span>Closes {closesIn(poll.closesAt)}</span>
          ) : null}
        </span>
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="mb-1 break-words text-[17px] font-semibold leading-snug tracking-[-0.01em]">
          {message.text}
        </p>
        <p className="mb-3 text-sm text-muted">
          {closed ? "Final results" : poll.allowsMultiple ? "Choose any" : "Choose one"}
        </p>
        <div
          role={poll.allowsMultiple ? "group" : "radiogroup"}
          aria-label={message.text ?? "Poll options"}
          className="flex flex-col gap-2"
        >
          {poll.options.map((option) => {
            const share = poll.totalVoters ? Math.round((option.votes / poll.totalVoters) * 100) : 0;
            const winner = closed && option.votes > 0 && option.votes === top;
            const movie = option.movieId ? roomMovies.get(option.movieId) : undefined;
            const voters = option.voterIds.map((id) => members.get(id)).filter(Boolean);
            return (
              <button
                key={option.id}
                type="button"
                role={poll.allowsMultiple ? "checkbox" : "radio"}
                aria-checked={option.votedByMe}
                aria-disabled={closed}
                onClick={() => choose(option.id)}
                className={clsx(
                  "group/option relative flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors",
                  option.votedByMe ? "border-accent/70" : "border-line",
                  closed ? "cursor-default" : "hover:border-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  style={{ width: `${share}%` }}
                  className={clsx(
                    "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out",
                    option.votedByMe ? "bg-accent/20" : winner ? "bg-warning/20" : "bg-ink/[0.06]",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={clsx(
                    "relative flex size-[18px] shrink-0 items-center justify-center border-2 transition-colors",
                    poll.allowsMultiple ? "rounded-[5px]" : "rounded-full",
                    option.votedByMe ? "border-accent bg-accent text-on-accent" : "border-muted/70",
                    closed && !option.votedByMe && "opacity-40",
                  )}
                >
                  {option.votedByMe && <Check size={12} strokeWidth={3.5} />}
                </span>
                {option.movieId && (
                  <MoviePoster
                    path={movie?.poster_path}
                    size="w92"
                    width={24}
                    height={36}
                    className="relative h-9 w-6 shrink-0 rounded"
                  />
                )}
                <span className="relative min-w-0 flex-1">
                  <span className="line-clamp-2 text-[15px] font-medium leading-tight">
                    {option.text}
                  </span>
                  {!poll.anonymous && voters.length > 0 && (
                    <AvatarGroup
                      max={5}
                      size="sm"
                      className="mt-1 justify-start"
                      renderCount={(count) => (
                        <span className="ms-1.5 text-xs text-muted">+{count}</span>
                      )}
                    >
                      {voters.map((voter) => (
                        <UserAvatar
                          key={voter!.id}
                          name={voter!.username}
                          src={voter!.avatar}
                          size={20}
                          className="ring-1 ring-surface"
                        />
                      ))}
                    </AvatarGroup>
                  )}
                </span>
                <span className="relative flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums">
                  {winner && <Trophy size={15} className="text-warning" aria-label="Winner" />}
                  {share}%
                  <span className="sr-only">, {option.votes} votes</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>
            {poll.totalVoters} {poll.totalVoters === 1 ? "voter" : "voters"}
          </span>
          <span className="flex items-center gap-3">
            {!closed && voted.length > 0 && (
              <button
                type="button"
                className="font-semibold underline-offset-4 hover:text-ink hover:underline"
                onClick={() => actions.vote(message.id, [])}
              >
                Retract vote
              </button>
            )}
            {canClose && (
              <button
                type="button"
                className="font-semibold text-ink underline-offset-4 hover:underline"
                onClick={() => actions.closePoll(message.id)}
              >
                Close poll
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
