"use client";
import { useCallback, type ComponentProps, type SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrefetchMovieDetails } from "@/hooks/queries/useMovieQueries";
import { movieHref } from "./format";
import { rememberMoviePreview, type MoviePreview } from "./preview";

type LinkProps = Omit<ComponentProps<typeof Link>, "href">;

/**
 * Opens a film's details: over the current page on a click inside the app, as its own page
 * when shared or refreshed. Intent (hover, focus, touch) fetches the details ahead of the click.
 */
export default function MovieLink({ movie, onClick, onMouseEnter, onFocus, onTouchStart, ...props }: LinkProps & { movie: MoviePreview }) {
  const prefetch = usePrefetchMovieDetails();
  const warm = <E extends SyntheticEvent<HTMLAnchorElement>>(handler?: (event: E) => void) => (event: E) => {
    prefetch(movie.id);
    handler?.(event);
  };
  return (
    <Link
      {...props}
      href={movieHref(movie.id)}
      // The page underneath stays where it is; the details open over it.
      scroll={false}
      onMouseEnter={warm(onMouseEnter)}
      onFocus={warm(onFocus)}
      onTouchStart={warm(onTouchStart)}
      onClick={(event) => {
        rememberMoviePreview(movie);
        onClick?.(event);
      }}
    />
  );
}

/** The same, for surfaces that can't hold a link (a swipeable row). */
export function useOpenMovie() {
  const router = useRouter();
  const prefetch = usePrefetchMovieDetails();
  return useCallback(
    (movie: MoviePreview) => {
      rememberMoviePreview(movie);
      prefetch(movie.id);
      router.push(movieHref(movie.id), { scroll: false });
    },
    [router, prefetch],
  );
}
