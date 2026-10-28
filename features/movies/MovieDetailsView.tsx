"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { addToast } from "@heroui/toast";
import {
  BookmarkCheck,
  BookmarkPlus,
  Clapperboard,
  Clock3,
  ExternalLink,
  MessagesSquare,
  Play,
  Popcorn,
  Share2,
  X,
} from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import { useMe } from "@/hooks/queries/useMe";
import { useMovieDetails } from "@/hooks/queries/useMovieQueries";
import { useInWatchlist, useToggleWatchlist } from "@/hooks/queries/useWatchlistQueries";
import { BffError } from "@/lib/api/client";
import { imageSrc, movieFeedHref } from "@/features/community/format";
import { useSignInHref } from "@/features/community/components/SignInLink";
import type { MovieDetails } from "@/types/movies";
import BackdropShow from "./components/BackdropShow";
import CastRail from "./components/CastRail";
import MovieComments from "./components/MovieComments";
import ScoreRing from "./components/ScoreRing";
import TrailerFrame from "./components/TrailerFrame";
import { movieHref, releaseLabel, releaseYear, runtimeLabel } from "./format";
import { moviePreview, type MoviePreview } from "./preview";

type Variant = "modal" | "page";

/** Glass buttons that float over the backdrop: close, expand, back. */
export function HeroButton({ label, onPress, children, className }: { label: string; onPress: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      title={label}
      className={clsx(
        "flex size-10 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition-[background-color,transform] hover:bg-black/55 active:scale-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Poster({ path, title, variant }: { path?: string | null; title: string; variant: Variant }) {
  const [failed, setFailed] = useState(false);
  const src = imageSrc(path, "w500");
  return (
    <div
      className={clsx(
        "relative aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-media shadow-[0_24px_60px_-12px_rgb(0_0_0_/_55%)] motion-safe:animate-movie-rise sm:rounded-2xl",
        variant === "page" ? "w-[112px] sm:w-[170px] lg:w-[210px]" : "w-[104px] sm:w-[156px]",
      )}
    >
      {src && !failed ? (
        <img src={src} alt={`${title} poster`} decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-700 via-media to-media text-media-foreground/50">
          <Popcorn size={32} aria-hidden="true" />
        </span>
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/15" />
    </div>
  );
}

const Dot = () => (
  <span aria-hidden="true" className="text-muted/60">
    ·
  </span>
);

function Bar({ className }: { className: string }) {
  return <span aria-hidden="true" className={clsx("block rounded-full bg-surface motion-safe:animate-pulse", className)} />;
}

const action =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-[background-color,color,transform,box-shadow] active:scale-[0.97] disabled:opacity-60";
const quiet = `${action} border border-line bg-elevated/60 text-ink backdrop-blur hover:bg-surface`;

function WatchlistButton({ movie }: { movie: MovieDetails }) {
  const router = useRouter();
  const signIn = useSignInHref();
  const signedIn = !!useMe().data;
  const saved = useInWatchlist(movie.id, signedIn).data === true;
  const toggle = useToggleWatchlist(movie.id, movie.title);
  return (
    <button
      type="button"
      aria-pressed={saved}
      disabled={toggle.isPending}
      onClick={() => (signedIn ? toggle.mutate(!saved) : router.push(signIn))}
      className={clsx(quiet, saved && "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15")}
    >
      {saved ? (
        <BookmarkCheck size={18} aria-hidden="true" fill="currentColor" fillOpacity={0.2} />
      ) : (
        <BookmarkPlus size={18} aria-hidden="true" />
      )}
      {saved ? "On your watchlist" : "Watchlist"}
    </button>
  );
}

async function share(movie: MovieDetails) {
  const url = `${window.location.origin}${movieHref(movie.id)}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: movie.title, url });
    } catch {
      // Dismissing the share sheet is not an error.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    addToast({ title: "Link copied", color: "success" });
  } catch {
    addToast({ title: "Couldn't copy the link", color: "danger" });
  }
}

function Unavailable({ error, retry }: { error: Error; retry: () => void }) {
  if (!(error instanceof BffError && error.status === 404)) return <QueryError error={error} retry={retry} />;
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-line text-accent">
        <Clapperboard size={26} aria-hidden="true" />
      </span>
      <p className="text-lg font-semibold tracking-[-0.02em]">This film slipped out of the archive</p>
      <p className="max-w-[340px] text-[15px] text-muted">We couldn&apos;t find its details. It may have been removed.</p>
    </div>
  );
}

/**
 * A film's details as a cinematic sheet: the backdrop drifting behind, poster and title rising over
 * it, then scores, the trailer, synopsis and cast. Opens with whatever the poster that was pressed
 * already knew, and fills in as the details arrive.
 */
export default function MovieDetailsView({
  movieId,
  variant,
  start,
  end,
}: {
  movieId: string;
  variant: Variant;
  /** Buttons floating over the top-left of the backdrop. */
  start?: ReactNode;
  /** Buttons floating over the top-right of the backdrop. */
  end?: ReactNode;
}) {
  const query = useMovieDetails(movieId);
  const [preview] = useState<MoviePreview | undefined>(() => moviePreview(movieId));
  const [playing, setPlaying] = useState(false);
  const movie = query.data;
  const head = movie ?? preview;
  const title = head?.title ?? "";
  const Title = variant === "page" ? "h1" : "h2";

  const year = releaseYear(head?.release_date);
  const runtime = runtimeLabel(movie?.runtime);
  const original = movie?.original_title && movie.original_title !== movie.title ? movie.original_title : null;
  const facts = movie
    ? [
        ["Director", movie.director],
        ["Released", releaseLabel(movie.release_date)],
        ["Runtime", runtime],
        ["Original title", movie.original_title],
      ].filter((fact): fact is [string, string] => !!fact[1])
    : [];

  return (
    <article className="relative">
      {/* Hero: the backdrop, or the trailer once it's playing. */}
      <div className="relative">
        <div
          className={clsx(
            "relative isolate overflow-hidden bg-media transition-[height] duration-500",
            playing ? "aspect-video" : variant === "page" ? "h-[clamp(240px,40vw,460px)]" : "h-[clamp(220px,40vw,380px)]",
          )}
        >
          <AnimatePresence initial={false}>
            {playing && movie?.trailerKey ? (
              <TrailerFrame key="trailer" videoKey={movie.trailerKey} title={movie.title} />
            ) : null}
          </AnimatePresence>
          {!playing && (
            <BackdropShow
              paths={movie?.backdrops?.length ? movie.backdrops : [movie?.backdrop_path]}
              poster={head?.poster_path}
              title={title}
            />
          )}
        </div>
        {/* Clicks pass between the buttons to the gallery underneath. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
          <div className="pointer-events-auto flex gap-2">{start}</div>
          <div className="pointer-events-auto flex gap-2">
            {playing && (
              <HeroButton label="Close trailer" onPress={() => setPlaying(false)}>
                <X size={19} aria-hidden="true" />
              </HeroButton>
            )}
            {end}
          </div>
        </div>
      </div>

      <div className={clsx("relative z-10 px-5 sm:px-8", playing ? "mt-5" : variant === "page" ? "-mt-28 sm:-mt-40" : "-mt-24 sm:-mt-36")}>
        {/* Poster and title. */}
        <div className="flex items-end gap-4 sm:gap-6">
          {!playing && <Poster path={head?.poster_path} title={title} variant={variant} />}
          <div className="min-w-0 flex-1 pb-1 motion-safe:animate-movie-rise [animation-delay:80ms]">
            {head ? (
              <Title
                className={clsx(
                  "font-semibold leading-[1.04] tracking-[-0.035em] [text-wrap:balance]",
                  variant === "page" ? "text-[28px] sm:text-[44px] lg:text-[52px]" : "text-[26px] sm:text-[38px]",
                )}
              >
                {title}
              </Title>
            ) : (
              <Bar className="h-9 w-3/4" />
            )}
            {original && <p className="mt-1.5 truncate text-[15px] italic text-muted">{original}</p>}
            <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted sm:text-[15px]">
              {year && <span className="font-semibold text-ink/80">{year}</span>}
              {runtime && (
                <>
                  {year && <Dot />}
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={14} aria-hidden="true" /> {runtime}
                  </span>
                </>
              )}
              {movie?.director && (
                <>
                  {(year || runtime) && <Dot />}
                  <span>
                    by <span className="font-semibold text-ink/80">{movie.director}</span>
                  </span>
                </>
              )}
              {!movie && !query.isError && <Bar className="h-4 w-40" />}
            </p>
          </div>
        </div>

        {movie && movie.genres.length > 0 && (
          <ul aria-label="Genres" className="mt-5 flex flex-wrap gap-2 motion-safe:animate-movie-rise [animation-delay:140ms]">
            {movie.genres.map((genre) => (
              <li
                key={genre.id}
                className="rounded-full border border-line bg-surface/60 px-3 py-1 text-[13px] font-medium text-ink/85 backdrop-blur"
              >
                {genre.name}
              </li>
            ))}
          </ul>
        )}

        {query.isError && !movie ? (
          <div className="pb-8 pt-4">
            <Unavailable error={query.error} retry={() => void query.refetch()} />
          </div>
        ) : !movie ? (
          <div aria-busy="true" aria-label="Loading film details" className="space-y-7 pb-10 pt-6">
            <div className="flex gap-3">
              <Bar className="h-11 w-36" />
              <Bar className="h-11 w-32" />
              <Bar className="h-11 w-11" />
            </div>
            <div className="space-y-2.5">
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-11/12" />
              <Bar className="h-4 w-4/6" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }, (_, index) => (
                <Bar key={index} className="aspect-[2/3] w-[96px] shrink-0 !rounded-2xl sm:w-[108px]" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Scores and what you can do with the film. */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-5 motion-safe:animate-movie-rise [animation-delay:200ms]">
              {(movie.vote_average != null && movie.vote_average > 0) || movie.imdbRate != null ? (
                <div className="flex items-center gap-5">
                  {movie.vote_average != null && movie.vote_average > 0 && <ScoreRing value={movie.vote_average} source="TMDb" />}
                  {movie.imdbRate != null && <ScoreRing value={movie.imdbRate} source="IMDb" href={movie.imdbLink} />}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {movie.trailerKey && (
                  <button
                    type="button"
                    onClick={() => setPlaying((value) => !value)}
                    aria-pressed={playing}
                    className={clsx(action, "bg-ink pl-3.5 text-canvas shadow-[0_10px_30px_-10px_rgb(0_0_0_/_60%)] hover:opacity-90")}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-canvas/15">
                      <Play size={13} aria-hidden="true" className="translate-x-px fill-current" />
                    </span>
                    {playing ? "Hide trailer" : "Play trailer"}
                  </button>
                )}
                <WatchlistButton movie={movie} />
                <Link href={movieFeedHref(movie)} className={quiet}>
                  <MessagesSquare size={18} aria-hidden="true" />
                  <span className="max-sm:sr-only">Community takes</span>
                </Link>
                <button type="button" onClick={() => void share(movie)} aria-label="Share" title="Share" className={clsx(quiet, "w-11 justify-center px-0")}>
                  <Share2 size={18} aria-hidden="true" />
                </button>
                {movie.imdbLink && movie.imdbRate == null && (
                  <a href={movie.imdbLink} target="_blank" rel="noopener noreferrer" className={quiet}>
                    IMDb <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {(movie.tagline || movie.overview) && (
              <section aria-label="Synopsis" className="mt-9 max-w-[64ch] motion-safe:animate-movie-rise [animation-delay:260ms]">
                {movie.tagline && (
                  <blockquote className="relative pl-5 font-serif text-[20px] italic leading-snug text-ink/90 sm:text-[23px]">
                    <span aria-hidden="true" className="absolute left-0 top-1 h-[calc(100%-8px)] w-[3px] rounded-full bg-gradient-to-b from-accent to-accent/10" />
                    {movie.tagline}
                  </blockquote>
                )}
                {movie.overview && (
                  <p className={clsx("text-[15.5px] leading-[1.75] text-ink/80", movie.tagline && "mt-4")}>{movie.overview}</p>
                )}
              </section>
            )}

            {movie.cast.length > 0 && (
              <section aria-labelledby={`${movie.id}-cast`} className="mt-10 motion-safe:animate-movie-rise [animation-delay:320ms]">
                <h3 id={`${movie.id}-cast`} className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Top cast
                </h3>
                <CastRail cast={movie.cast} />
              </section>
            )}

            {facts.length > 0 && (
              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line motion-safe:animate-movie-rise [animation-delay:380ms] sm:grid-cols-4">
                {facts.map(([label, value]) => (
                  <div key={label} className="bg-elevated px-4 py-3.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
                    <dd className="mt-1 text-[15px] font-semibold leading-snug">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <p className="pt-6 text-xs text-muted">Film data from TMDb.</p>

            <div className="pb-10 motion-safe:animate-movie-rise [animation-delay:440ms]">
              <MovieComments movieId={movie.id} title={movie.title} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}
