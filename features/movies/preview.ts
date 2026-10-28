/** What a poster already knows about its film, so the details open with something on screen. */
export type MoviePreview = {
  id: string;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
};

const previews = new Map<string, MoviePreview>();

export function rememberMoviePreview(movie: MoviePreview) {
  previews.set(movie.id, movie);
}

export const moviePreview = (id: string) => previews.get(id);
