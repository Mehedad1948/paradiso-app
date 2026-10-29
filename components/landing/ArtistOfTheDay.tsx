import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import { departmentTitle } from "@/features/people/format";
import PersonLink from "@/features/people/PersonLink";
import type { FeaturedArtist } from "@/types/featured";
import ArtistStack from "./ArtistStack";

/**
 * Today's featured artist beside a stack of the days before, newest first. The words are plain
 * server HTML; the card stack loads once it is near.
 */
export default function ArtistOfTheDay({
  artists,
  gist,
}: {
  artists: FeaturedArtist[];
  /** The opening sentences of today's artist's biography. */
  gist?: string | null;
}) {
  const today = artists[0];
  if (!today) return null;
  const { person, tagline } = today;
  const role = departmentTitle(person.knownForDepartment);

  return (
    <section
      id="the-artist"
      className="mx-auto grid max-w-[1600px] scroll-mt-32 grid-cols-2 items-center gap-[clamp(24px,4vw,72px)] border-t border-line py-[clamp(56px,7vw,112px)] max-sm:grid-cols-1 max-sm:gap-10"
      aria-labelledby="artist-title"
    >
      <div className="max-w-[560px]">
        <span className="mb-6 block font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-accent">
          05 <span className="px-2 text-muted">/</span> Artist of the day
        </span>
        <h2
          id="artist-title"
          className="text-[clamp(38px,4.8vw,76px)] font-semibold leading-[1.04] tracking-[-0.065em] [&>span]:font-serif [&>span]:font-normal [&>span]:italic [&>span]:tracking-[-0.045em]"
        >
          Meet the artist
          <br />
          <span>behind the film.</span>
        </h2>
        <p className="mt-7 max-w-[460px] text-base leading-[1.75] text-muted">
          Today we&apos;re looking at <br /> <strong className="font-semibold text-ink">{person.name}</strong>
          {role ? <>, the {role.toLowerCase()}</> : null}.
          {tagline ? <> {tagline}.</> : null}
        </p>
        {gist && (
          <p className="mb-2 mt-2 line-clamp-2 max-w-[460px] text-base leading-[1.75] text-muted">{gist}</p>
        )}
        <PersonLink
          person={person}
          className="mt-5 inline-flex items-center gap-5 border-b border-line pb-2 text-[15px] font-semibold [&>svg]:transition-transform hover:[&>svg]:-translate-y-0.5 hover:[&>svg]:translate-x-0.5"
        >
          Explore their work <ArrowRightUpIcon size={18} aria-hidden="true" />
        </PersonLink>
      </div>

      <div className="mx-auto flex w-full min-w-0 max-w-[560px] flex-col gap-10">
        <ArtistStack artists={artists} />
      </div>
    </section>
  );
}
