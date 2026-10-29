"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Popcorn } from "lucide-react";
import { Spinner } from "@heroui/spinner";
import { imageSrc, tone } from "@/features/community/format";
import MovieLink from "@/features/movies/MovieLink";
import { releaseYear, scoreLabel } from "@/features/movies/format";
import { useOpenCredit } from "@/hooks/queries/usePeopleQueries";
import type { Person, PersonCredit } from "@/types/people";
import { creditRole, groupCredits, topRated } from "../format";

const LibraryMark = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={clsx("block size-2 rounded-full bg-accent ring-2 ring-white/80 dark:ring-black/50", className)} />
);

function CreditCard({
  credit,
  index,
  opening,
  onOpen,
}: {
  credit: PersonCredit;
  index: number;
  opening: boolean;
  onOpen: (credit: PersonCredit) => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = imageSrc(credit.poster_path, "w300");
  const year = releaseYear(credit.release_date);
  const role = creditRole(credit);
  const rating = credit.vote_average && credit.vote_average > 0 ? credit.vote_average : null;

  const body = (
    <>
      <span className="relative block aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-[0_1px_2px_rgb(0_0_0_/_6%)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/credit:-translate-y-1 group-hover/credit:shadow-[0_22px_40px_-18px_rgb(0_0_0_/_55%)]">
        {src && !failed ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/credit:scale-[1.05]"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-700/80 via-media to-media p-3 text-center text-media-foreground/60">
            <Popcorn size={22} aria-hidden="true" />
            <span className="line-clamp-3 text-[11.5px] font-medium leading-snug">{credit.title}</span>
          </span>
        )}
        {rating != null && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">
            <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: tone(rating).fill }} />
            <span className="sr-only">Rated </span>
            {scoreLabel(rating)}
          </span>
        )}
        {credit.movieId && (
          <span title="On Paradiso" className="absolute right-2 top-2">
            <LibraryMark />
            <span className="sr-only">On Paradiso</span>
          </span>
        )}
        {opening && (
          <span className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
            <Spinner size="sm" color="white" />
          </span>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10 dark:ring-white/10" />
      </span>
      <span className="mt-2.5 line-clamp-2 text-[13.5px] font-semibold leading-tight">{credit.title}</span>
      <span className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted">
        <span className="font-medium text-ink/70 tabular-nums">{year ?? "TBA"}</span>
        {role && <> · {role}</>}
      </span>
    </>
  );

  const card =
    "group/credit block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background";
  return (
    <li className="motion-safe:animate-poster-in" style={{ animationDelay: `${Math.min(index, 14) * 35}ms` }}>
      {credit.movieId ? (
        <MovieLink
          movie={{ id: credit.movieId, title: credit.title, poster_path: credit.poster_path, release_date: credit.release_date }}
          className={card}
        >
          {body}
        </MovieLink>
      ) : (
        <button type="button" aria-busy={opening} onClick={() => onOpen(credit)} className={card}>
          {body}
        </button>
      )}
    </li>
  );
}

const plural = (count: number) => `${count} ${count === 1 ? "film" : "films"}`;

/** A director's films are the ones they directed; everyone else's are the ones they acted in. */
function filmsOf({ knownForDepartment, credits }: Person) {
  if (knownForDepartment === "Directing" && credits.directing.length) return credits.directing;
  return credits.acting.length ? credits.acting : credits.directing;
}

const SHOWN = 15;

/**
 * The person's best rated films, laid out as a career: decade by decade, newest first, with the
 * decade held at the side while its films scroll.
 */
export default function Filmography({ person }: { person: Person }) {
  const { open, opening } = useOpenCredit(person.id);
  const all = useMemo(() => filmsOf(person), [person]);
  const films = useMemo(() => topRated(all, SHOWN), [all]);
  const groups = useMemo(() => groupCredits(films), [films]);
  const inLibrary = films.some((credit) => credit.movieId);

  if (!films.length) return null;
  const id = `person-${person.id}-films`;

  return (
    <section aria-labelledby={`${id}-title`} className="mt-16 motion-safe:animate-movie-rise [animation-delay:240ms]">
      <div className="border-b border-line pb-5">
        <h2 id={`${id}-title`} className="text-[26px] font-semibold tracking-[-0.03em] sm:text-[32px]">
          Filmography
        </h2>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
          {all.length > films.length && <span>The {films.length} best rated of {plural(all.length)}</span>}
          {inLibrary && (
            <span className="inline-flex items-center gap-2">
              <LibraryMark className="ring-0" /> On Paradiso
            </span>
          )}
        </p>
      </div>

      <div className="mt-8 space-y-12">
        {groups.map((group) => (
          <section
            key={group.key}
            aria-label={group.label}
            className="grid gap-4 lg:grid-cols-[124px_minmax(0,1fr)] lg:gap-8"
          >
            <header className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-2 lg:sticky lg:top-28 lg:block lg:self-start lg:border-0 lg:pb-0">
              <h3
                className={clsx(
                  "min-w-0 text-[20px] font-semibold tracking-[-0.03em] tabular-nums [overflow-wrap:anywhere] lg:leading-none",
                  group.key === "upcoming" ? "text-accent lg:text-[20px] lg:tracking-[-0.02em]" : "text-ink/80 lg:text-[38px] lg:text-ink/25",
                )}
              >
                {group.label}
              </h3>
              <p className="text-[12.5px] text-muted lg:mt-2.5">{plural(group.credits.length)}</p>
            </header>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-5">
              {group.credits.map((credit, index) => (
                <CreditCard
                  key={credit.tmdbId}
                  credit={credit}
                  index={index}
                  opening={opening === credit.tmdbId}
                  onOpen={open}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
