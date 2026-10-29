import type { Person, PersonCredit } from "@/types/people";

/** "Agnès Varda" → "agnes-varda"; scripts with no Latin letters leave it empty. */
export function personSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** `/people/525-christopher-nolan`: the number is the address, the name is for people reading it. */
export function personHref(id: number, name?: string | null) {
  const slug = name ? personSlug(name) : "";
  return `/people/${id}${slug ? `-${slug}` : ""}`;
}

/** The TMDb id at the front of a person's path segment, or null when there isn't a valid one. */
export function personIdFrom(segment: string) {
  const match = /^(\d{1,10})(?:-|$)/.exec(decodeURIComponent(segment));
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const today = () => new Date().toISOString().slice(0, 10);

/** No date yet, or a date still ahead. */
export const isUpcoming = (credit: Pick<PersonCredit, "release_date">) =>
  !credit.release_date || credit.release_date.slice(0, 10) > today();

/** Whole years from one ISO date to another, read as calendar days so time zones can't shift it. */
function yearsBetween(from: string, to: string) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  if (!fy || !ty) return null;
  return ty - fy - (tm < fm || (tm === fm && td < fd) ? 1 : 0);
}

/** Age today, or the age they reached. */
export const ageOf = (person: Pick<Person, "birthday" | "deathday">) =>
  person.birthday ? yearsBetween(person.birthday, person.deathday ?? today()) : null;

const departmentTitles: Record<string, string> = {
  Directing: "Director",
  Acting: "Actor",
  Writing: "Writer",
  Production: "Producer",
  Camera: "Cinematographer",
  Editing: "Editor",
  Sound: "Composer",
  Art: "Production designer",
  "Costume & Make-Up": "Costume designer",
  "Visual Effects": "Visual effects",
};

const jobTitles: Record<string, string> = {
  Screenplay: "Screenwriter",
  Writer: "Writer",
  Story: "Writer",
  Novel: "Author",
  Producer: "Producer",
  "Director of Photography": "Cinematographer",
  "Original Music Composer": "Composer",
  Editor: "Editor",
};

/** TMDb's department as a job title: "Directing" → "Director". Unknown departments pass through. */
export const departmentTitle = (department?: string | null) =>
  department ? (departmentTitles[department] ?? department) : null;

/** "Director · Screenwriter · Producer": what they're known for first, then what else they keep doing. */
export function roleLine(person: Person) {
  const roles = new Set<string>();
  const known = person.knownForDepartment ? departmentTitles[person.knownForDepartment] : undefined;
  if (known) roles.add(known);
  if (person.credits.directing.length) roles.add("Director");
  if (person.credits.acting.length > 2) roles.add("Actor");
  const counts = new Map<string, number>();
  for (const credit of person.credits.crew)
    for (const job of Array.from(new Set((credit.jobs ?? []).map((job) => jobTitles[job]).filter(Boolean))))
      counts.set(job, (counts.get(job) ?? 0) + 1);
  Array.from(counts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .forEach(([job]) => roles.add(job));
  return Array.from(roles).slice(0, 3);
}

/** First and latest release year across every credit, upcoming films aside and nothing past the year they died. */
export function careerSpan(person: Person) {
  const lastYear = person.deathday ? Number(person.deathday.slice(0, 4)) : Infinity;
  const years = Object.values(person.credits)
    .flat()
    .filter((credit) => !isUpcoming(credit))
    .map((credit) => Number(credit.release_date!.slice(0, 4)))
    .filter((year) => year <= lastYear);
  return years.length ? { from: Math.min(...years), to: Math.max(...years) } : null;
}

export type CreditGroup = { key: string; label: string; credits: PersonCredit[] };

const byDate = (a: PersonCredit, b: PersonCredit) => (a.release_date ?? "").localeCompare(b.release_date ?? "");
// A film's average pulled towards a typical score until enough people have rated it, so a 10.0 from
// three votes doesn't outrank a 7.4 from over a thousand.
const PRIOR_VOTES = 50;
const PRIOR_SCORE = 6;
const weightedRating = ({ vote_average, vote_count }: PersonCredit) => {
  if (vote_average == null) return 0;
  // A backend deployed before vote_count existed sends none.
  const votes = vote_count ?? 0;
  return (vote_average * votes + PRIOR_SCORE * PRIOR_VOTES) / (votes + PRIOR_VOTES);
};
const byRating = (a: PersonCredit, b: PersonCredit) => weightedRating(b) - weightedRating(a);

/** Below this many votes a score is noise: a 10.0 from three people doesn't make a film their best. */
const MIN_VOTES = 20;

/** The best rated few by plain TMDb score, counting only films enough people have rated. */
export const topRated = (credits: PersonCredit[], count: number) =>
  credits
    // Responses cached before vote counts shipped have none; let those films compete on score alone.
    .filter((credit) => (credit.vote_count ?? MIN_VOTES) >= MIN_VOTES)
    .sort(byRating)
    .slice(0, count);

/** Upcoming films, then decades newest first. */
export function groupCredits(credits: PersonCredit[]): CreditGroup[] {
  const upcoming = credits.filter(isUpcoming).sort(byDate);
  const released = credits
    .filter((credit) => !isUpcoming(credit))
    .sort(byDate)
    .reverse();
  const decades: CreditGroup[] = [];
  for (const credit of released) {
    const decade = `${Math.floor(Number(credit.release_date!.slice(0, 4)) / 10) * 10}s`;
    const last = decades.at(-1);
    if (last?.key === decade) last.credits.push(credit);
    else decades.push({ key: decade, label: decade, credits: [credit] });
  }
  const ahead = upcoming.length ? [{ key: "upcoming", label: "Upcoming", credits: upcoming }] : [];
  return [...ahead, ...decades];
}

/** What they did on a film: the character, or the jobs. */
export const creditRole = (credit: PersonCredit) => credit.character || credit.jobs?.join(", ") || null;
