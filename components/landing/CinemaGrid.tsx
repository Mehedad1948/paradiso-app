"use client";

import Image from "next/image";
import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import MovieLink, { useOpenMovie } from "@/features/movies/MovieLink";
import type { MoviePreview } from "@/features/movies/preview";
import { useResolveMovie } from "@/hooks/queries/useCommunityQueries";
import { useMe } from "@/hooks/queries/useMe";
import { authHref } from "@/lib/auth/redirect";
import type { GridCell } from "@/lib/curations/grid";

function startReveal(button: HTMLElement) {
  const artwork = button.querySelector("img");
  const number = button.querySelector("span");
  if (!artwork || !number) return;
  if (artwork.getAnimations().some((animation) => animation.playState === "running")) return;

  artwork.classList.remove("animate-cinema-reveal");
  number.classList.remove("animate-cinema-number");
  // Commit the reset so a new entry after the cycle restarts the animation.
  void artwork.offsetWidth;
  artwork.classList.add("animate-cinema-reveal");
  number.classList.add("animate-cinema-number");
}

function handleReveal(event: SyntheticEvent<HTMLElement>) {
  startReveal(event.currentTarget);
}

const frameClass = "relative -ml-px -mt-px block min-h-0 min-w-0 overflow-hidden border border-ink/20";
const cellClass = `${frameClass} group cursor-pointer touch-manipulation bg-transparent focus-visible:z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent aria-busy:cursor-progress`;

/**
 * The curated frames, one film each. A built-in frame (shown while the curation can't be read)
 * has no library copy at hand, so it adds its film on click (signed in) and then opens it.
 */
export default function CinemaGrid({ cells }: { cells: GridCell[] }) {
  const router = useRouter();
  const openMovie = useOpenMovie();
  const signedIn = !!useMe().data;
  const resolve = useResolveMovie();
  const [added, setAdded] = useState<Record<number, MoviePreview>>({});

  const addAndOpen = (tmdbId: number) => {
    if (resolve.isPending) return;
    if (!signedIn) return router.push(authHref("sign-in", { origin: "/" }));
    resolve.mutate(tmdbId, {
      onSuccess: (movie) => {
        const preview = { id: movie.id, title: movie.title, poster_path: movie.poster_path };
        setAdded((current) => ({ ...current, [tmdbId]: preview }));
        openMovie(preview);
      },
    });
  };

  return (
    <div
      className="grid aspect-square w-[86%] grid-cols-6 grid-rows-6 justify-self-end pl-px pt-px max-[640px]:w-[76%]"
      // Turn the grid away from the page center: the inner (left) edge recedes.
      // style={{ transform: "perspective(1400px) rotateY(-11deg)", transformOrigin: "right center" }}
      role="group"
      aria-label="Explore iconic cinema. Hover or focus to reveal a film, select it to open its details."
    >
      {cells.map(({ slot, row, column, art, movie: curated, tmdbId }) => {
        const number = (
          <span
            className="absolute bottom-[7px] left-2 max-[640px]:hidden font-mono text-[9px] leading-none text-ink/30 motion-reduce:group-hover:invisible motion-reduce:group-focus-visible:invisible motion-reduce:animate-none"
            aria-hidden="true"
          >
            {String(slot + 1).padStart(2, "0")}
          </span>
        );
        const style = { gridRow: row, gridColumn: column };
        const movie = curated ?? (tmdbId ? added[tmdbId] : undefined);
        // A slot the admin left empty keeps its frame, without art or a film.
        if (!art || (!movie && !tmdbId))
          return (
            <div key={slot} className={frameClass} style={style} aria-hidden="true">
              {number}
            </div>
          );
        const cell = {
          className: cellClass,
          style,
          "aria-label": `${art.title}, frame ${slot + 1}`,
          onPointerEnter: handleReveal,
          onFocus: handleReveal,
        };
        const content = (
          <>
            <Image
              src={art.src}
              alt=""
              fill
              sizes="(max-width: 640px) 12vw, 7vw"
              unoptimized={!art.optimizable}
              className="invisible -translate-x-full object-cover max-[640px]:!visible max-[640px]:!translate-x-0 max-[640px]:!animate-none motion-reduce:group-hover:visible motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:visible motion-reduce:group-focus-visible:translate-x-0 motion-reduce:animate-none"
              style={{ objectPosition: art.position }}
            />
            {number}
          </>
        );
        if (movie)
          return (
            <MovieLink key={slot} movie={movie} {...cell}>
              {content}
            </MovieLink>
          );
        return (
          <button
            key={slot}
            type="button"
            {...cell}
            aria-busy={resolve.isPending && resolve.variables === tmdbId}
            onClick={() => tmdbId && addAndOpen(tmdbId)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
