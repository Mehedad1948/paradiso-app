export const movieHref = (id: string) => `/movies/${id}`;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isMovieId = (value: string) => uuid.test(value);

/** Manual movies may store only a year; TMDb ones a full date. */
export const releaseYear = (date: string | null | undefined) =>
  /^\d{4}/.test(date ?? "") ? date!.slice(0, 4) : null;

export function releaseLabel(date: string | null | undefined) {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return releaseYear(date);
  // Noon UTC keeps the calendar day the same in every time zone.
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${date.slice(0, 10)}T12:00:00Z`),
  );
}

/** 128 → "2h 8m". */
export function runtimeLabel(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ""}` : `${rest}m`;
}

export const scoreLabel = (value: number) => (value >= 10 ? "10" : value.toFixed(1));

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
