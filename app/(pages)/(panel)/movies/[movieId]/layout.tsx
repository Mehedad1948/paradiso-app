import type { ReactNode } from "react";
import type { Metadata } from "next";
import { brandedOgImage, pageMetadata } from "@/config/seo";
import { imageSrc } from "@/features/community/format";
import { isMovieId, releaseYear } from "@/features/movies/format";
import { movieDetails } from "@/services/movies/details";

const fallback = pageMetadata("Film", "A film on Paradiso.", { noIndex: true });

const clip = (value: string, max: number) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ movieId: string }>;
}): Promise<Metadata> {
  const { movieId } = await params;
  if (!isMovieId(movieId)) return fallback;
  // Shares the server's cached copy with the BFF, so this rarely reaches the backend.
  const { result: movie } = await movieDetails(movieId);
  if (!movie) return fallback;

  const year = releaseYear(movie.release_date);
  const description =
    clip([movie.tagline, movie.overview].filter(Boolean).join(" "), 200) ||
    `${movie.title}${movie.director ? `, directed by ${movie.director}` : ""}, on Paradiso.`;
  // A wide still makes the better link preview; the poster stands in without one.
  const src = imageSrc(movie.backdrop_path, "w1280") ?? imageSrc(movie.poster_path, "w780");
  return pageMetadata(year ? `${movie.title} (${year})` : movie.title, description, {
    image: brandedOgImage(src, movie.title),
  });
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
