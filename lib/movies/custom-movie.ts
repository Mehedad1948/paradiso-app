import type { BackendRequestBody } from "@/types/backend";

export type CustomMovieBody = BackendRequestBody<
  "/rooms/add-custom-movie/{id}",
  "post"
>;
export type CustomMovieField = Exclude<keyof CustomMovieBody, "isWatchedTogether">;
export type CustomMovieErrors = Partial<Record<CustomMovieField, string>>;

export const CUSTOM_MOVIE_LIMITS = {
  title: 255,
  imdbLink: 255,
  overview: 2000,
  minYear: 1870,
  maxYear: 2100,
} as const;

const fields: CustomMovieField[] = ["title", "year", "imdbLink", "overview"];

/**
 * Mirrors the backend's CreateCustomMovieDto. The IMDb value is deliberately
 * not checked as a URL: the backend also accepts bare IDs like "tt0133093".
 */
export function parseCustomMovie(
  input: Record<string, unknown>,
):
  | { body: CustomMovieBody; errors: null }
  | { body: null; errors: CustomMovieErrors } {
  const errors: CustomMovieErrors = {};
  const { minYear, maxYear } = CUSTOM_MOVIE_LIMITS;
  const optional = (field: "imdbLink" | "overview", label: string) => {
    const value = input[field];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string") {
      errors[field] = `Invalid ${label}`;
      return undefined;
    }
    const trimmed = value.trim();
    if (trimmed.length > CUSTOM_MOVIE_LIMITS[field])
      errors[field] =
        `${label} must be at most ${CUSTOM_MOVIE_LIMITS[field]} characters`;
    return trimmed || undefined;
  };

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) errors.title = "Enter the movie title";
  else if (title.length > CUSTOM_MOVIE_LIMITS.title)
    errors.title = `Title must be at most ${CUSTOM_MOVIE_LIMITS.title} characters`;

  const { year } = input;
  if (year === undefined || year === null || year === "")
    errors.year = "Enter the release year";
  else if (
    typeof year !== "number" ||
    !Number.isInteger(year) ||
    year < minYear ||
    year > maxYear
  )
    errors.year = `Enter a year between ${minYear} and ${maxYear}`;

  const imdbLink = optional("imdbLink", "IMDb link");
  const overview = optional("overview", "Description");
  const isWatchedTogether = input.isWatchedTogether === true;

  if (Object.keys(errors).length) return { body: null, errors };
  return {
    body: {
      title,
      year: year as number,
      ...(imdbLink ? { imdbLink } : {}),
      ...(overview ? { overview } : {}),
      ...(isWatchedTogether ? { isWatchedTogether } : {}),
    },
    errors: null,
  };
}

/** Maps class-validator messages ("imdbLink must be a URL address") to fields. */
export function customMovieErrorsFrom(messages: string[]) {
  const errors: CustomMovieErrors = {};
  for (const message of messages) {
    const field = fields.find((name) => message.startsWith(`${name} `));
    if (!field || errors[field]) continue;
    const detail = message.slice(field.length + 1);
    errors[field] = detail.charAt(0).toUpperCase() + detail.slice(1);
  }
  return Object.keys(errors).length ? errors : undefined;
}
