"use client";
import { useState } from "react";
import clsx from "clsx";
import { Popcorn } from "lucide-react";

/** TMDb poster, or a placeholder for manually added movies without one or when the image fails to load. */
export default function MoviePoster({
  path,
  title = "",
  size = "w500",
  width,
  height,
  className,
}: {
  path: string | null | undefined;
  title?: string;
  size?: "w92" | "w500";
  width?: number;
  height?: number;
  className?: string;
}) {
  // Remembers which path failed, so a new path gets a fresh try.
  const [failed, setFailed] = useState<string | null>(null);
  if (path && failed !== path)
    return (
      <img
        src={`${process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL || "https://image.tmdb.org/t/p/"}${size}${path}`}
        alt={title}
        width={width}
        height={height}
        loading="lazy"
        onError={() => setFailed(path)}
        className={clsx("object-cover", className)}
      />
    );
  return (
    <div
      role={title ? "img" : undefined}
      aria-label={title ? `${title} (no poster)` : undefined}
      aria-hidden={title ? undefined : true}
      style={{ width, height }}
      className={clsx(
        "flex shrink-0 items-center justify-center bg-blue-900 text-blue-400",
        className,
      )}
    >
      <Popcorn className="h-1/2 max-h-12 w-1/2 max-w-12" />
    </div>
  );
}
