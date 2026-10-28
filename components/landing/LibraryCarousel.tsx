"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import MovieLink, { useOpenMovie } from "@/features/movies/MovieLink";
import { releaseYear } from "@/features/movies/format";
import type { MoviePreview } from "@/features/movies/preview";
import { usePrefetchMovieDetails } from "@/hooks/queries/useMovieQueries";

// The renderer and its WebGL shaders stay out of the landing bundle until the shelf is near.
const FlexCarousel = dynamic(() => import("@/components/ui/FlexCarousel"), { ssr: false });

const TMDB = process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL || "https://image.tmdb.org/t/p/";
const poster = (path: string, size: "w342" | "w500") => (/^https?:\/\//.test(path) ? path : `${TMDB}${size}${path}`);
// WebGL needs a CORS response, but a poster the browser already cached from a plain <img> has none
// (TMDb doesn't vary on Origin). A query of its own gives the texture a separate cache entry.
const texture = (path: string) => {
  const src = poster(path, "w500");
  return `${src}${src.includes("?") ? "&" : "?"}texture`;
};

type Film = MoviePreview & { poster_path: string };

/** Library posters on a bending glass shelf. The centered poster opens the film's details. */
export default function LibraryCarousel({ films }: { films: Film[] }) {
  const shelfRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const openMovie = useOpenMovie();
  const prefetch = usePrefetchMovieDetails();
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const items = useMemo(
    () =>
      films.map((film) => ({
        src: texture(film.poster_path),
        alt: `${film.title} poster`,
        title: film.title,
        subtitle: releaseYear(film.release_date) ?? undefined,
      })),
    [films],
  );

  useEffect(() => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(shelf);
    return () => {
      observer.disconnect();
      clearTimeout(settle.current);
    };
  }, []);

  if (unsupported)
    return (
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none]">
        {films.map((film) => (
          <MovieLink
            key={film.id}
            movie={film}
            className="w-[clamp(140px,18vw,220px)] shrink-0 snap-center overflow-hidden rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <img
              src={poster(film.poster_path, "w342")}
              alt={film.title}
              loading="lazy"
              decoding="async"
              className="aspect-[2/3] w-full object-cover"
            />
          </MovieLink>
        ))}
      </div>
    );

  return (
    <div ref={shelfRef} className="relative h-[clamp(440px,50vw,640px)] max-sm:h-[460px]">
      {near && (
        <FlexCarousel
          items={items}
          preset="liquid"
          intro="rise"
          cardHeight={0.66}
          gap={14}
          radius={3}
          squeeze={0.18}
          focusOnClick={false}
          captureWheel={false}
          label="Films in the Paradiso library. Use the arrow keys to browse and Enter to open a film."
          onChange={(index) => {
            // Warm the details only once the row comes to rest, not for every poster it passes.
            clearTimeout(settle.current);
            settle.current = setTimeout(() => prefetch(films[index].id), 300);
          }}
          onSelect={(index) => openMovie(films[index])}
          onUnsupported={() => setUnsupported(true)}
        />
      )}
    </div>
  );
}
