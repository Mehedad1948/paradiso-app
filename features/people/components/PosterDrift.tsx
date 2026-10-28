import { imageSrc } from "@/features/community/format";

/** Posters per row before doubling: enough that half a doubled row outruns a wide screen. */
const ROW_LENGTH = 14;

function fill(paths: string[]) {
  const row = [...paths];
  while (row.length < ROW_LENGTH) row.push(...paths);
  return row;
}

/**
 * Two faint rows of the person's own posters drifting past in opposite directions, tilted and
 * fading out downwards: their body of work as a quiet wall behind their name. Holds still for
 * readers who prefer reduced motion.
 */
export default function PosterDrift({ posters }: { posters: string[] }) {
  if (posters.length < 4) return null;
  const rows = [posters.filter((_, index) => index % 2 === 0), posters.filter((_, index) => index % 2 === 1)];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_25%,transparent_90%)]"
    >
      <div className="absolute -inset-x-[15%] -top-[6%] flex -rotate-[7deg] flex-col gap-3 opacity-[0.14] saturate-[0.7] sm:gap-4 dark:opacity-[0.2]">
        {rows.map((row, index) => {
          const loop = fill(row);
          return (
            <div
              key={index}
              className="flex w-max gap-3 motion-safe:animate-person-drift sm:gap-4"
              style={{ animationDirection: index ? "reverse" : "normal", animationDuration: `${150 + index * 50}s` }}
            >
              {[...loop, ...loop].map((path, position) => (
                <img
                  key={position}
                  src={imageSrc(path, "w185")!}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-[104px] shrink-0 rounded-xl object-cover sm:w-[148px]"
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
