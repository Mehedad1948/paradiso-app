"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { format, parseISO } from "date-fns";
import { imageSrc } from "@/features/community/format";
import { departmentTitle } from "@/features/people/format";
import PersonLink from "@/features/people/PersonLink";
import type { FeaturedArtist } from "@/types/featured";

type Props = {
  artist: FeaturedArtist;
  /** The card on top of the stack: its link is live, the others stay out of the tab order. */
  active: boolean;
  /** Cards already showing in the stack load at once; the ones waiting at the back, lazily. */
  eager: boolean;
};

// Polished-metal rim: a hairline all round and a brighter lip on top.
const RIM: CSSProperties = {
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.28)",
};
// A soft diagonal band of light across the photo, moved sideways by the cursor.
const SHEEN: CSSProperties = {
  background:
    "linear-gradient(105deg, transparent calc(var(--sx, 35%) - 24%), rgba(255,255,255,0.5) var(--sx, 35%), transparent calc(var(--sx, 35%) + 24%))",
};
const dayLabel = (artist: FeaturedArtist) =>
  artist.isToday ? "Today" : format(parseISO(artist.date), "MMM d");

/**
 * One day's artist as a full-bleed portrait. The top strip is what shows when the card waits
 * behind the stack (date and name); the rest appears once it comes to the front. Light moves
 * across the glass with the cursor — only custom properties change, so it costs no re-render.
 */
export default function ArtistCard({ artist, active, eager }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { person, tagline, knownFor, libraryFilmCount } = artist;
  const src = imageSrc(person.profile_path, "h632");
  const role = departmentTitle(person.knownForDepartment);

  const aim = (event: PointerEvent<HTMLElement>) => {
    const card = ref.current;
    if (!card || event.pointerType === "touch") return;
    const box = card.getBoundingClientRect();
    const x = ((event.clientX - box.left) / Math.max(1, box.width)) * 100;
    card.style.setProperty("--sx", `${(110 - x * 0.9).toFixed(1)}%`);
  };

  return (
    <article
      ref={ref}
      onPointerMove={aim}
      aria-hidden={active ? undefined : true}
      className="group/art relative h-full w-full overflow-hidden rounded-[inherit] bg-[#0e0f12] text-white transition-transform duration-200 ease-out has-[a:active]:scale-[0.99] motion-reduce:transition-none"
    >
      {src && (
        <img
          src={src}
          alt=""
          draggable={false}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[50%_18%] [-webkit-user-drag:none]"
        />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/95 via-black/65 to-transparent"
      />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 pt-3.5">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em]">
          {artist.isToday && (
            <span className="size-1.5 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]" />
          )}
          {dayLabel(artist)}
        </span>
        <span className="min-w-0 truncate text-[13px] font-semibold tracking-[-0.01em] text-white/90">
          {artist.isToday ? "Artist of the day" : person.name}
        </span>
      </header>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-5 pb-5">
        {role && (
          <span className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70">
            {role}
          </span>
        )}
        <h3 className="text-[34px] font-semibold leading-[1] tracking-[-0.05em] text-balance">{person.name}</h3>
        {tagline && (
          <p className="line-clamp-2 font-serif text-[16px] italic leading-snug text-white/75">{tagline}</p>
        )}
        {knownFor.length > 0 && (
          <div className="mt-2 flex items-center gap-3 border-t border-white/15 pt-3">
            <ul className="flex -space-x-2">
              {knownFor.map((film) => (
                <li key={film.tmdbId}>
                  <img
                    src={imageSrc(film.poster_path, "w92") ?? ""}
                    alt=""
                    title={film.title}
                    draggable={false}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                    className="h-[46px] w-[31px] rounded-[4px] object-cover shadow-[0_4px_10px_-2px_rgba(0,0,0,0.8)] ring-1 ring-white/25 [-webkit-user-drag:none]"
                  />
                </li>
              ))}
            </ul>
            <span className="min-w-0 text-[13px] font-medium leading-tight text-white/75">
              {knownFor[0].title}
              {libraryFilmCount ? (
                <span className="block text-white/55">
                  {libraryFilmCount} {libraryFilmCount === 1 ? "film" : "films"} on the Paradiso shelf
                </span>
              ) : null}
            </span>
          </div>
        )}
      </div>

      {/* Glass: a static gloss, then the cursor-driven sheen, which only shows on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.16] via-transparent to-transparent to-30% mix-blend-soft-light"
      />
      <span
        aria-hidden="true"
        style={SHEEN}
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover/art:opacity-100"
      />
      <span aria-hidden="true" style={RIM} className="pointer-events-none absolute inset-0 rounded-[inherit]" />

      <PersonLink
        person={person}
        tabIndex={active ? 0 : -1}
        // A link is natively draggable; that would cancel the card's own drag as soon as it starts.
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white [[data-front]_&]:pointer-events-auto"
      >
        <span className="sr-only">Explore {person.name}</span>
      </PersonLink>
    </article>
  );
}
