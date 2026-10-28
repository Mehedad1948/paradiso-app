"use client";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MovieDetailsView, { HeroButton } from "./MovieDetailsView";

/**
 * A film on its own page: where shared links and refreshes land. Unlike the modal it isn't a card:
 * the backdrop spans the window from under the header and fades into the page, and the text below
 * keeps the content column.
 */
export default function MoviePage() {
  const { movieId } = useParams<{ movieId: string }>();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  // Someone arriving from a shared link has nothing to go back to inside the app.
  const back = () => (window.history.length > 1 ? router.back() : router.push("/community"));

  // 100vw counts a classic scrollbar, so the full-bleed backdrop measures the window without it.
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
      // Pulls the backdrop up under the header (the panel layout pads for it) and fades it into the page.
      className="mx-auto -mt-32 max-w-[1080px] text-ink [--hero-fade:var(--heroui-background)] [--hero-inset:72px] max-sm:-mt-36 md:[--hero-inset:88px]"
    >
      <MovieDetailsView
        movieId={movieId}
        variant="page"
        start={
          <HeroButton label="Back" onPress={back}>
            <ArrowLeft size={19} aria-hidden="true" />
          </HeroButton>
        }
      />
    </div>
  );
}
