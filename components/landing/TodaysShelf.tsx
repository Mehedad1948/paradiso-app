import { todaysPicks } from "@/services/curations";
import LibraryCarousel from "./LibraryCarousel";

/** Today's draw from the editors' picks on the glass shelf; left out when there is nothing to show. */
export default async function TodaysShelf() {
  const films = await todaysPicks();
  if (!films.length) return null;
  return (
    <section
      id="the-library"
      className="mx-auto max-w-[1600px] scroll-mt-32 border-t border-line pt-[clamp(56px,7vw,112px)]"
      aria-labelledby="library-title"
    >
      <div className="flex items-end justify-between gap-10 max-sm:flex-col max-sm:items-start max-sm:gap-6">
        <div>
          <span className="mb-6 block font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-accent">
            06 <span className="px-2 text-muted">/</span> The library
          </span>
          <h2
            id="library-title"
            className="text-[clamp(38px,4.8vw,76px)] font-semibold leading-[1.04] tracking-[-0.065em] [&>span]:font-serif [&>span]:font-normal [&>span]:italic [&>span]:tracking-[-0.045em]"
          >
            Tonight&apos;s lineup,
            <br />
            <span>already on the shelf.</span>
          </h2>
        </div>
      </div>
      <div className="-mx-[4.5vw] max-sm:-mx-[5vw]">
        <LibraryCarousel films={films} />
      </div>
    </section>
  );
}
