"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AltArrowLeftIcon, AltArrowRightIcon } from "@solar-icons/react/linear";
import { avatarGradient } from "@/components/ui/avatarGradient";
import { imageSrc } from "@/features/community/format";
import type { MovieCastMember } from "@/types/movies";
import PersonLink from "@/features/people/PersonLink";
import { initials } from "../format";

function Portrait({ person }: { person: MovieCastMember }) {
  const [failed, setFailed] = useState(false);
  const src = imageSrc(person.profile_path, "w185");
  return (
    <span className="relative block aspect-[2/3] overflow-hidden rounded-2xl bg-surface">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cast:scale-[1.06]"
        />
      ) : (
        <span
          style={avatarGradient(person.name)}
          className="avatar-placeholder flex h-full w-full items-center justify-center text-2xl font-semibold"
        >
          {initials(person.name)}
        </span>
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10 dark:ring-white/10" />
    </span>
  );
}

function CastCard({ person }: { person: MovieCastMember }) {
  return (
    <>
      <Portrait person={person} />
      <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-tight">{person.name}</p>
      {person.character && <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{person.character}</p>}
    </>
  );
}

/**
 * Top-billed cast as a row of portraits that scrolls sideways; arrows appear where it overflows.
 * Each portrait opens the actor's page.
 */
export default function CastRail({ cast }: { cast: MovieCastMember[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const list = rail.current;
    if (!list) return;
    const measure = () =>
      setEdges({
        start: list.scrollLeft > 4,
        end: list.scrollLeft + list.clientWidth < list.scrollWidth - 4,
      });
    measure();
    list.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => {
      list.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [cast]);

  const step = (direction: 1 | -1) =>
    rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="group/rail relative">
      <ul
        ref={rail}
        aria-label="Top-billed cast"
        data-start={edges.start || undefined}
        data-end={edges.end || undefined}
        className="movie-rail -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:scroll-px-8 sm:px-8"
      >
        {cast.map((person, index) => (
          <li
            key={person.id ?? `${person.name}-${index}`}
            className="group/cast w-[96px] shrink-0 snap-start motion-safe:animate-movie-rise sm:w-[108px]"
            style={{ animationDelay: `${160 + index * 45}ms` }}
          >
            {person.id != null ? (
              <PersonLink
                person={{ id: person.id, name: person.name }}
                className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <CastCard person={person} />
              </PersonLink>
            ) : (
              <CastCard person={person} />
            )}
          </li>
        ))}
      </ul>
      {(
        [
          [-1, edges.start, "left-1 sm:left-3", AltArrowLeftIcon, "Earlier cast"],
          [1, edges.end, "right-1 sm:right-3", AltArrowRightIcon, "More cast"],
        ] as const
      ).map(([direction, visible, side, Icon, label]) => (
        <button
          key={direction}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => step(direction)}
          className={clsx(
            "absolute top-[64px] z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-elevated/90 text-ink shadow-lg backdrop-blur-md transition-[opacity,transform] duration-300 hover:scale-105 sm:flex",
            side,
            visible ? "opacity-0 group-hover/rail:opacity-100" : "pointer-events-none opacity-0",
          )}
          title={label}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
