import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Popcorn } from "lucide-react";
import { imageSrc } from "../format";

/** Three posters across at every width, close-set like a photo grid. */
export function PosterGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-3 gap-1 sm:gap-2">
      {children}
    </ul>
  );
}

/**
 * One film as a poster. The title rests on a gradient that rises on hover;
 * `badge` and `corner` sit in the top corners over a soft shade.
 */
export function PosterTile({
  href,
  title,
  poster,
  caption,
  badge,
  corner,
  index = 0,
}: {
  href: string;
  title: string;
  poster: string | null;
  /** A short line under the title, such as the year. */
  caption?: ReactNode;
  badge?: ReactNode;
  corner?: ReactNode;
  /** Staggers the entrance. */
  index?: number;
}) {
  const src = imageSrc(poster, "w500");
  return (
    <li
      className="motion-safe:animate-poster-in"
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
    >
      <Link
        href={href}
        className="group relative block aspect-[2/3] overflow-hidden rounded-md bg-media outline-offset-2 sm:rounded-lg"
      >
        {src ? (
          <img
            src={src}
            alt={`${title} poster`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-700 via-media to-media p-3 text-center text-media-foreground/50">
            <Popcorn size={28} aria-hidden="true" />
            <span className="line-clamp-3 text-sm font-semibold text-white/80">{title}</span>
          </span>
        )}

        {(badge || corner) && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
          />
        )}
        {badge && <span className="absolute left-1.5 top-1.5 sm:left-2.5 sm:top-2.5">{badge}</span>}
        {corner && <span className="absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5">{corner}</span>}

        <span
          className={clsx(
            "pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2.5 pb-2.5 pt-14 text-white sm:px-3.5 sm:pb-3.5",
            "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
            "max-sm:hidden",
          )}
        >
          <span className="line-clamp-2 text-[15px] font-semibold leading-tight tracking-[-0.02em] drop-shadow">{title}</span>
          {caption && <span className="mt-1 text-xs font-medium text-white/70">{caption}</span>}
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
        />
      </Link>
    </li>
  );
}

export function PosterGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-1 sm:gap-2">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="aspect-[2/3] rounded-md bg-surface motion-safe:animate-pulse sm:rounded-lg" />
      ))}
    </div>
  );
}

/** A centered note for an empty tab. */
export function GridEmpty({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line text-accent">
        {icon}
      </span>
      <p className="text-lg font-semibold tracking-[-0.02em]">{title}</p>
      <p className="text-[15px] text-muted">{body}</p>
      {action}
    </div>
  );
}
