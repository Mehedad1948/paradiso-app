"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { AltArrowDownIcon, ArrowLeftIcon, CloseIcon, ShareCircleIcon, SquareArrowRightUpIcon, UserRoundedIcon } from "@solar-icons/react/linear";
import BubbleMenu from "@/components/ui/BubbleMenu";
import PopTag from "@/components/ui/PopTag";
import { shareItems } from "@/components/ui/shareItems";
import QueryError from "@/components/ui/QueryError";
import { avatarGradient } from "@/components/ui/avatarGradient";
import { imageSrc } from "@/features/community/format";
import { HeroButton } from "@/features/movies/MovieDetailsView";
import { initials, releaseLabel } from "@/features/movies/format";
import { usePerson } from "@/hooks/queries/usePeopleQueries";
import { BffError } from "@/lib/api/client";
import type { Person } from "@/types/people";
import Filmography from "./components/Filmography";
import PosterDrift from "./components/PosterDrift";
import { ageOf, careerSpan, personIdFrom, roleLine } from "./format";

function Bar({ className }: { className: string }) {
  return <span aria-hidden="true" className={clsx("block rounded-full bg-surface motion-safe:animate-pulse", className)} />;
}

const portraitSize = "w-[118px] sm:w-[188px] lg:w-[228px]";

function Portrait({ person }: { person: Person }) {
  const [failed, setFailed] = useState(false);
  const src = imageSrc(person.profile_path, "w500");
  return (
    <div
      className={clsx(
        "relative aspect-[2/3] shrink-0 overflow-hidden rounded-2xl bg-surface shadow-[0_30px_70px_-20px_rgb(0_0_0_/_55%)] motion-safe:animate-movie-rise sm:rounded-[22px]",
        portraitSize,
      )}
    >
      {src && !failed ? (
        <img src={src} alt={person.name} decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <span
          style={avatarGradient(person.name)}
          className="avatar-placeholder flex h-full w-full items-center justify-center text-4xl font-semibold sm:text-5xl"
        >
          {initials(person.name)}
        </span>
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/15" />
    </div>
  );
}

/** "Born 30 July 1970 · London, England, UK · 56", or the span of a life that's ended. */
function lifeLine(person: Person) {
  const born = releaseLabel(person.birthday);
  const died = releaseLabel(person.deathday);
  const age = ageOf(person);
  return [
    born && died ? `${born} – ${died}` : born ? `Born ${born}` : died ? `Died ${died}` : null,
    person.placeOfBirth,
    age != null && age >= 0 ? (died ? `aged ${age}` : `${age} years old`) : null,
  ].filter((part): part is string => !!part);
}

const quiet =
  "inline-flex h-10 items-center gap-2 rounded-full border border-line bg-elevated/60 px-4 text-[14px] font-semibold text-ink backdrop-blur transition-[background-color,transform] hover:bg-surface active:scale-[0.97]";

/** Long biographies open folded, fading out, with a toggle; the first paragraph reads as a lede. */
function Biography({ person }: { person: Person }) {
  const [open, setOpen] = useState(false);
  const paragraphs = person.biography
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;
  const long = person.biography.length > 640;
  const id = `person-${person.id}-bio`;
  return (
    <section aria-labelledby={`${id}-title`} className="mt-14 motion-safe:animate-movie-rise [animation-delay:180ms]">
      <h2 id={`${id}-title`} className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
        Biography
      </h2>
      <div
        id={id}
        className={clsx(
          "space-y-4 overflow-hidden text-[15.5px] leading-[1.75] text-ink/80",
          long && !open && "max-h-[16rem] [mask-image:linear-gradient(to_bottom,#000_50%,transparent)]",
        )}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={clsx(index === 0 && "font-serif text-[19px] leading-[1.6] text-ink/90 sm:text-[21px]")}>
            {paragraph}
          </p>
        ))}
      </div>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
          className="mt-3 inline-flex items-center gap-1 rounded-full text-[14px] font-semibold text-accent hover:opacity-80"
        >
          {open ? "Show less" : "Read more"}
          <AltArrowDownIcon size={16} aria-hidden="true" className={clsx("transition-transform duration-300", open && "rotate-180")} />
        </button>
      )}
    </section>
  );
}

function Missing({ error, retry }: { error?: Error; retry?: () => void }) {
  if (error && retry && !(error instanceof BffError && (error.status === 404 || error.status === 400)))
    return <QueryError error={error} retry={retry} />;
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-line text-accent">
        <UserRoundedIcon size={26} aria-hidden="true" />
      </span>
      <p className="text-lg font-semibold tracking-[-0.02em]">No one by that name in the archive</p>
      <p className="max-w-[340px] text-[15px] text-muted">We couldn&apos;t find this person. The link may be mistyped.</p>
    </div>
  );
}

function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="mt-10 sm:mt-14">
      <div className="flex items-end gap-4 sm:gap-8">
        <Bar className={clsx("aspect-[2/3] shrink-0 !rounded-2xl", portraitSize)} />
        <div className="flex-1 space-y-3 pb-2">
          <Bar className="h-3.5 w-40" />
          <Bar className="h-10 w-3/4 sm:h-14" />
          <Bar className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-14 space-y-2.5">
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-11/12" />
        <Bar className="h-4 w-4/6" />
      </div>
      <div className="mt-16 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Bar key={index} className="aspect-[2/3] !rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function PersonView({ id }: { id: number }) {
  const query = usePerson(id);
  const person = query.data;

  // Their best-rated posters make the wall behind the hero.
  const posters = useMemo(() => {
    if (!person) return [];
    const seen = new Set<number>();
    return Object.values(person.credits)
      .flat()
      .filter((credit) => credit.poster_path && !seen.has(credit.tmdbId) && seen.add(credit.tmdbId))
      .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
      .slice(0, 16)
      .map((credit) => credit.poster_path!);
  }, [person]);

  if (query.isError && !person) return <Missing error={query.error} retry={() => void query.refetch()} />;
  if (!person) return <Loading />;

  const roles = roleLine(person);
  const life = lifeLine(person);
  const span = careerSpan(person);
  const stats: [string, number | string, string][] = [
    ["Directed", person.credits.directing.length, "Films they directed."],
    ["Roles", person.credits.acting.length, "Films they acted in."],
    [
      "Crew credits",
      person.credits.crew.length,
      "Films they worked on behind the camera in another role, like producer, writer or editor.",
    ],
  ];
  if (span)
    stats.push([
      "Career",
      span.from === span.to ? `${span.from}` : `${span.from}–${span.to}`,
      "The years of their first and latest film releases.",
    ]);
  const shown = stats.filter(([, value]) => value);
  const glow = imageSrc(person.profile_path, "w185");

  return (
    <article>
      {/* Full-bleed ambience from under the header: a wash of the portrait's colours beneath the drifting wall of their work. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 ml-[calc(50%-var(--page-width,100vw)/2)] h-[clamp(560px,88svh,860px)] w-[var(--page-width,100vw)] overflow-hidden"
      >
        {glow && (
          <img
            src={glow}
            alt=""
            className="absolute left-[6%] top-[18%] h-[60%] w-[50%] object-cover opacity-30 blur-[100px] saturate-150 dark:opacity-25"
          />
        )}
        <PosterDrift posters={posters} />
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-hero-fade/0 via-hero-fade/70 to-hero-fade" />
      </div>

      <header className="relative">
        <div className="relative mt-10 flex items-end gap-4 sm:mt-14 sm:gap-8">
          <Portrait person={person} />
          <div className="min-w-0 flex-1 pb-1 motion-safe:animate-movie-rise [animation-delay:80ms]">
            {roles.length > 0 && (
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-accent sm:mb-3 sm:text-[13px]">
                {roles.join(" · ")}
              </p>
            )}
            <h1 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.04em] [text-wrap:balance] sm:text-[52px] lg:text-[64px]">
              {person.name}
            </h1>
            {life.length > 0 && (
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted sm:text-[15px]">
                {life.map((part, index) => (
                  <span key={part} className="inline-flex items-center gap-2">
                    {index > 0 && (
                      <span aria-hidden="true" className="text-muted/60">
                        ·
                      </span>
                    )}
                    {part}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 motion-safe:animate-movie-rise [animation-delay:140ms]">
          {shown.length > 0 && (
            <dl className="flex flex-wrap gap-x-9 gap-y-4">
              {shown.map(([label, value, hint], index) => (
                <PopTag key={label} bare multiline content={hint} tilt={index % 2 ? 8 : -8}>
                  <div
                    tabIndex={0}
                    className="flex cursor-default flex-col-reverse rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
                    <dd className="text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[30px]">{value}</dd>
                  </div>
                </PopTag>
              ))}
            </dl>
          )}
          <div className="flex flex-wrap gap-2">
            {person.imdbId && (
              <a
                href={`https://www.imdb.com/name/${encodeURIComponent(person.imdbId)}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={quiet}
              >
                IMDb <SquareArrowRightUpIcon size={15} aria-hidden="true" />
              </a>
            )}
            <BubbleMenu
              label="Share"
              items={typeof window === "undefined" ? [] : shareItems({ url: window.location.href, text: person.name })}
              triggerClassName={clsx(quiet, "w-10 justify-center px-0 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:scale-110")}
              bubbleClassName="bg-elevated text-ink shadow-[0_2px_4px_rgb(0_0_0_/_5%),0_10px_24px_-8px_rgb(0_0_0_/_25%)] transition-colors dark:bg-surface [&_svg]:h-[17px] [&_svg]:w-[17px]"
              // Share ends the row at the right edge, so the bubbles fan up and to the left.
              startAngle={180}
              endAngle={300}
              radius={72}
            >
              {(open) => (open ? <CloseIcon size={18} strokeWidth={1.75} aria-hidden="true" /> : <ShareCircleIcon size={17} aria-hidden="true" />)}
            </BubbleMenu>
          </div>
        </div>
      </header>

      <Biography person={person} />
      <Filmography person={person} />

      <p className="pt-12 text-xs text-muted">
        Person data from{" "}
        <a
          href={`https://www.themoviedb.org/person/${person.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line underline-offset-2 hover:text-ink"
        >
          TMDb
        </a>
        .
      </p>
    </article>
  );
}

/**
 * A director's or actor's page: their portrait over a slow drift of their own posters, the facts
 * of a life, a biography, and a filmography that reads decade by decade. Films open over the page.
 */
export default function PersonPage() {
  const { personId } = useParams<{ personId: string }>();
  const id = personIdFrom(personId);
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  // Someone arriving from a shared link has nothing to go back to inside the app.
  const back = () => (window.history.length > 1 ? router.back() : router.push("/community"));

  // 100vw counts a classic scrollbar, so the full-bleed ambience measures the window without it.
  useEffect(() => {
    const page = document.documentElement;
    const measure = () => root.current?.style.setProperty("--page-width", `${page.clientWidth}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={root}
      // Pulls the ambience up under the header (the panel layout pads for it) and fades it into the page.
      className="relative mx-auto -mt-32 max-w-[1080px] pb-6 pt-[calc(var(--hero-inset)+20px)] text-ink [--hero-fade:var(--heroui-background)] [--hero-inset:72px] max-sm:-mt-36 max-sm:pt-[calc(var(--hero-inset)+12px)] md:[--hero-inset:88px]"
    >
      <div className="relative z-10">
        <HeroButton label="Back" onPress={back}>
          <ArrowLeftIcon size={19} aria-hidden="true" />
        </HeroButton>
      </div>
      {id == null ? <Missing /> : <PersonView key={id} id={id} />}
    </div>
  );
}
